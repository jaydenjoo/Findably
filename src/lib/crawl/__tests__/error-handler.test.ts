/**
 * Crawl error handler tests
 * Test error classification, detail extraction, and recovery procedures
 */

import { describe, it, expect } from 'vitest';
import {
  classifyCrawlError,
  extractErrorDetails,
  isCrawlError,
  shouldRetryError,
  getErrorRecoveryStrategy,
} from '../error-handler';
import type { CrawlStatus } from '@/types/crawl';

describe('error handler utilities', () => {
  describe('isCrawlError', () => {
    it('should return true for Error objects', () => {
      const error = new Error('Test error');
      expect(isCrawlError(error)).toBe(true);
    });

    it('should return true for Error-like objects with message property', () => {
      const error = { message: 'Test error', code: 'ENOTFOUND' };
      expect(isCrawlError(error)).toBe(true);
    });

    it('should return true for string errors', () => {
      expect(isCrawlError('String error')).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isCrawlError(null)).toBe(false);
      expect(isCrawlError(undefined)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isCrawlError({})).toBe(false);
    });
  });

  describe('classifyCrawlError', () => {
    it('should classify timeout error', () => {
      const error = new Error('Execution timeout after 300000ms');
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_timeout');
    });

    it('should classify Playwright timeout error', () => {
      const error = new Error('Playwright: Timeout 300000ms');
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_timeout');
    });

    it('should classify connection refused error as network', () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_network');
    });

    it('should classify ENOTFOUND (DNS) as network error', () => {
      const error = new Error('ENOTFOUND example.com');
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_network');
    });

    it('should classify EHOSTUNREACH as network error', () => {
      const error = new Error('EHOSTUNREACH: No route to host');
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_network');
    });

    it('should classify ETIMEDOUT (network timeout) as network error', () => {
      const error = new Error('ETIMEDOUT: Connection timed out');
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_network');
    });

    it('should classify invalid URL error', () => {
      const error = new Error('Invalid URL: not-a-url');
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_invalid_url');
    });

    it('should classify malformed URL error', () => {
      const error = new Error('URL parse failure');
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_invalid_url');
    });

    it('should classify as network error for generic error', () => {
      const error = new Error('Unknown error');
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_network');
    });

    it('should handle string errors', () => {
      const status = classifyCrawlError('Connection refused');
      expect(status).toBe<CrawlStatus>('failed_network');
    });

    it('should handle objects with message property', () => {
      const error = { message: 'Execution timeout after 300000ms' };
      const status = classifyCrawlError(error);
      expect(status).toBe<CrawlStatus>('failed_timeout');
    });
  });

  describe('extractErrorDetails', () => {
    it('should extract error code and message from Error', () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const details = extractErrorDetails(error);

      expect(details.message).toContain('Connection refused');
      expect(details.code).toBe('ECONNREFUSED');
    });

    it('should extract timeout error code', () => {
      const error = new Error('Execution timeout after 300000ms');
      const details = extractErrorDetails(error);

      expect(details.code).toBe('TIMEOUT');
    });

    it('should extract ENOTFOUND error code', () => {
      const error = new Error('ENOTFOUND example.com');
      const details = extractErrorDetails(error);

      expect(details.code).toBe('ENOTFOUND');
    });

    it('should return unknown code for unrecognized errors', () => {
      const error = new Error('Some random error');
      const details = extractErrorDetails(error);

      expect(details.code).toBe('UNKNOWN');
      expect(details.message).toBe('Some random error');
    });

    it('should handle string errors', () => {
      const details = extractErrorDetails('Network error message');

      expect(details.message).toBe('Network error message');
      expect(details.code).toBe('UNKNOWN');
    });

    it('should handle objects with message property', () => {
      const error = { message: 'Custom error', code: 'CUSTOM' };
      const details = extractErrorDetails(error);

      expect(details.message).toBe('Custom error');
    });

    it('should handle null/undefined gracefully', () => {
      const details1 = extractErrorDetails(null);
      const details2 = extractErrorDetails(undefined);

      expect(details1.message).toBe('Unknown error');
      expect(details2.message).toBe('Unknown error');
    });
  });

  describe('shouldRetryError', () => {
    it('should return true for network errors', () => {
      const error = new Error('ECONNREFUSED');
      expect(shouldRetryError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('Execution timeout');
      expect(shouldRetryError(error)).toBe(true);
    });

    it('should return false for invalid URL errors', () => {
      const error = new Error('Invalid URL');
      expect(shouldRetryError(error)).toBe(false);
    });

    it('should return false for errors not matching retry patterns', () => {
      const error = new Error('Some other error');
      expect(shouldRetryError(error)).toBe(false);
    });

    it('should handle string errors', () => {
      expect(shouldRetryError('ECONNREFUSED')).toBe(true);
      expect(shouldRetryError('Invalid URL')).toBe(false);
    });
  });

  describe('getErrorRecoveryStrategy', () => {
    it('should return retry strategy for network errors', () => {
      const error = new Error('ECONNREFUSED');
      const strategy = getErrorRecoveryStrategy(error);

      expect(strategy.action).toBe('retry');
      expect(strategy.maxAttempts).toBe(3);
      expect(strategy.backoffDelays).toEqual([10000, 30000, 60000]);
    });

    it('should return retry strategy for timeout errors', () => {
      const error = new Error('Execution timeout after 300000ms');
      const strategy = getErrorRecoveryStrategy(error);

      expect(strategy.action).toBe('retry');
      expect(strategy.maxAttempts).toBe(3);
    });

    it('should return fail strategy for invalid URL errors', () => {
      const error = new Error('Invalid URL');
      const strategy = getErrorRecoveryStrategy(error);

      expect(strategy.action).toBe('fail');
      expect(strategy.recommendation).toContain('URL');
    });

    it('should return defer strategy for quota exceeded errors', () => {
      const error = new Error('API quota exceeded');
      const strategy = getErrorRecoveryStrategy(error);

      expect(strategy.action).toBe('defer');
      expect(strategy.recommendation).toContain('할당량');
    });

    it('should provide user-friendly recommendations', () => {
      const error = new Error('ENOTFOUND example.com');
      const strategy = getErrorRecoveryStrategy(error);

      expect(strategy.recommendation).toBeTruthy();
      expect(typeof strategy.recommendation).toBe('string');
    });

    it('should provide technical details for debugging', () => {
      const error = new Error('ECONNREFUSED');
      const strategy = getErrorRecoveryStrategy(error);

      expect(strategy.debugInfo).toBeTruthy();
      expect(strategy.debugInfo.code).toBeTruthy();
      expect(strategy.debugInfo.message).toBeTruthy();
    });
  });

  describe('integration: error classification flow', () => {
    it('should handle complete flow for timeout error', () => {
      const error = new Error('Playwright: Timeout 300000ms exceeded');

      const status = classifyCrawlError(error);
      const details = extractErrorDetails(error);
      const strategy = getErrorRecoveryStrategy(error);

      expect(status).toBe('failed_timeout');
      expect(details.code).toBe('TIMEOUT');
      expect(strategy.action).toBe('retry');
    });

    it('should handle complete flow for network error', () => {
      const error = new Error('ENOTFOUND example.com');

      const status = classifyCrawlError(error);
      const details = extractErrorDetails(error);
      const strategy = getErrorRecoveryStrategy(error);

      expect(status).toBe('failed_network');
      expect(details.code).toBe('ENOTFOUND');
      expect(strategy.action).toBe('retry');
    });

    it('should handle complete flow for invalid URL error', () => {
      const error = new Error('Invalid URL provided');

      const status = classifyCrawlError(error);
      const strategy = getErrorRecoveryStrategy(error);

      expect(status).toBe('failed_invalid_url');
      expect(strategy.action).toBe('fail');
    });
  });
});
