/**
 * Application Layer DTOs (Data Transfer Objects)
 * Input/Output contracts for all use cases
 */

// ============================================================================
// PAPER SCANNING
// ============================================================================

export interface ScanPapersInput {
  chatId: number;
  userId?: string;
  maxPapers?: number;
  useBatchMode?: boolean;
  excludeSeen?: boolean;
}

export interface ScanPapersOutput {
  success: boolean;
  papersScanned: number;
  papersNew: number;
  papersDuplicated: number;
  selectedPapers: PaperSummary[];
  error?: string;
}

export interface PaperSummary {
  id: string;
  title: string;
  summary?: string;
  url?: string;
  relevance?: string;
  relevanceScore?: number;
}

// ============================================================================
// NEWS SCANNING
// ============================================================================

export interface ScanNewsInput {
  chatId: number;
  maxItems?: number;
  sources?: string[];
}

export interface ScanNewsOutput {
  success: boolean;
  newsScanned: number;
  selectedNews: NewsSummary[];
  error?: string;
}

export interface NewsSummary {
  title: string;
  source: string;
  link: string;
  pubDate?: string;
  summary?: string;
}

// ============================================================================
// BLOG GENERATION
// ============================================================================

export interface GenerateBlogPostInput {
  chatId: number;
  userId?: string;
  userComment?: string;
  voiceBuffer?: Buffer;
  voiceMimeType?: string;
  selectedItems?: string[];
}

export interface GenerateBlogPostOutput {
  success: boolean;
  blogPost?: BlogPostDTO;
  imagePath?: string;
  error?: string;
}

export interface BlogPostDTO {
  title: string;
  description: string;
  category: string;
  tags: string[];
  date: string;
  content: string;
  featured: boolean;
  imageQuery: string;
}

// ============================================================================
// PUBLISHING
// ============================================================================

export interface PublishPostInput {
  chatId: number;
}

export interface PublishPostOutput {
  success: boolean;
  filePath?: string;
  commitHash?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// BATCH REVIEW
// ============================================================================

export interface StartBatchReviewInput {
  chatId: number;
  papers: BatchReviewPaperDTO[];
}

export interface BatchReviewPaperDTO {
  paperId: string;
  title: string;
  summary: string;
  relevanceScore: number;
  url: string;
}

export interface StartBatchReviewOutput {
  success: boolean;
  batchItemsCount: number;
  error?: string;
}

export interface SubmitReactionInput {
  chatId: number;
  paperId: string;
  reaction: 'star' | 'thumbs_up' | 'check' | 'bookmark' | 'skip';
}

export interface SubmitReactionOutput {
  success: boolean;
  reactionRecorded: boolean;
  totalReviewed: number;
  totalItems: number;
  completed: boolean;
  error?: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface GetStatusInput {
  chatId: number;
}

export interface GetStatusOutput {
  state: string;
  papersCount: number;
  newsCount: number;
  hasPendingPost: boolean;
  sessionAge: number;
  lastActivity: Date;
}

export interface CancelSessionInput {
  chatId: number;
}

export interface CancelSessionOutput {
  success: boolean;
  previousState: string;
}

// ============================================================================
// RESEARCH CONTEXT
// ============================================================================

export interface GetContextInput {
  userId: string;
}

export interface GetContextOutput {
  researchAreas: string[];
  preferredTopics: string[];
  interests: InterestDTO[];
  stats: ContextStatsDTO;
}

export interface InterestDTO {
  term: string;
  weight: number;
  category: string;
}

export interface ContextStatsDTO {
  totalInteractions: number;
  topInterests: string[];
}

export interface UpdateContextInput {
  userId: string;
  researchAreas?: string[];
  addTopics?: string[];
  removeTopics?: string[];
}

export interface UpdateContextOutput {
  success: boolean;
  updated: boolean;
}

// ============================================================================
// PAPER HISTORY
// ============================================================================

export interface GetHistoryInput {
  userId: string;
  since?: Date;
}

export interface GetHistoryOutput {
  totalPapers: number;
  papersWithActions: number;
  recentPapers: PaperHistoryDTO[];
}

export interface PaperHistoryDTO {
  paperId: string;
  title: string;
  firstSeen: Date;
  lastSeen: Date;
  seenCount: number;
  lastAction?: string;
}

// ============================================================================
// VOICE TRANSCRIPTION
// ============================================================================

export interface TranscribeVoiceInput {
  chatId: number;
  audioBuffer: Buffer;
  mimeType: string;
}

export interface TranscribeVoiceOutput {
  success: boolean;
  transcription?: string;
  keyPoints?: string[];
  suggestedTags?: string[];
  error?: string;
}

// ============================================================================
// HELP
// ============================================================================

export interface GetHelpInput {
  includeAdvanced?: boolean;
}

export interface GetHelpOutput {
  commands: CommandDTO[];
}

export interface CommandDTO {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
}

