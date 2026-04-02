/**
 * @deprecated Use './shared/validation' instead.
 * This file exists for backward compatibility only.
 */
export {
  TelegramCommandSchema,
  UserCommentSchema,
  PaperSchema,
  NewsItemSchema,
  BlogPostDataSchema,
  GeminiClassificationSchema,
  GeminiBlogPostSchema,
  FilePathSchema,
  EditInstructionSchema,
  sanitizeUserInput,
  sanitizeForTelegram,
  sanitizeSlug,
  generateSlug,
  safeValidate,
  type ValidationResult,
} from './shared/validation';
