/**
 * Redis Session Repository
 * For distributed deployments and persistence
 */

import { Session, SessionData } from '../../domain/entities/Session';
import { ISessionRepository, SessionMetrics } from '../../application/ports';
import { logDebug, logError, logWarn } from '../../logger';
import { CONSTANTS } from '../../shared/constants';

// Simple Redis interface (you can replace with actual ioredis or redis imports)
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  expire(key: string, seconds: number): Promise<void>;
  exists(key: string): Promise<number>;
}

export class RedisSessionRepository implements ISessionRepository {
  private readonly keyPrefix = 'session:';
  private readonly ttlSeconds: number;

  constructor(
    private redis: RedisClient,
    ttlMinutes: number = CONSTANTS.SESSION.DEFAULT_TTL_MINUTES
  ) {
    this.ttlSeconds = ttlMinutes * 60;
  }

  async get(chatId: number): Promise<Session> {
    const key = this.getKey(chatId);
    const data = await this.redis.get(key);

    if (data) {
      try {
        const sessionData: SessionData = JSON.parse(data);
        // Restore dates
        sessionData.createdAt = new Date(sessionData.createdAt);
        sessionData.lastActivity = new Date(sessionData.lastActivity);
        
        const session = Session.fromData(sessionData);
        logDebug('Restored session from Redis', { chatId });
        return session;
      } catch (error) {
        logError('Failed to parse session data', error as Error, { chatId });
      }
    }

    // Create new session
    const session = new Session(chatId);
    await this.save(chatId, session);
    logDebug('Created new session in Redis', { chatId });
    
    return session;
  }

  async save(chatId: number, session: Session): Promise<void> {
    const key = this.getKey(chatId);
    const data = JSON.stringify(session.toData());
    
    // Use Redis EX to automatically handle TTL
    await this.redis.set(key, data, 'EX', this.ttlSeconds);
  }

  async delete(chatId: number): Promise<void> {
    const key = this.getKey(chatId);
    await this.redis.del(key);
    logDebug('Deleted session from Redis', { chatId });
  }

  async exists(chatId: number): Promise<boolean> {
    const key = this.getKey(chatId);
    const count = await this.redis.exists(key);
    return count > 0;
  }

  async getAll(): Promise<Map<number, Session>> {
    const keys = await this.redis.keys(`${this.keyPrefix}*`);
    const sessions = new Map<number, Session>();

    for (const key of keys) {
      const chatId = parseInt(key.replace(this.keyPrefix, ''), 10);
      try {
        const session = await this.get(chatId);
        sessions.set(chatId, session);
      } catch (error) {
        logWarn('Failed to load session', { chatId, error: (error as Error).message });
      }
    }

    return sessions;
  }

  async getMetrics(): Promise<SessionMetrics> {
    const keys = await this.redis.keys(`${this.keyPrefix}*`);
    const totalSessions = keys.length;
    
    // For active sessions, we'd need to check TTL on each key
    // In practice, Redis handles expiration, so all keys are "active"
    return {
      totalSessions,
      activeSessions: totalSessions,
      expiredSessions: 0, // Redis auto-expires
      oldestSessionAge: 0, // Would need additional tracking
    };
  }

  private getKey(chatId: number): string {
    return `${this.keyPrefix}${chatId}`;
  }
}
