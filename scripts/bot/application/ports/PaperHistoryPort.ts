/**
 * Paper History Repository Port
 * Tracks seen papers to prevent duplicates
 */

export interface PaperRecord {
  id: string;
  title: string;
  firstSeen: Date;
  lastSeen: Date;
  seenCount: number;
  userActions: UserAction[];
}

export interface UserAction {
  action: 'skipped' | 'read' | 'saved' | 'shared' | 'cited';
  timestamp: Date;
}

export interface IPaperHistoryRepository {
  hasSeen(paperId: string): Promise<boolean>;
  recordSeen(paper: PaperRecord): Promise<void>;
  getHistory(since?: Date): Promise<PaperRecord[]>;
  recordAction(paperId: string, action: UserAction['action']): Promise<void>;
  deduplicate(papers: Array<{ id: string; title: string }>): Promise<Array<{ id: string; title: string }>>;
}
