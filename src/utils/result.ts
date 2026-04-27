/**
 * Result/Either pattern for better error handling
 * Inspired by Rust's Result type and functional programming
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly success = true;
  constructor(public readonly value: T) {}
}

export class Failure<E> {
  readonly success = false;
  constructor(public readonly error: E) {}
}

/**
 * Create a success result
 */
export function ok<T>(value: T): Result<T, never> {
  return new Success(value);
}

/**
 * Create a failure result
 */
export function err<E>(error: E): Result<never, E> {
  return new Failure(error);
}

/**
 * Check if result is success
 */
export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success;
}

/**
 * Check if result is failure
 */
export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.success;
}

/**
 * Map over success value
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Map over error value
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Unwrap result or throw
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap result or return default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Unwrap result or execute function
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  if (isOk(result)) {
    return result.value;
  }
  return fn(result.error);
}

/**
 * Convert async function to Result
 */
export async function toResult<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(error as E);
  }
}

/**
 * Example usage:
 *
 * const result = await toResult(() => fetchData());
 *
 * if (isOk(result)) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 *
 * // Or with unwrapOr
 * const data = unwrapOr(result, defaultValue);
 */
