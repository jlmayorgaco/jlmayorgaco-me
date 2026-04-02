/**
 * Git Publisher Service Adapter
 * Implements IPublisher port using legacy publisher.ts
 */

import type { 
  IPublisher, 
  PublishResult, 
  GitValidationResult 
} from '../../application/ports';
import { logDebug, logError, logInfo } from '../../logger';

// Import legacy functions
import { 
  gitAddCommitPush, 
  validateGitSetup 
} from '../../publisher';

export class GitPublisherServiceAdapter implements IPublisher {
  async publishPost(
    filePath: string, 
    title: string
  ): Promise<PublishResult> {
    try {
      logDebug('Publishing post via git', { filePath, title });

      const result = await gitAddCommitPush(filePath, `blog: ${title}`);

      logInfo('Post published', { 
        filePath, 
        success: result.success,
        commitHash: result.commitHash 
      });

      return result;

    } catch (error) {
      logError('GitPublisher failed', error as Error);
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }

  async validateSetup(): Promise<GitValidationResult> {
    try {
      logDebug('Validating git setup');

      const result = await validateGitSetup();

      return result;

    } catch (error) {
      logError('Git validation failed', error as Error);
      return {
        valid: false,
        errors: [(error as Error).message],
      };
    }
  }
}
