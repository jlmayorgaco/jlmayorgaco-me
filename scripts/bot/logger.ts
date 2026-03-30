/**
 * Structured logging with Winston
 * Production-ready: JSON format, log levels, error tracking
 */

import winston from 'winston';

const { combine, timestamp, json, errors, printf } = winston.format;

// Custom format for development (human-readable)
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create Winston logger
export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'jlmt-lab-bot',
    version: process.env.npm_package_version || '0.0.1',
  },
  format: combine(
    timestamp(),
    errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : devFormat
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      stderrLevels: ['error', 'warn'],
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production' && process.env.LOG_FILE) {
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
}

// Wrapper functions with type safety
export function logDebug(message: string, meta?: Record<string, unknown>): void {
  logger.debug(message, meta);
}

export function logInfo(message: string, meta?: Record<string, unknown>): void {
  logger.info(message, meta);
}

export function logWarn(message: string, meta?: Record<string, unknown>): void {
  logger.warn(message, meta);
}

export function logError(message: string, error?: Error, meta?: Record<string, unknown>): void {
  logger.error(message, {
    ...meta,
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : undefined,
  });
}

// Security: Never log sensitive data
const SENSITIVE_KEYS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'chatId',
];

export function sanitizeForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Request context logging
let requestContext: Record<string, unknown> = {};

export function setRequestContext(context: Record<string, unknown>): void {
  requestContext = context;
}

export function clearRequestContext(): void {
  requestContext = {};
}

export function logWithContext(level: string, message: string, meta?: Record<string, unknown>): void {
  logger.log(level, message, {
    ...requestContext,
    ...meta,
  });
}

// Performance logging
export function logPerformance(operation: string, durationMs: number, meta?: Record<string, unknown>): void {
  logger.info(`Performance: ${operation}`, {
    operation,
    durationMs,
    ...meta,
  });
}

// Audit logging for security events
export function logAudit(event: string, userId: string, details?: Record<string, unknown>): void {
  logger.info(`Audit: ${event}`, {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...sanitizeForLogging(details || {}),
  });
}
