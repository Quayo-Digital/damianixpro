/**
 * Centralized Error Handling Utility
 * Provides consistent error handling patterns across the application
 */

import { logger } from './logger';

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
  originalError?: Error;
  timestamp: string;
}

/**
 * Create a standardized error object
 */
export function createError(
  code: ErrorCode,
  message: string,
  details?: unknown,
  originalError?: Error
): AppError {
  return {
    code,
    message,
    details,
    originalError,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle and log errors consistently
 */
export function handleError(error: unknown, context?: string): AppError {
  let appError: AppError;

  if (error instanceof Error) {
    // Network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    ) {
      appError = createError(
        'NETWORK_ERROR',
        'Network request failed. Please check your connection.',
        error.message,
        error
      );
    }
    // Auth errors
    else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      appError = createError(
        'AUTH_ERROR',
        'Authentication failed. Please log in again.',
        error.message,
        error
      );
    }
    // Validation errors
    else if (error.message.includes('validation') || error.message.includes('invalid')) {
      appError = createError('VALIDATION_ERROR', 'Invalid input provided.', error.message, error);
    }
    // Not found errors
    else if (error.message.includes('not found') || error.message.includes('404')) {
      appError = createError(
        'NOT_FOUND',
        'The requested resource was not found.',
        error.message,
        error
      );
    }
    // Permission errors
    else if (error.message.includes('permission') || error.message.includes('forbidden')) {
      appError = createError(
        'PERMISSION_DENIED',
        'You do not have permission to perform this action.',
        error.message,
        error
      );
    }
    // Server errors
    else if (error.message.includes('500') || error.message.includes('server')) {
      appError = createError(
        'SERVER_ERROR',
        'Server error occurred. Please try again later.',
        error.message,
        error
      );
    }
    // Unknown errors
    else {
      appError = createError(
        'UNKNOWN_ERROR',
        error.message || 'An unexpected error occurred.',
        error.message,
        error
      );
    }
  } else {
    appError = createError('UNKNOWN_ERROR', 'An unexpected error occurred.', error);
  }

  // Log the error with context
  logger.error(
    context ? `Error in ${context}` : 'Error occurred',
    appError.originalError || appError,
    { errorCode: appError.code, details: appError.details }
  );

  return appError;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<ErrorCode, string> = {
    NETWORK_ERROR:
      'Unable to connect to the server. Please check your internet connection and try again.',
    AUTH_ERROR: 'Your session has expired. Please log in again.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    NOT_FOUND: 'The requested item could not be found.',
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
    SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  };

  return messages[error.code] || error.message;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, { error });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Safe async wrapper that catches and handles errors
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const appError = handleError(error, context);
    return { data: null, error: appError };
  }
}
