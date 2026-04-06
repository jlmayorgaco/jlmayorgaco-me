/**
 * Application layer ports (interfaces)
 * Define contracts that infrastructure must implement
 */

import type { Result } from '../../shared/Result';
import type { Session } from '../../domain/entities/Session';

// Re-export new ports
export * from './PaperHistoryPort';
export * from './VoiceTranscriptionPort';
export * from './ResearchContextPort';

// Message Port - for sending messages to users
export interface IMessagePort {
  sendMessage(text: string, options?: MessageOptions): Promise<Result<void, Error>>;
  sendHTML(html: string): Promise<Result<void, Error>>;
  sendTyping(): Promise<void>;
}

export interface MessageOptions {
  parseMode?: 'Markdown' | 'HTML';
  disableWebPagePreview?: boolean;
}

// Session Repository Port - for persistence
export interface ISessionRepository {
  get(chatId: number): Promise<Session>;
  save(chatId: number, session: Session): Promise<void>;
  delete(chatId: number): Promise<void>;
  exists(chatId: number): Promise<boolean>;
  getAll(): Promise<Map<number, Session>>;
  getMetrics(): Promise<SessionMetrics>;
}

export interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  oldestSessionAge: number;
}

// Gemini Service Port - for AI operations
export interface IGeminiService {
  classifyPapers(papers: PaperInput[]): Promise<Result<TieredClassification[], Error>>;
  generateBlogPost(input: BlogPostInput): Promise<Result<GeneratedBlogPost, Error>>;
  getCircuitStatus(): CircuitStatus;
  setContextPrompt(prompt: string): void;
}

export interface PaperInput {
  id: string;
  title: string;
  summary?: string;
  categories?: string[];
  authors?: string[];
  published?: string;
}

// Re-export tiered classification from enum
export type { TieredClassification } from '../../domain/enums/RelevanceTier';
export { RelevanceTier, TierEmojis, TierLabels, TierColors } from '../../domain/enums/RelevanceTier';

// Legacy classification (for backward compatibility)
export interface PaperClassification {
  paperId: string;
  relevance: 'high' | 'medium' | 'low';
  summary: string;
  classification: string;
}

export interface BlogPostInput {
  title: string;
  newsItems: string[];
  userComment: string;
  context: string;
}

export interface GeneratedBlogPost {
  title: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  imageQuery: string;
}

export interface CircuitStatus {
  state: string;
  failureCount: number;
  lastFailureTime?: number;
}

// News Scanner Port
export interface INewsScanner {
  scanSources(): Promise<Result<NewsItem[], Error>>;
}

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
  categories: string[];
}

// Publisher Port - for git operations
export interface IPublisher {
  publishPost(filePath: string, title: string): Promise<PublishResult>;
  validateSetup(): Promise<GitValidationResult>;
}

export interface PublishResult {
  success: boolean;
  commitHash?: string;
  message: string;
  details?: {
    staged: boolean;
    committed: boolean;
    pushed: boolean;
  };
}

export interface GitValidationResult {
  valid: boolean;
  errors: string[];
}

// Image Generation Port - for cover images
export interface IImageGenerationService {
  generateImage(prompt: string, options?: ImageOptions): Promise<Result<string, Error>>;
}

export interface ImageOptions {
  width?: number;
  height?: number;
  style?: string;
}

// Job Queue Port - for background processing
export interface IJobQueue {
  add<T>(jobName: string, data: T, options?: JobOptions): Promise<Job>;
  process<T, R>(jobName: string, processor: JobProcessor<T, R>): void;
  getJobStatus(jobId: string): Promise<JobStatus>;
}

export interface Job {
  id: string;
  name: string;
  data: unknown;
  status: JobStatus;
}

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed';

export interface JobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
}

export type JobProcessor<T, R> = (job: { data: T }) => Promise<R>;

// Event Bus Port - for decoupled communication
export interface IEventBus {
  emit(event: DomainEvent): Promise<void>;
  on<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
  off(eventType: string, handler: EventHandler<DomainEvent>): void;
}

export interface DomainEvent {
  type: string;
  timestamp: Date;
  payload: unknown;
}

export type EventHandler<T extends DomainEvent> = (event: T) => Promise<void>;

// Analytics Repository Port - for metrics and statistics
export interface IAnalyticsRepository {
  recordEvent(event: AnalyticsEvent): Promise<void>;
  getStats(timeRange: TimeRange): Promise<AnalyticsStats>;
  getRecentActivity(limit?: number): Promise<AnalyticsEvent[]>;
}

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: Date;
  payload: Record<string, unknown>;
}

export type AnalyticsEventType = 
  | 'COMMAND_EXECUTED'
  | 'PAPER_SCANNED'
  | 'PAPER_CLASSIFIED'
  | 'POST_GENERATED'
  | 'POST_PUBLISHED'
  | 'ERROR_OCCURRED';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface AnalyticsStats {
  totalCommands: number;
  commandsByType: Record<string, number>;
  totalPapersScanned: number;
  totalPapersClassified: number;
  totalPostsGenerated: number;
  totalPostsPublished: number;
  totalErrors: number;
  errorsByType: Record<string, number>;
  period: TimeRange;
}

// Command Bus Port - for dispatching commands
export interface ICommandBus {
  execute<T, R>(command: Command<T>): Promise<R>;
  register<T, R>(commandType: string, handler: CommandHandler<T, R>): void;
}

export interface Command<T> {
  type: string;
  payload: T;
  metadata?: CommandMetadata;
}

export interface CommandMetadata {
  timestamp: Date;
  correlationId?: string;
  userId?: string;
}

// Command Handler for plugin system
export interface CommandHandler<T = unknown, R = unknown> {
  name: string;
  description?: string;
  aliases?: string[];
  execute(payload: T): Promise<R>;
}

