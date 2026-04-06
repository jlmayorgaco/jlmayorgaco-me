/**
 * Publish Queue & Feedback Loop
 * 
 * - Publish queue states (draft, review, approved, scheduled, published, failed)
 * - Manual review notes
 * - Post-performance tracking
 * - Learning from approvals/rejections
 * - Stale-draft cleanup policy
 *
 * @module infrastructure/persistence/PublishQueue
 */

import { promises as fs } from 'fs';
import path from 'path';

export type PublishState = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed';

export interface PublishQueueItem {
  id: string;
  state: PublishState;
  content: {
    title: string;
    body: string;
    format: 'telegram' | 'linkedin' | 'blog';
    channel?: string;
  };
  source: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  publishedAt?: string;
  notes: ReviewNote[];
  performance?: PerformanceData;
  rejectionReason?: string;
}

export interface ReviewNote {
  text: string;
  author: string;
  createdAt: string;
}

export interface PerformanceData {
  postedAt: string;
  channel: string;
  topic: string;
  format: string;
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
    manualNote?: string;
  };
}

export interface LearningData {
  approvedFeatures: string[];
  rejectedFeatures: string[];
  patternAdjustments: Record<string, number>;
}

export class PublishQueue {
  private dataDir: string;
  private items: Map<string, PublishQueueItem> = new Map();
  private learning: LearningData = {
    approvedFeatures: [],
    rejectedFeatures: [],
    patternAdjustments: {},
  };

  constructor(dataDir = './data') {
    this.dataDir = dataDir;
  }

  async load(): Promise<void> {
    const filePath = path.join(this.dataDir, 'publish-queue.json');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      for (const item of data.items || []) {
        this.items.set(item.id, item);
      }
      this.learning = data.learning || this.learning;
    } catch {}
  }

  async save(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const filePath = path.join(this.dataDir, 'publish-queue.json');
    await fs.writeFile(filePath, JSON.stringify({
      items: Array.from(this.items.values()),
      learning: this.learning
    }, null, 2));
  }

  create(item: Omit<PublishQueueItem, 'id' | 'state' | 'createdAt' | 'updatedAt' | 'notes'>): PublishQueueItem {
    const id = `post-${Date.now()}`;
    const now = new Date().toISOString();

    const fullItem: PublishQueueItem = {
      ...item,
      id,
      state: 'draft',
      createdAt: now,
      updatedAt: now,
      notes: [],
    };

    this.items.set(id, fullItem);
    return fullItem;
  }

  updateState(id: string, state: PublishState): void {
    const item = this.items.get(id);
    if (!item) return;

    item.state = state;
    item.updatedAt = new Date().toISOString();

    if (state === 'published') {
      item.publishedAt = new Date().toISOString();
    }
  }

  addNote(id: string, text: string, author: string = 'user'): void {
    const item = this.items.get(id);
    if (!item) return;

    item.notes.push({
      text,
      author,
      createdAt: new Date().toISOString(),
    });
    item.updatedAt = new Date().toISOString();
  }

  recordPerformance(id: string, performance: PerformanceData): void {
    const item = this.items.get(id);
    if (!item) return;

    item.performance = performance;
    item.updatedAt = new Date().toISOString();
  }

  approve(id: string): void {
    this.updateState(id, 'approved');
    const item = this.items.get(id);
    if (item) {
      this.learning.approvedFeatures.push(item.content.format);
      this.updateLearning(item, true);
    }
  }

  reject(id: string, reason: string): void {
    const item = this.items.get(id);
    if (!item) return;

    item.state = 'failed';
    item.rejectionReason = reason;
    item.updatedAt = new Date().toISOString();

    this.learning.rejectedFeatures.push(item.content.format);
    this.updateLearning(item, false);
  }

  private updateLearning(item: PublishQueueItem, approved: boolean): void {
    const features = approved ? this.learning.approvedFeatures : this.learning.rejectedFeatures;
    for (const f of features) {
      this.learning.patternAdjustments[f] = (this.learning.patternAdjustments[f] || 0) + (approved ? 1 : -1);
    }
  }

  getLearning(): LearningData {
    return this.learning;
  }

  schedule(id: string, scheduledAt: string): void {
    const item = this.items.get(id);
    if (!item) return;

    item.state = 'scheduled';
    item.scheduledAt = scheduledAt;
    item.updatedAt = new Date().toISOString();
  }

  getByState(state: PublishState): PublishQueueItem[] {
    return Array.from(this.items.values()).filter(i => i.state === state);
  }

  getStaleDrafts(daysOld: number = 7): PublishQueueItem[] {
    const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    return Array.from(this.items.values()).filter(
      i => i.state === 'draft' && new Date(i.updatedAt).getTime() < cutoff
    );
  }

  archiveStale(daysOld: number = 7): number {
    const stale = this.getStaleDrafts(daysOld);
    for (const item of stale) {
      item.state = 'failed';
      item.rejectionReason = 'Stale draft archived';
    }
    return stale.length;
  }

  formatForTelegram(): string {
    const drafts = this.getByState('draft');
    const review = this.getByState('review');
    const approved = this.getByState('approved');
    const published = this.getByState('published');

    let msg = 'ðŸ“‹ *Publish Queue*\n\n';
    msg += `Drafts: ${drafts.length}\n`;
    msg += `In Review: ${review.length}\n`;
    msg += `Approved: ${approved.length}\n`;
    msg += `Published: ${published.length}\n`;

    if (drafts.length > 0) {
      msg += '\n*Recent Drafts:*\n';
      for (const d of drafts.slice(0, 3)) {
        msg += `â€¢ ${d.content.title.substring(0, 40)}...\n`;
      }
    }

    return msg;
  }
}
