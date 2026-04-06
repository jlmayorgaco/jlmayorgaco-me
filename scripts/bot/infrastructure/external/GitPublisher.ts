/**
 * Safe git operations with async execution
 * Production-ready: no command injection, proper error handling, rollback support
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { logError, logInfo } from '../logging/Logger';
import { safeValidate, FilePathSchema } from '../../shared/validation';
import { withRetry } from '../../shared/utils';

const execFileAsync = promisify(execFile);

export interface PublishResult {
  success: boolean;
  commitHash?: string;
  message: string;
  details?: {
    staged: boolean;
    committed: boolean;
    pushed: boolean;
  };
}

export interface GitStatus {
  isRepo: boolean;
  hasChanges: boolean;
  branch: string;
  remoteConfigured: boolean;
}

/**
 * Check if we're in a git repository and get status
 */
export async function checkGitStatus(cwd: string = process.cwd()): Promise<GitStatus> {
  try {
    const { stdout: isRepo } = await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd });
    
    if (!isRepo.trim()) {
      return { isRepo: false, hasChanges: false, branch: '', remoteConfigured: false };
    }

    const { stdout: branch } = await execFileAsync('git', ['branch', '--show-current'], { cwd });
    const { stdout: status } = await execFileAsync('git', ['status', '--porcelain'], { cwd });
    
    let remoteConfigured = false;
    try {
      await execFileAsync('git', ['remote', 'get-url', 'origin'], { cwd });
      remoteConfigured = true;
    } catch {}

    return {
      isRepo: true,
      hasChanges: status.trim().length > 0,
      branch: branch.trim(),
      remoteConfigured,
    };
  } catch (error) {
    logError('Failed to check git status', error as Error);
    return { isRepo: false, hasChanges: false, branch: '', remoteConfigured: false };
  }
}

/**
 * Stage, commit, and push a file safely
 * No command injection possible - uses array arguments
 */
export async function gitAddCommitPush(
  filePath: string,
  commitMessage: string,
  cwd: string = process.cwd()
): Promise<PublishResult> {
  // Validate inputs
  const pathValidation = safeValidate(FilePathSchema, filePath);
  if (!pathValidation.success) {
    return {
      success: false,
      message: `Invalid file path: ${pathValidation.errors?.join(', ')}`,
    };
  }

  if (!commitMessage || commitMessage.length > 1000) {
    return {
      success: false,
      message: 'Invalid commit message',
    };
  }

  const details = {
    staged: false,
    committed: false,
    pushed: false,
  };

  try {
    // Check git status first
    const status = await checkGitStatus(cwd);
    
    if (!status.isRepo) {
      return { success: false, message: 'Not a git repository' };
    }

    if (!status.remoteConfigured) {
      return { success: false, message: 'No remote configured' };
    }

    // Stage the file (SAFE: uses array, no shell interpolation)
    logInfo('Staging file', { filePath });
    await execFileAsync('git', ['add', filePath], { cwd });
    details.staged = true;

    // Check if there are changes to commit
    const { stdout: statusOutput } = await execFileAsync(
      'git', ['status', '--porcelain'], { cwd }
    );

    if (!statusOutput.trim()) {
      return { success: true, message: 'No changes to commit' };
    }

    // Commit (SAFE: message passed as array element)
    logInfo('Creating commit', { message: commitMessage.slice(0, 50) });
    await execFileAsync('git', ['commit', '-m', commitMessage], { cwd });
    details.committed = true;

    // Get commit hash
    const { stdout: hashOutput } = await execFileAsync(
      'git', ['rev-parse', '--short', 'HEAD'], { cwd }
    );
    const commitHash = hashOutput.trim();

    // Push
    logInfo('Pushing to remote');
    await execFileAsync('git', ['push', 'origin', status.branch], { cwd });
    details.pushed = true;

    logInfo('Successfully published', { commitHash, filePath });

    return {
      success: true,
      commitHash,
      message: `Published: ${commitHash}`,
      details,
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    logError('Git operation failed', error as Error, { filePath, details });

    // Attempt rollback if we staged but didn't push
    if (details.staged && !details.pushed) {
      try {
        await execFileAsync('git', ['reset', 'HEAD', filePath], { cwd });
        logInfo('Rolled back staged file', { filePath });
      } catch (rollbackError) {
        logError('Rollback failed', rollbackError as Error);
      }
    }

    // Provide helpful error messages
    if (errorMessage.includes('nothing to commit')) {
      return { success: false, message: 'No changes to commit' };
    }
    if (errorMessage.toLowerCase().includes('could not resolve host')) {
      return { success: false, message: 'Network error: Cannot reach git remote' };
    }
    if (errorMessage.includes('merge conflict')) {
      return { success: false, message: 'Merge conflict detected. Please resolve manually.' };
    }
    if (errorMessage.includes('permission denied')) {
      return { success: false, message: 'Permission denied. Check git credentials.' };
    }

    return {
      success: false,
      message: `Git error: ${errorMessage.substring(0, 200)}`,
    };
  }
}

/**
 * Publish a blog post with retry logic
 */
export async function publishPost(
  postPath: string,
  title: string,
  cwd: string = process.cwd()
): Promise<PublishResult> {
  const date = new Date().toISOString().split('T')[0];
  const commitMsg = `blog: ${title.substring(0, 60)}

Auto-generated post via JLMT Lab Bot
Date: ${date}`;

  // Retry on transient failures
  return withRetry(
    () => gitAddCommitPush(postPath, commitMsg, cwd),
    {
      maxRetries: 3,
      baseDelay: 2000,
      onRetry: (error, attempt) => {
        logInfo(`Retrying git push (attempt ${attempt})`, { error: error.message });
      },
    }
  );
}

/**
 * Check if git is properly configured
 */
export async function validateGitSetup(cwd: string = process.cwd()): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  const status = await checkGitStatus(cwd);

  if (!status.isRepo) {
    errors.push('Not a git repository');
  }

  if (!status.remoteConfigured) {
    errors.push('No git remote configured');
  }

  // Check git user config
  try {
    await execFileAsync('git', ['config', 'user.email'], { cwd });
    await execFileAsync('git', ['config', 'user.name'], { cwd });
  } catch {
    errors.push('Git user name and email not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

