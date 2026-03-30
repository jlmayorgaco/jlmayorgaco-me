/**
 * In-Memory Paper History Repository
 * For personal use - tracks seen papers in memory
 * Can be persisted to file if needed
 */

import { 
  IPaperHistoryRepository, 
  PaperRecord, 
  UserAction 
} from '../../application/ports/PaperHistoryPort';
import { logDebug, logInfo } from '../../logger';

export class InMemoryPaperHistoryRepository implements IPaperHistoryRepository {
  private history = new Map<string, PaperRecord>();
  private maxHistorySize: number;

  constructor(maxSize: number = 10000) {
    this.maxHistorySize = maxSize;
  }

  async hasSeen(paperId: string): Promise<boolean> {
    return this.history.has(paperId);
  }

  async recordSeen(paper: PaperRecord): Promise<void> {
    const existing = this.history.get(paper.id);
    
    if (existing) {
      // Update existing record
      existing.lastSeen = new Date();
      existing.seenCount++;
      logDebug('Paper seen again', { paperId: paper.id, count: existing.seenCount });
    } else {
      // Add new record
      this.history.set(paper.id, {
        ...paper,
        firstSeen: new Date(),
        lastSeen: new Date(),
        seenCount: 1,
        userActions: [],
      });
      
      // Cleanup old records if exceeding max size
      if (this.history.size > this.maxHistorySize) {
        this.cleanupOldRecords();
      }
      
      logInfo('New paper recorded', { paperId: paper.id, title: paper.title });
    }
  }

  async getHistory(since?: Date): Promise<PaperRecord[]> {
    const records = Array.from(this.history.values());
    
    if (since) {
      return records.filter(r => r.lastSeen >= since);
    }
    
    return records;
  }

  async recordAction(paperId: string, action: UserAction['action']): Promise<void> {
    const record = this.history.get(paperId);
    
    if (record) {
      record.userActions.push({
        action,
        timestamp: new Date(),
      });
      
      logDebug('User action recorded', { paperId, action });
    }
  }

  async deduplicate<T extends { id: string; title: string }>(
    papers: T[]
  ): Promise<T[]> {
    const unique = papers.filter(paper => {
      if (this.history.has(paper.id)) {
        logDebug('Duplicate paper filtered', { paperId: paper.id, title: paper.title });
        return false;
      }
      return true;
    });

    logInfo('Deduplication complete', { 
      total: papers.length, 
      unique: unique.length, 
      duplicates: papers.length - unique.length 
    });

    return unique;
  }

  getStats(): { total: number; withActions: number } {
    const records = Array.from(this.history.values());
    return {
      total: records.length,
      withActions: records.filter(r => r.userActions.length > 0).length,
    };
  }

  private cleanupOldRecords(): void {
    // Remove oldest 10% of records
    const sorted = Array.from(this.history.entries())
      .sort((a, b) => a[1].lastSeen.getTime() - b[1].lastSeen.getTime());
    
    const toRemove = Math.floor(sorted.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.history.delete(sorted[i][0]);
    }
    
    logInfo('History cleanup performed', { removed: toRemove, remaining: this.history.size });
  }

  // For persistence (optional)
  exportToJSON(): string {
    return JSON.stringify(Array.from(this.history.entries()), null, 2);
  }

  importFromJSON(json: string): void {
    const entries = JSON.parse(json) as [string, PaperRecord][];
    this.history = new Map(entries.map(([k, v]) => [
      k, 
      {
        ...v,
        firstSeen: new Date(v.firstSeen),
        lastSeen: new Date(v.lastSeen),
        userActions: v.userActions.map(a => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })),
      }
    ]));
  }
}
