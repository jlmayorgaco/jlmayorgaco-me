/**
 * Result type for functional error handling
 * Replaces throwing exceptions for expected errors
 */

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(data: T): Result<T, never> {
    return { success: true, data };
  },
  
  err<E>(error: E): Result<never, E> {
    return { success: false, error };
  },
  
  async fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
    try {
      const data = await promise;
      return Result.ok(data);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  },
  
  map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
    if (result.success) {
      return Result.ok(fn(result.data));
    }
    return result;
  },
  
  flatMap<T, U, E>(result: Result<T, E>, fn: (data: T) => Result<U, E>): Result<U, E> {
    if (result.success) {
      return fn(result.data);
    }
    return result;
  },
  
  fold<T, U, E>(
    result: Result<T, E>,
    onSuccess: (data: T) => U,
    onError: (error: E) => U
  ): U {
    if (result.success) {
      return onSuccess(result.data);
    }
    return onError(result.error);
  },
};

// Helper type for async results
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
