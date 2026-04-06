/**
 * Relevance Tier Enum
 * 4-level hierarchical classification for academic papers
 */

export enum RelevanceTier {
  MUST_READ = 'must_read',      // ðŸ”´ Critical to your research
  WORTH_SCANNING = 'worth_scanning', // ðŸŸ¡ Relevant, worth a look
  BACKGROUND = 'background',    // ðŸŸ¢ Interesting background/context
  SKIP = 'skip',                // âšª Not relevant
}

export interface TieredClassification {
  paperId: string;
  tier: RelevanceTier;
  relevanceScore: number;  // 0-100
  summary: string;
  reasoning: string;       // Why this tier
  keyInsights: string[];   // Key takeaways
  suggestedAction: string; // What to do with this paper
}

export const TierEmojis: Record<RelevanceTier, string> = {
  [RelevanceTier.MUST_READ]: 'ðŸ”´',
  [RelevanceTier.WORTH_SCANNING]: 'ðŸŸ¡',
  [RelevanceTier.BACKGROUND]: 'ðŸŸ¢',
  [RelevanceTier.SKIP]: 'âšª',
};

export const TierLabels: Record<RelevanceTier, string> = {
  [RelevanceTier.MUST_READ]: 'Must Read',
  [RelevanceTier.WORTH_SCANNING]: 'Worth Scanning',
  [RelevanceTier.BACKGROUND]: 'Background',
  [RelevanceTier.SKIP]: 'Skip',
};

export const TierColors: Record<RelevanceTier, string> = {
  [RelevanceTier.MUST_READ]: '#ff4444',
  [RelevanceTier.WORTH_SCANNING]: '#ffaa00',
  [RelevanceTier.BACKGROUND]: '#44ff44',
  [RelevanceTier.SKIP]: '#888888',
};

