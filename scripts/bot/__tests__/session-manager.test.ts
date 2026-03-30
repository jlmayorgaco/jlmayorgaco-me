import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager, type UserSession } from '../session-manager';
import { logger } from '../logger';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  logDebug: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager({
      ttlMs: 1000, // 1 second for testing
      cleanupIntervalMs: 100,
    });
  });

  afterEach(() => {
    sessionManager.stop();
  });

  describe('getSession', () => {
    it('should create new session for new chat', () => {
      const session = sessionManager.getSession(123);
      
      expect(session).toBeDefined();
      expect(session.state).toBe('idle');
      expect(session.papers).toEqual([]);
      expect(session.createdAt).toBeGreaterThan(0);
    });

    it('should return existing session for same chat', () => {
      const session1 = sessionManager.getSession(123);
      session1.userComment = 'Test comment';
      
      const session2 = sessionManager.getSession(123);
      
      expect(session2.userComment).toBe('Test comment');
    });

    it('should create new session after TTL expires', async () => {
      const session1 = sessionManager.getSession(123);
      session1.userComment = 'Old comment';
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const session2 = sessionManager.getSession(123);
      
      expect(session2.userComment).toBe('');
      expect(session2).not.toBe(session1);
    });
  });

  describe('updateSession', () => {
    it('should update session fields', () => {
      const session = sessionManager.getSession(123);
      
      sessionManager.updateSession(123, { state: 'collecting_comment' });
      
      const updated = sessionManager.getSession(123);
      expect(updated.state).toBe('collecting_comment');
    });

    it('should update last activity timestamp', async () => {
      const session = sessionManager.getSession(123);
      const originalActivity = session.lastActivity;
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      sessionManager.updateSession(123, { userComment: 'Test' });
      
      const updated = sessionManager.getSession(123);
      expect(updated.lastActivity).toBeGreaterThan(originalActivity);
    });
  });

  describe('deleteSession', () => {
    it('should delete session', () => {
      sessionManager.getSession(123);
      
      const deleted = sessionManager.deleteSession(123);
      
      expect(deleted).toBe(true);
      expect(sessionManager.hasSession(123)).toBe(false);
    });

    it('should return false for non-existent session', () => {
      const deleted = sessionManager.deleteSession(999);
      
      expect(deleted).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired sessions', async () => {
      sessionManager.getSession(123);
      sessionManager.getSession(456);
      
      expect(sessionManager.sessionCount).toBe(2);
      
      // Wait for TTL + cleanup interval
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Force cleanup by calling getMetrics
      const metrics = sessionManager.getMetrics();
      
      expect(metrics.expiredSessions).toBe(2);
    });
  });

  describe('metrics', () => {
    it('should return session metrics', () => {
      sessionManager.getSession(123);
      sessionManager.getSession(456);
      
      const metrics = sessionManager.getMetrics();
      
      expect(metrics.totalSessions).toBe(2);
      expect(metrics.activeSessions).toBe(2);
    });
  });
});
