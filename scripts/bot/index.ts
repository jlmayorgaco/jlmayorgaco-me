/**
 * JLMT Lab Bot - Public API
 *
 * All exports use backward-compatible re-exports from the canonical locations.
 * New code should import directly from the canonical paths:
 *
 *   config:      './config/index'
 *   logger:      './infrastructure/logging/Logger'
 *   utils:       './shared/utils'
 *   validation:  './shared/validation'
 *   gemini:      './infrastructure/external/GeminiService'
 *   publisher:   './infrastructure/external/GitPublisher'
 *   news:        './infrastructure/connectors/RssConnector'
 *   blog:        './infrastructure/formatting/BlogGenerator'
 *   registry:    './interfaces/CommandRegistry'
 *   commands:    './interfaces/commands/*'
 */

// Config
export { loadConfig, validateEnvironment, getSafeConfig, type BotConfig } from './config/index';

// Telegram
export { TelegramBot } from './infrastructure/inbound/TelegramBot';

// Session
export { SessionManager, initializeSessionManager, destroySessionManager, type UserSession } from './infrastructure/persistence/SessionManager';

// Logging
export { logger, logInfo, logError, logWarn, logDebug } from './infrastructure/logging/Logger';

// Utilities
export {
  sleep,
  withRetry,
  withTimeout,
  CircuitBreaker,
  TokenBucket,
  RateLimiter,
  type RetryOptions,
  type CircuitBreakerOptions,
  type RateLimiterOptions,
} from './shared/utils';

// Validation
export {
  safeValidate,
  UserCommentSchema,
  BlogPostDataSchema,
  GeminiClassificationSchema,
  GeminiBlogPostSchema,
  sanitizeForTelegram,
  sanitizeUserInput,
  generateSlug,
  type ValidationResult,
} from './shared/validation';

// Gemini / LLM
export {
  callGemini,
  generateBlogPost,
  classifyAndSummarizePapers,
  getGeminiCircuitStatus,
  type PaperClassification,
  type GeneratedBlogPost,
} from './infrastructure/external/GeminiService';

// Blog Generator
export {
  saveBlogPost,
  generateFrontmatter,
  previewBlogPost,
  type BlogPostData,
} from './infrastructure/formatting/BlogGenerator';

// Publisher
export {
  publishPost,
  validateGitSetup,
  checkGitStatus,
  type PublishResult,
  type GitStatus,
} from './infrastructure/external/GitPublisher';

// News Scanner
export { scanNewsSources, formatNewsForTelegram, type NewsItem } from './infrastructure/connectors/RssConnector';

// Command Registry
export { getCommandRegistry, BotCommandRegistry } from './interfaces/CommandRegistry';

