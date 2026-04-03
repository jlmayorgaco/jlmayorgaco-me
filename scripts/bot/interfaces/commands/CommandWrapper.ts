/**
 * Command error wrapper with consistent error handling
 *
 * @module interfaces/commands/CommandWrapper
 */

import { logError, logWarn } from '../../infrastructure/logging/Logger';
import { AppError, ExternalServiceError, TimeoutError, RateLimitError } from '../../shared/errors/AppError';

export interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function withCommandError<T>(
  commandName: string,
  handler: () => Promise<T>,
  bot: { sendMessage: (msg: string) => Promise<boolean> }
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    const errorMessage = formatError(error as Error);
    logError(`Command '${commandName}' failed`, error as Error);

    const userMessage = formatUserMessage(error as Error);
    await bot.sendMessage(`❌ ${userMessage}`);

    throw error;
  }
}

function formatError(error: Error): string {
  if (error instanceof AppError) {
    return `[${error.code}] ${error.message}`;
  }
  return error.message;
}

function formatUserMessage(error: Error): string {
  if (error instanceof TimeoutError) {
    return 'Operation timed out. Please try again.';
  }

  if (error instanceof RateLimitError) {
    const wait = error.retryAfterMs ? Math.ceil(error.retryAfterMs / 1000) : 30;
    return `Rate limit exceeded. Please wait ${wait} seconds.`;
  }

  if (error instanceof ExternalServiceError) {
    return `Service temporarily unavailable (${error.service}). Try again later.`;
  }

  if (error instanceof AppError) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export async function withRetryCommand<T>(
  commandName: string,
  handler: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await handler();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
