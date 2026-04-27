/**
 * Unit tests for Result type
 */

import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  toResult,
} from '../result';

describe('Result Type', () => {
  describe('ok and err', () => {
    it('should create success result', () => {
      const result = ok(42);
      expect(isOk(result)).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should create failure result', () => {
      const error = new Error('Test error');
      const result = err(error);
      expect(isErr(result)).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  describe('map', () => {
    it('should map over success value', () => {
      const result = ok(5);
      const mapped = map(result, (x) => x * 2);
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(10);
      }
    });

    it('should not map over failure', () => {
      const result = err(new Error('Test'));
      const mapped = map(result, (x) => x * 2);
      expect(isErr(mapped)).toBe(true);
    });
  });

  describe('unwrapOr', () => {
    it('should return value for success', () => {
      const result = ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default for failure', () => {
      const result = err(new Error('Test'));
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('toResult', () => {
    it('should return ok for successful promise', async () => {
      const result = await toResult(() => Promise.resolve(42));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it('should return err for failed promise', async () => {
      const error = new Error('Test error');
      const result = await toResult(() => Promise.reject(error));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe(error);
      }
    });
  });
});
