import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { 
  gitAddCommitPush, 
  publishPost, 
  checkGitStatus, 
  validateGitSetup,
  type PublishResult 
} from '../infrastructure/external/GitPublisher';

const execFileAsync = promisify(execFile);

// Mock child_process
vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn),
}));

vi.mock('../infrastructure/logging/Logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe('Publisher Module (Production)', () => {
  const mockedExecFile = vi.mocked(execFile);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkGitStatus', () => {
    it('should return valid status for good repo', async () => {
      mockedExecFile
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'main', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'M  test.md', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'git@github.com:user/repo.git', stderr: '' });

      const status = await checkGitStatus();

      expect(status.isRepo).toBe(true);
      expect(status.branch).toBe('main');
      expect(status.hasChanges).toBe(true);
      expect(status.remoteConfigured).toBe(true);
    });

    it('should handle non-git directory', async () => {
      mockedExecFile.mockRejectedValueOnce(new Error('not a git repository'));

      const status = await checkGitStatus();

      expect(status.isRepo).toBe(false);
    });
  });

  describe('gitAddCommitPush', () => {
    it('should successfully publish with safe path', async () => {
      mockedExecFile
        // checkGitStatus calls (4 calls)
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' }) // git rev-parse --git-dir
        .mockResolvedValueOnce({ stdout: 'main', stderr: '' }) // git branch --show-current
        .mockResolvedValueOnce({ stdout: 'M  test.md', stderr: '' }) // git status --porcelain
        .mockResolvedValueOnce({ stdout: 'git@github.com:user/repo.git', stderr: '' }) // git remote get-url origin
        // gitAddCommitPush calls (5 calls)
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git add
        .mockResolvedValueOnce({ stdout: 'M  test.md', stderr: '' }) // git status --porcelain
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git commit
        .mockResolvedValueOnce({ stdout: 'abc1234', stderr: '' }) // git rev-parse --short HEAD
        .mockResolvedValueOnce({ stdout: '', stderr: '' }); // git push

      const result: PublishResult = await gitAddCommitPush(
        'src/content/blog/test.md',
        'blog: Test Post'
      );

      expect(result.success).toBe(true);
      expect(result.commitHash).toBe('abc1234');
      expect(result.details?.staged).toBe(true);
      expect(result.details?.committed).toBe(true);
      expect(result.details?.pushed).toBe(true);
    });

    it('should reject path with directory traversal', async () => {
      const result: PublishResult = await gitAddCommitPush(
        '../../../etc/passwd',
        'blog: Test'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid file path');
    });

    it('should reject path with shell metacharacters', async () => {
      const result: PublishResult = await gitAddCommitPush(
        'test.md; rm -rf /',
        'blog: Test'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid characters');
    });

    it('should rollback on push failure', async () => {
      mockedExecFile
        // checkGitStatus calls
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' }) // git rev-parse --git-dir
        .mockResolvedValueOnce({ stdout: 'main', stderr: '' }) // git branch --show-current
        .mockResolvedValueOnce({ stdout: 'M  test.md', stderr: '' }) // git status --porcelain
        .mockResolvedValueOnce({ stdout: 'git@github.com:user/repo.git', stderr: '' }) // git remote get-url origin
        // gitAddCommitPush calls
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git add
        .mockResolvedValueOnce({ stdout: 'M  test.md', stderr: '' }) // git status --porcelain
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // git commit
        .mockResolvedValueOnce({ stdout: 'abc1234', stderr: '' }) // git rev-parse --short HEAD
        .mockRejectedValueOnce(new Error('push failed')); // git push fails

      const result: PublishResult = await gitAddCommitPush(
        'src/content/blog/test.md',
        'blog: Test Post'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Git error');
    });

    it('should handle network errors gracefully', async () => {
      mockedExecFile
        // checkGitStatus calls
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'main', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'M  test.md', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'git@github.com:user/repo.git', stderr: '' })
        // gitAddCommitPush calls
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'M  test.md', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'abc1234', stderr: '' })
        .mockRejectedValueOnce(new Error('Could not resolve host'));

      const result: PublishResult = await gitAddCommitPush(
        'test.md',
        'blog: Test'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('publishPost', () => {
    it('should generate proper commit message', async () => {
      mockedExecFile
        // checkGitStatus calls
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'main', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'M  test.md', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'git@github.com:user/repo.git', stderr: '' })
        // gitAddCommitPush calls
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'M  test.md', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'abc1234', stderr: '' })
        .mockResolvedValueOnce({ stdout: '', stderr: '' });

      await publishPost('test.md', 'My Blog Post Title');

      const commitCall = mockedExecFile.mock.calls.find(
        call => call[1]?.[0] === 'commit'
      );
      
      expect(commitCall?.[1]?.[2]).toContain('blog: My Blog Post Title');
      expect(commitCall?.[1]?.[2]).toContain('Auto-generated');
    });
  });

  describe('validateGitSetup', () => {
    it('should pass for valid setup', async () => {
      mockedExecFile
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'git@github.com:user/repo.git', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'user@example.com', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'User Name', stderr: '' });

      const result = await validateGitSetup();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing git config', async () => {
      mockedExecFile
        .mockResolvedValueOnce({ stdout: '.git', stderr: '' })
        .mockRejectedValueOnce(new Error('No remote'))
        .mockRejectedValueOnce(new Error('Not configured'));

      const result = await validateGitSetup();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

