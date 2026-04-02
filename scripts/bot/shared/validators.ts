/**
 * Domain and Application Validators
 * Zod schemas for all input/output types
 */

import { z } from 'zod';

// ============================================================================
// RESEARCH CONTEXT
// ============================================================================

export const ResearchContextUpdateSchema = z.object({
  researchAreas: z.array(z.string().min(1).max(100)).optional(),
  addTopics: z.array(z.string().min(1).max(100)).optional(),
  removeTopics: z.array(z.string().min(1).max(100)).optional(),
  addAvoidedTopics: z.array(z.string().min(1).max(100)).optional(),
  addJournals: z.array(z.string().min(1).max(200)).optional(),
  addResearchers: z.array(z.string().min(1).max(100)).optional(),
});

// ============================================================================
// BATCH REVIEW
// ============================================================================

export const BatchReviewPaperSchema = z.object({
  paperId: z.string().min(1),
  title: z.string().min(1).max(500),
  summary: z.string().max(2000),
  relevanceScore: z.number().min(0).max(100),
  url: z.string().url().optional().or(z.literal('')),
});

export const ReactionSchema = z.enum([
  'star',
  'thumbs_up',
  'check',
  'bookmark',
  'skip',
]);

// ============================================================================
// TIERED CLASSIFICATION
// ============================================================================

export const TieredClassificationSchema = z.object({
  paperId: z.string().min(1),
  tier: z.enum(['must_read', 'worth_scanning', 'background', 'skip']),
  relevanceScore: z.number().min(0).max(100),
  summary: z.string().max(1000),
  reasoning: z.string().max(2000),
  keyInsights: z.array(z.string().max(500)).max(10),
  suggestedAction: z.string().max(200),
});

// ============================================================================
// VOICE TRANSCRIPTION
// ============================================================================

export const TranscriptionResultSchema = z.object({
  text: z.string().min(1).max(10000),
  confidence: z.number().min(0).max(1),
  duration: z.number().min(0),
  language: z.string().optional(),
});

export const StructuredCommentarySchema = z.object({
  rawText: z.string().min(1).max(10000),
  formattedText: z.string().min(1).max(10000),
  keyPoints: z.array(z.string().max(500)).max(20),
  suggestedTags: z.array(z.string().min(1).max(50)).max(20),
  confidence: z.number().min(0).max(1),
});

// ============================================================================
// PAPER INPUT (for Gemini)
// ============================================================================

export const PaperInputSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  summary: z.string().max(10000).optional(),
  categories: z.array(z.string()).max(20).optional(),
  authors: z.array(z.string()).max(100).optional(),
  published: z.string().optional(),
});

// ============================================================================
// NEWS ITEM (enhanced)
// ============================================================================

export const NewsItemInputSchema = z.object({
  title: z.string().min(1).max(500),
  link: z.string().url(),
  source: z.string().min(1).max(100),
  pubDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  categories: z.array(z.string()).default([]),
});

// ============================================================================
// PAPER HISTORY
// ============================================================================

export const PaperRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  firstSeen: z.date(),
  lastSeen: z.date(),
  seenCount: z.number().min(1),
  userActions: z.array(z.object({
    action: z.enum(['skipped', 'read', 'saved', 'shared', 'cited']),
    timestamp: z.date(),
  })),
});

// ============================================================================
// GEMINI RESPONSE
// ============================================================================

export const GeminiTieredResponseSchema = z.array(z.object({
  paperId: z.string().min(1),
  tier: z.enum(['must_read', 'worth_scanning', 'background', 'skip']),
  relevanceScore: z.number().min(0).max(100),
  summary: z.string().max(1000),
  reasoning: z.string().max(2000),
  keyInsights: z.array(z.string().max(500)).max(10),
  suggestedAction: z.string().max(200),
}));

// ============================================================================
// COMMAND INPUTS
// ============================================================================

export const ScanPapersInputSchema = z.object({
  chatId: z.number().positive(),
  userId: z.string().min(1).optional(),
  maxPapers: z.number().min(1).max(50).optional(),
  useBatchMode: z.boolean().optional(),
  excludeSeen: z.boolean().optional(),
});

export const ScanNewsInputSchema = z.object({
  chatId: z.number().positive(),
  maxItems: z.number().min(1).max(100).optional(),
  sources: z.array(z.string().min(1)).max(10).optional(),
});

export const GenerateBlogPostInputSchema = z.object({
  chatId: z.number().positive(),
  userId: z.string().min(1).optional(),
  userComment: z.string().min(1).max(5000).optional(),
  voiceBuffer: z.instanceof(Buffer).optional(),
  voiceMimeType: z.string().min(1).max(50).optional(),
  selectedItems: z.array(z.string()).max(20).optional(),
});

export const PublishPostInputSchema = z.object({
  chatId: z.number().positive(),
});

export const CancelSessionInputSchema = z.object({
  chatId: z.number().positive(),
});

export const GetStatusInputSchema = z.object({
  chatId: z.number().positive(),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  };
}
