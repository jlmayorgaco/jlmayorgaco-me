/**
 * Batch Review Types
 * For presenting multiple papers at once with emoji reactions
 */

import { RelevanceTier } from '../enums/RelevanceTier';

export interface BatchReviewItem {
  paperId: string;
  title: string;
  summary: string;
  tier: RelevanceTier;
  relevanceScore: number;
  url: string;
}

export interface BatchReviewSession {
  items: BatchReviewItem[];
  currentIndex: number;
  reactions: Map<string, PaperReaction>;
  submitted: boolean;
}

export interface SerializedBatchReviewSession {
  items: BatchReviewItem[];
  currentIndex: number;
  reactions: Array<[string, PaperReaction]>;
  submitted: boolean;
}

export interface PaperReaction {
  paperId: string;
  reaction: ReactionEmoji;
  timestamp: Date;
}

export enum ReactionEmoji {
  STAR = '⭐',      // Must read / Save
  THUMBS_UP = '👍', // Worth scanning
  CHECK = '✓',     // Read/acknowledged
  BOOKMARK = '🔖', // Save for later
  SKIP = '⏭️',     // Skip this one
}

export const ReactionLabels: Record<ReactionEmoji, string> = {
  [ReactionEmoji.STAR]: 'Must Read',
  [ReactionEmoji.THUMBS_UP]: 'Interesting',
  [ReactionEmoji.CHECK]: 'Acknowledged',
  [ReactionEmoji.BOOKMARK]: 'Save for Later',
  [ReactionEmoji.SKIP]: 'Skip',
};
