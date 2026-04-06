/**
 * Session management with TTL and automatic cleanup
 *
 * @module infrastructure/persistence/SessionManager
 */

import { logDebug, logWarn } from '../logging/Logger';
import type { BlogPostData } from '../formatting/BlogGenerator';
import type { NewsItem } from '../connectors/RssConnector';

export type SessionState =
  | 'idle'
  | 'collecting_comment'
  | 'preview_post'
  | 'confirming_publish';

export interface UserSession {
  state: SessionState;
  papers: Array<{
    id: string;
    title: string;
    summary: string;
    authors: string[];
    published: string;
    categories: string[];
    url: string;
    relevance?: string;
    summaryShort?: string;
    classification?: string;
    relevanceScore?: number;
  }>;
  news: NewsItem[];
  selectedItems: string[];
  userComment: string;
  pendingPost: BlogPostData | null;
  imageQuery: string;
  createdAt: number;
  lastActivity: number;
}

interface SessionEntry {
  data: UserSession;
  lastActivity: number;
}

export interface SessionManagerOptions {
  ttlMs: number;
  cleanupIntervalMs: number;
  maxSessions?: number;
}

export class SessionManager {
  private sessions: Map<number, SessionEntry> = new Map();
  private readonly ttlMs: number;
  private readonly cleanupIntervalMs: number;
  private readonly maxSessions: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: SessionManagerOptions) {
    this.ttlMs = options.ttlMs;
    this.cleanupIntervalMs = options.cleanupIntervalMs;
    this.maxSessions = options.maxSessions || 1000;
    
    this.startCleanupJob();
  }

  getSession(chatId: number): UserSession {
    const entry = this.sessions.get(chatId);
    const now = Date.now();

    if (entry && (now - entry.lastActivity) < this.ttlMs) {
      entry.lastActivity = now;
      return entry.data;
    }

    if (this.sessions.size >= this.maxSessions) {
      this.evictOldestSession();
    }

    const newSession = this.createDefaultSession();
    this.sessions.set(chatId, {
      data: newSession,
      lastActivity: now,
    });

    logDebug('Created new session', { chatId });
    return newSession;
  }

  updateSession(chatId: number, updates: Partial<UserSession>): void {
    const entry = this.sessions.get(chatId);
    if (!entry) {
      logWarn('Attempted to update non-existent session', { chatId });
      return;
    }

    Object.assign(entry.data, updates);
    entry.lastActivity = Date.now();
  }

  deleteSession(chatId: number): boolean {
    const existed = this.sessions.delete(chatId);
    if (existed) {
      logDebug('Deleted session', { chatId });
    }
    return existed;
  }

  hasSession(chatId: number): boolean {
    const entry = this.sessions.get(chatId);
    if (!entry) return false;
    
    const isActive = (Date.now() - entry.lastActivity) < this.ttlMs;
    if (!isActive) {
      this.sessions.delete(chatId);
      return false;
    }
    
    return true;
  }

  get sessionCount(): number {
    return this.sessions.size;
  }

  getMetrics(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    oldestSessionAge: number;
  } {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;
    let oldestAge = 0;

    for (const entry of this.sessions.values()) {
      const age = now - entry.lastActivity;
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

  clear(): void {
    this.sessions.clear();
    logDebug('All sessions cleared');
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  private createDefaultSession(): UserSession {
    return {
      state: 'idle',
      papers: [],
      news: [],
      selectedItems: [],
      userComment: '',
      pendingPost: null,
      imageQuery: '',
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
  }

  private evictOldestSession(): void {
    let oldestChatId: number | null = null;
    let oldestTime = Infinity;

    for (const [chatId, entry] of this.sessions.entries()) {
      if (entry.lastActivity < oldestTime) {
        oldestTime = entry.lastActivity;
        oldestChatId = chatId;
      }
    }

    if (oldestChatId !== null) {
      this.sessions.delete(oldestChatId);
      logWarn('Evicted oldest session due to max capacity', { 
        chatId: oldestChatId,
        capacity: this.maxSessions 
      });
    }
  }

  private startCleanupJob(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupIntervalMs);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [chatId, entry] of this.sessions.entries()) {
      if ((now - entry.lastActivity) > this.ttlMs) {
        this.sessions.delete(chatId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logDebug('Cleaned up expired sessions', { count: cleanedCount });
    }
  }
}

let sessionManagerInstance: SessionManager | null = null;

export function initializeSessionManager(options: SessionManagerOptions): SessionManager {
  if (sessionManagerInstance) {
    throw new Error('Session manager already initialized');
  }
  sessionManagerInstance = new SessionManager(options);
  return sessionManagerInstance;
}

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    throw new Error('Session manager not initialized');
  }
  return sessionManagerInstance;
}

export function destroySessionManager(): void {
  if (sessionManagerInstance) {
    sessionManagerInstance.stop();
    sessionManagerInstance = null;
  }
}

