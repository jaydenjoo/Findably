/**
 * Retry utility tests
 * Test exponential backoff retry logic with configurable delays
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exponentialBackoffRetry,
  getRetryDelays,
  calculateBackoffDelay,
} from '../retry';

describe('retry utilities', () => {
  describe('getRetryDelays', () => {
    it('should return default delays [10s, 30s, 60s]', () => {
      const delays = getRetryDelays();
      expect(delays).toEqual([10000, 30000, 60000]);
    });

    it('should return custom delays when provided', () => {
      const customDelays = [5000, 15000, 45000];
      const delays = getRetryDelays(customDelays);
      expect(delays).toEqual(customDelays);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should return correct delay for attempt 1', () => {
      const delay = calculateBackoffDelay(1, [10000, 30000, 60000]);
      expect(delay).toBe(10000);
    });

    it('should return correct delay for attempt 2', () => {
      const delay = calculateBackoffDelay(2, [10000, 30000, 60000]);
      expect(delay).toBe(30000);
    });

    it('should return correct delay for attempt 3', () => {
      const delay = calculateBackoffDelay(3, [10000, 30000, 60000]);
      expect(delay).toBe(60000);
    });

    it('should return last delay for attempt beyond max', () => {
      const delay = calculateBackoffDelay(5, [10000, 30000, 60000]);
      expect(delay).toBe(60000);
    });

    it('should return 0 delay for attempt 0', () => {
      const delay = calculateBackoffDelay(0, [10000, 30000, 60000]);
      expect(delay).toBe(0);
    });
  });

  describe('exponentialBackoffRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt without retry', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await exponentialBackoffRetry(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed on second attempt', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const promise = exponentialBackoffRetry(mockFn, {
        delays: [100, 200, 300],
      });

      // Fast-forward to first retry (100ms delay)
      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry 3 times before giving up', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Network error'));

      const promise = exponentialBackoffRetry(mockFn, {
        delays: [100, 200, 300],
      }).catch((err) => err); // Catch and return error to prevent unhandled rejection

      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(100); // First retry
      await vi.advanceTimersByTimeAsync(200); // Second retry
      await vi.advanceTimersByTimeAsync(300); // Third retry

      const error = await promise;

      expect(error).toBeInstanceOf(Error);
      expect(mockFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should use custom delays', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const customDelays = [50, 150, 250];
      const promise = exponentialBackoffRetry(mockFn, { delays: customDelays });

      await vi.advanceTimersByTimeAsync(50);
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle async function that returns a promise', async () => {
      // Use real timers for this test to avoid setTimeout issues
      vi.useRealTimers();

      const mockFn = vi.fn(async () => {
        return 'async success';
      });

      const result = await exponentialBackoffRetry(mockFn);

      expect(result).toBe('async success');

      // Reset to fake timers
      vi.useFakeTimers();
    });

    it('should preserve error from last attempt', async () => {
      const customError = new Error('Custom network error');
      const mockFn = vi.fn().mockRejectedValue(customError);

      const promise = exponentialBackoffRetry(mockFn, {
        delays: [100, 200, 300],
      }).catch((err) => err);

      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(200);
      await vi.advanceTimersByTimeAsync(300);

      const error = await promise;

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Custom network error');
    });

    it('should handle non-Error objects as rejections', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce('String error')
        .mockResolvedValueOnce('success');

      const promise = exponentialBackoffRetry(mockFn, {
        delays: [100],
      });

      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result).toBe('success');
    });
  });
});
