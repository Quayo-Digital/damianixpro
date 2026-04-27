/**
 * Unit tests for error handler utility
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createError,
  handleError,
  getUserFriendlyMessage,
  retryWithBackoff,
  safeAsync,
} from '../errorHandler';
import type { ErrorCode } from '../errorHandler';

describe('Error Handler', () => {
  describe('createError', () => {
    it('should create an error object with all fields', () => {
      const error = new Error('Test error');
      const appError = createError('NETWORK_ERROR', 'Network failed', { key: 'value' }, error);

      expect(appError.code).toBe('NETWORK_ERROR');
      expect(appError.message).toBe('Network failed');
      expect(appError.details).toEqual({ key: 'value' });
      expect(appError.originalError).toBe(error);
      expect(appError.timestamp).toBeDefined();
    });
  });

  describe('handleError', () => {
    it('should categorize network errors correctly', () => {
      const error = new Error('Failed to fetch');
      const appError = handleError(error);

      expect(appError.code).toBe('NETWORK_ERROR');
    });

    it('should categorize auth errors correctly', () => {
      const error = new Error('Unauthorized access');
      const appError = handleError(error);

      expect(appError.code).toBe('AUTH_ERROR');
    });

    it('should handle non-Error objects', () => {
      const appError = handleError('String error');

      expect(appError.code).toBe('UNKNOWN_ERROR');
      expect(appError.message).toBe('An unexpected error occurred.');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly messages for all error codes', () => {
      const codes: ErrorCode[] = [
        'NETWORK_ERROR',
        'AUTH_ERROR',
        'VALIDATION_ERROR',
        'NOT_FOUND',
        'PERMISSION_DENIED',
        'SERVER_ERROR',
        'UNKNOWN_ERROR',
      ];

      codes.forEach((code) => {
        const error = createError(code, 'Test message');
        const message = getUserFriendlyMessage(error);
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      });
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('safeAsync', () => {
    it('should return data on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const { data, error } = await safeAsync(fn, 'test context');

      expect(data).toBe('success');
      expect(error).toBeNull();
    });

    it('should return error on failure', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Test error'));
      const { data, error } = await safeAsync(fn, 'test context');

      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.code).toBeDefined();
    });
  });
});
