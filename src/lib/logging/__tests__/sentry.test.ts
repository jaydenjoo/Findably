import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import {
  addBreadcrumb,
  captureError,
  setUserContext,
  isSentryInitialized,
} from '../sentry';

// Mock @sentry/nextjs
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
}));

describe('Sentry Logging Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Restore environment
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isSentryInitialized', () => {
    it('should return true when SENTRY_DSN is set', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';
      const result = isSentryInitialized();
      expect(result).toBe(true);
    });

    it('should return true when NEXT_PUBLIC_SENTRY_DSN is set', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/123456';
      const result = isSentryInitialized();
      expect(result).toBe(true);
    });

    it('should return false when neither DSN is set', () => {
      const result = isSentryInitialized();
      expect(result).toBe(false);
    });

    it('should return true when both DSNs are set', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/654321';
      const result = isSentryInitialized();
      expect(result).toBe(true);
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb when Sentry is initialized', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      addBreadcrumb('onboarding', 'User submitted onboarding form', {
        url: 'https://example.com',
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'onboarding',
        message: 'User submitted onboarding form',
        data: {
          url: 'https://example.com',
        },
        level: 'info',
      });
    });

    it('should be a no-op when Sentry is not initialized', () => {
      addBreadcrumb('onboarding', 'User submitted onboarding form', {
        url: 'https://example.com',
      });

      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    });

    it('should handle breadcrumb without data', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      addBreadcrumb('diagnosis', 'Diagnosis started');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'diagnosis',
        message: 'Diagnosis started',
        data: undefined,
        level: 'info',
      });
    });

    it('should support different breadcrumb categories', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      const categories = [
        'onboarding',
        'diagnosis',
        'crawl',
        'generation',
        're-diagnosis',
      ] as const;

      for (const category of categories) {
        vi.clearAllMocks();
        addBreadcrumb(category, `${category} action`);

        expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category,
            message: `${category} action`,
          })
        );
      }
    });
  });

  describe('captureError', () => {
    it('should capture error when Sentry is initialized', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      const error = new Error('Test error');
      const context = {
        userId: '123',
        companyId: '456',
      };

      captureError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          contexts: {
            custom: context,
          },
        })
      );
    });

    it('should capture error with default level of error', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      const error = new Error('Test error');

      captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: 'error',
        })
      );
    });

    it('should capture error with custom level', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      const error = new Error('Test warning');

      captureError(error, undefined, 'warning');

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          level: 'warning',
        })
      );
    });

    it('should be a no-op when Sentry is not initialized', () => {
      const error = new Error('Test error');

      captureError(error, { userId: '123' });

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should handle error without context', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      const error = new Error('Test error');

      captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          contexts: {
            custom: undefined,
          },
        })
      );
    });

    it('should handle string errors', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      captureError('String error message', { action: 'test' });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        'String error message',
        expect.objectContaining({
          contexts: {
            custom: {
              action: 'test',
            },
          },
        })
      );
    });
  });

  describe('setUserContext', () => {
    it('should set user context when Sentry is initialized', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      setUserContext('user-123', {
        email: 'user@example.com',
        companyId: 'company-456',
      });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'user@example.com',
        custom: {
          companyId: 'company-456',
        },
      });
    });

    it('should set minimal user context with just userId', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      setUserContext('user-123');

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
      });
    });

    it('should be a no-op when Sentry is not initialized', () => {
      setUserContext('user-123', { email: 'user@example.com' });

      expect(Sentry.setUser).not.toHaveBeenCalled();
    });

    it('should clear user context when userId is null', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      setUserContext(null);

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });

    it('should handle additional custom fields', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      setUserContext('user-123', {
        email: 'user@example.com',
        companyId: 'company-456',
        plan: 'starter',
        subscriptionStatus: 'active',
      });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'user@example.com',
        custom: {
          companyId: 'company-456',
          plan: 'starter',
          subscriptionStatus: 'active',
        },
      });
    });
  });

  describe('Integration: Breadcrumb + Error Capture', () => {
    it('should log breadcrumb and then capture error', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      addBreadcrumb('onboarding', 'Form submitted', { url: 'https://test.com' });
      const error = new Error('Form validation failed');
      captureError(error, { step: 'onboarding' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should handle sequential breadcrumbs', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      addBreadcrumb('onboarding', 'Step 1 started');
      addBreadcrumb('onboarding', 'Step 2 started');
      addBreadcrumb('onboarding', 'Step 3 completed');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle errors without throwing', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      expect(() => {
        captureError(null as unknown as Error);
      }).not.toThrow();
    });

    it('should handle undefined context gracefully', () => {
      process.env.SENTRY_DSN = 'https://example@sentry.io/123456';

      const error = new Error('Test');
      expect(() => {
        captureError(error, undefined);
      }).not.toThrow();

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });
});
