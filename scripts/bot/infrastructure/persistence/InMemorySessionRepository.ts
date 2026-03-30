import { Session, SessionData } from '../../domain/entities/Session';
import { ISessionRepository, SessionMetrics } from '../../application/ports';
import { logDebug, logWarn } from '../../logger';
import { CONSTANTS } from '../../shared/constants';

/**
 * In-Memory Session Repository
 * Used for development and single-instance deployments
 */
export class InMemorySessionRepository implements ISessionRepository {
  private sessions: Map<number, Session> = new Map();
  private readonly ttlMs: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(ttlMinutes: number = CONSTANTS.SESSION.DEFAULT_TTL_MINUTES) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.startCleanupJob();
  }

  async get(chatId: number): Promise<Session> {
    const session = this.sessions.get(chatId);
    
    if (session && !this.isExpired(session)) {
      return session;
    }

    // Create new session
    const newSession = new Session(chatId);
    this.sessions.set(chatId, newSession);
    logDebug('Created new session', { chatId });
    
    return newSession;
  }

  async save(chatId: number, session: Session): Promise<void> {
    this.sessions.set(chatId, session);
  }

  async delete(chatId: number): Promise<void> {
    const existed = this.sessions.delete(chatId);
    if (existed) {
      logDebug('Deleted session', { chatId });
    }
  }

  async exists(chatId: number): Promise<boolean> {
    const session = this.sessions.get(chatId);
    return session !== undefined && !this.isExpired(session);
  }

  async getAll(): Promise<Map<number, Session>> {
    const now = Date.now();
    const validSessions = new Map<number, Session>();

    for (const [chatId, session] of this.sessions.entries()) {
      if (!this.isExpired(session)) {
        validSessions.set(chatId, session);
      }
    }

    return validSessions;
  }

  async getMetrics(): Promise<SessionMetrics> {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;
    let oldestAge = 0;

    for (const session of this.sessions.values()) {
      const age = now - session.lastActivity.getTime();
      if (age < this.ttlMs) {
        activeCount++;
      } else {
        expiredCount++;
      }
      oldestAge = Math.max(oldestAge, age);
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions: activeCount,
      expiredSessions: expiredCount,
      oldestSessionAge: oldestAge,
    };
  }

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private isExpired(session: Session): boolean {
    return Date.now() - session.lastActivity.getTime() > this.ttlMs;
  }

  private startCleanupJob(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, CONSTANTS.SESSION.CLEANUP_INTERVAL_MS);

    // Prevent keeping process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [chatId, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > this.ttlMs) {
        this.sessions.delete(chatId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logDebug('Cleaned up expired sessions', { count: cleanedCount });
    }
  }
}
