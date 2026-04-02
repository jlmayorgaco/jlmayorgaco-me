/**
 * @deprecated Use './infrastructure/logging/Logger' instead.
 * This file exists for backward compatibility only.
 */
export {
  logger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  sanitizeForLogging,
  setRequestContext,
  clearRequestContext,
  logWithContext,
  logPerformance,
  logAudit,
} from './infrastructure/logging/Logger';
