/**
 * Base application error class
 * All domain/application errors should extend this
 */

export interface ErrorJSON {
  code: string;
  message: string;
  isOperational: boolean;
  stack?: string;
  details?: Record<string, unknown>;
}

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly isOperational: boolean;
  
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON(): ErrorJSON {
    return {
      code: this.code,
      message: this.message,
      isOperational: this.isOperational,
      stack: this.stack,
      details: this.details,
    };
  }
}

/**
 * Validation errors - user input issues
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly field?: string,
    details?: Record<string, unknown>
  ) {
    super(message, details);
  }
}

/**
 * External service errors - API failures
 */
export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly service: string,
    public readonly statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, service, statusCode });
  }
}

/**
 * State transition errors - invalid state changes
 */
export class StateTransitionError extends AppError {
  readonly code = 'STATE_TRANSITION_ERROR';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly fromState: string,
    public readonly toState: string,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, fromState, toState });
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly resource: string,
    public readonly identifier?: string,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, resource, identifier });
  }
}

/**
 * Unauthorized errors
 */
export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
  readonly isOperational = true;
  
  constructor(
    message: string = 'Unauthorized access',
    public readonly userId?: string,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, userId });
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly isOperational = true;
  
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfterMs?: number,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, retryAfterMs });
  }
}

/**
 * Circuit breaker open error
 */
export class CircuitBreakerOpenError extends AppError {
  readonly code = 'CIRCUIT_BREAKER_OPEN';
  readonly isOperational = true;
  
  constructor(
    message: string = 'Service temporarily unavailable',
    public readonly service: string,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, service });
  }
}

/**
 * Git operation errors
 */
export class GitOperationError extends AppError {
  readonly code = 'GIT_OPERATION_ERROR';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly operation: string,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, operation });
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
  readonly code = 'TIMEOUT_ERROR';
  readonly isOperational = true;
  
  constructor(
    message: string = 'Operation timed out',
    public readonly timeoutMs: number,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, timeoutMs });
  }
}

/**
 * Session not found errors
 */
export class SessionNotFoundError extends AppError {
  readonly code = 'SESSION_NOT_FOUND';
  readonly isOperational = true;
  
  constructor(
    message: string = 'Session not found',
    public readonly chatId?: number,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, chatId });
  }
}

/**
 * Post generation errors
 */
export class PostGenerationError extends AppError {
  readonly code = 'POST_GENERATION_ERROR';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly step?: string,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, step });
  }
}

/**
 * Paper scanning errors
 */
export class PaperScanningError extends AppError {
  readonly code = 'PAPER_SCANNING_ERROR';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly source?: string,
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, source });
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AppError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly isOperational = false; // Not operational - should fail fast
  
  constructor(
    message: string,
    public readonly missingKeys?: string[],
    details?: Record<string, unknown>
  ) {
    super(message, { ...details, missingKeys });
  }
}

