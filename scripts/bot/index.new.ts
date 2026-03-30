/**
 * JLMT Lab Bot - Clean Architecture Implementation
 * 
 * This module implements a comprehensive refactoring of the bot
 * following Clean Architecture, SOLID principles, and production best practices.
 */

// Domain Layer
export { Session, SessionData } from './domain/entities/Session';
export { SessionState, isValidSessionState, getSessionStateLabel } from './domain/enums/SessionState';
export type { Paper, NewsItem, BlogPost } from './domain/value-objects';
export { AuthorizationService } from './domain/services/AuthorizationService';

// Application Layer - Ports (Interfaces)
export type {
  IMessagePort,
  MessageOptions,
  ISessionRepository,
  SessionMetrics,
  IGeminiService,
  PaperInput,
  PaperClassification,
  BlogPostInput,
  GeneratedBlogPost,
  CircuitStatus,
  INewsScanner,
  IPublisher,
  PublishResult,
  GitValidationResult,
  IImageGenerationService,
  ImageOptions,
  IJobQueue,
  Job,
  JobOptions,
  JobProcessor,
  JobStatus,
  IEventBus,
  DomainEvent,
  EventHandler,
  ICommandBus,
  IAnalyticsRepository,
  AnalyticsStats,
  AnalyticsEvent,
  TimeRange,
  AnalyticsEventType,
} from './application/ports';

// Application Layer - Use Cases
export { GenerateBlogPostUseCase, GenerateBlogPostInput } from './application/use-cases/GenerateBlogPostUseCase';
export { ScanPapersUseCase, ScanPapersInput } from './application/use-cases/ScanPapersUseCase';
export { PublishPostUseCase, PublishPostInput } from './application/use-cases/PublishPostUseCase';

// Shared Layer
export { CONSTANTS } from './shared/constants';
export { Result, AsyncResult } from './shared/Result';
export {
  AppError,
  ErrorJSON,
  ValidationError,
  ExternalServiceError,
  StateTransitionError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
  CircuitBreakerOpenError,
  GitOperationError,
  TimeoutError,
} from './shared/errors/AppError';
export {
  RetryPolicy,
  RetryPolicies,
  calculateRetryDelay,
  WithRetry,
  withRetry,
} from './shared/retry/RetryPolicy';

// Infrastructure Layer - Container & DI
export {
  Container,
  Factory,
  Registration,
  TOKENS,
  createContainer,
  getContainer,
  createScopedContainer,
  resetContainer,
} from './infrastructure/container';

// Infrastructure Layer - Persistence
export { InMemorySessionRepository } from './infrastructure/persistence/InMemorySessionRepository';
export { RedisSessionRepository, RedisClient } from './infrastructure/persistence/RedisSessionRepository';
export { PostgresAnalyticsRepository, PostgresClient } from './infrastructure/persistence/PostgresAnalyticsRepository';

// Infrastructure Layer - Queue
export { BullJobQueue, BullQueue, BullJob } from './infrastructure/queue/BullJobQueue';

// Infrastructure Layer - Inbound (Webhooks & Events)
export { TelegramWebhookController, TelegramUpdate } from './infrastructure/inbound/TelegramWebhookController';
export { SimpleEventBus } from './infrastructure/inbound/SimpleEventBus';

// Infrastructure Layer - External Services
export {
  DalleImageService,
  StableDiffusionService,
} from './infrastructure/external/ImageGenerationService';

// Infrastructure Layer - Formatting
export { MarkdownFormatter } from './infrastructure/formatting/MarkdownFormatter';

// Infrastructure Layer - API Controllers
export { AnalyticsController } from './infrastructure/api/AnalyticsController';

// Plugins
export {
  PluginManager,
  Plugin,
  PluginContext,
  LoadedPlugin,
} from './plugins/PluginManager';

// Legacy exports (for backwards compatibility during migration)
export { loadConfig, validateEnvironment, type BotConfig } from './config';
export { logger, logDebug, logInfo, logWarn, logError } from './logger';
