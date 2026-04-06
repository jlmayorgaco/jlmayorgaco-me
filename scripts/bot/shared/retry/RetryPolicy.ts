/**
 * Retry policies - DRY up retry logic
 * Single source of truth for retry behavior
 */

import { CONSTANTS } from '../constants';

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  shouldRetry: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export const RetryPolicies = {
  // Default policy for most operations
  DEFAULT: {
    maxAttempts: CONSTANTS.RETRY.DEFAULT_ATTEMPTS,
    baseDelayMs: CONSTANTS.RETRY.DEFAULT_BASE_DELAY_MS,
    maxDelayMs: CONSTANTS.RETRY.MAX_DELAY_MS,
    exponentialBase: CONSTANTS.RETRY.EXPONENTIAL_BASE,
    shouldRetry: () => true,
  } as RetryPolicy,

  // For external APIs (Gemini, Telegram)
  EXTERNAL_API: {
    maxAttempts: 5,
    baseDelayMs: 1000,
    maxDelayMs: 60000,
    exponentialBase: 2,
    shouldRetry: (error: Error) => {
      // Retry on network errors, rate limits, and 5xx errors
      const retryableErrors = [
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ENOTFOUND',
        'EAI_AGAIN',
        'ECONNRESET',
      ];
      
      if (retryableErrors.some(code => error.message.includes(code))) {
        return true;
      }
      
      // Retry on 5xx status codes
      if (/5\d{2}/.test(error.message)) {
        return true;
      }
      
      // Retry on rate limit
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return true;
      }
      
      return false;
    },
  } as RetryPolicy,

  // For Git operations
  GIT_OPERATIONS: {
    maxAttempts: 3,
    baseDelayMs: 2000,
    maxDelayMs: 10000,
    exponentialBase: 2,
    shouldRetry: (error: Error) => {
      // Retry on network errors, not on auth errors
      const retryableErrors = [
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ENOTFOUND',
        'EAI_AGAIN',
        'Could not resolve host',
      ];
      
      return retryableErrors.some(code => error.message.includes(code));
    },
  } as RetryPolicy,

  // For RSS feed fetching
  RSS_FETCH: {
    maxAttempts: 2,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
    exponentialBase: 2,
    shouldRetry: (error: Error) => {
      const retryableErrors = [
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ENOTFOUND',
        'EAI_AGAIN',
      ];
      
      return retryableErrors.some(code => error.message.includes(code));
    },
  } as RetryPolicy,

  // No retry - fail fast
  NO_RETRY: {
    maxAttempts: 1,
    baseDelayMs: 0,
    maxDelayMs: 0,
    exponentialBase: 1,
    shouldRetry: () => false,
  } as RetryPolicy,
} as const;

/**
 * Calculate delay for retry attempt using exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  policy: RetryPolicy
): number {
  const delay = policy.baseDelayMs * Math.pow(policy.exponentialBase, attempt);
  return Math.min(delay, policy.maxDelayMs);
}

/**
 * Decorator for adding retry to methods
 */
export function WithRetry(policy: RetryPolicy | keyof typeof RetryPolicies) {
  const resolvedPolicy = typeof policy === 'string' 
    ? RetryPolicies[policy] 
    : policy;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;

      for (let attempt = 0; attempt < resolvedPolicy.maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < resolvedPolicy.maxAttempts - 1) {
            if (!resolvedPolicy.shouldRetry(lastError)) {
              throw lastError;
            }

            const delay = calculateRetryDelay(attempt, resolvedPolicy);
            
            if (resolvedPolicy.onRetry) {
              resolvedPolicy.onRetry(lastError, attempt + 1);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError!;
    };

    return descriptor;
  };
}

/**
 * Execute function with retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy | keyof typeof RetryPolicies
): Promise<T> {
  const resolvedPolicy = typeof policy === 'string' 
    ? RetryPolicies[policy] 
    : policy;

  let lastError: Error;

  for (let attempt = 0; attempt < resolvedPolicy.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < resolvedPolicy.maxAttempts - 1) {
        if (!resolvedPolicy.shouldRetry(lastError)) {
          throw lastError;
        }

        const delay = calculateRetryDelay(attempt, resolvedPolicy);
        
        if (resolvedPolicy.onRetry) {
          resolvedPolicy.onRetry(lastError, attempt + 1);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

