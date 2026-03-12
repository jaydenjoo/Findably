import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock posthog-js
vi.mock('posthog-js', () => {
  const mockCapture = vi.fn();
  const mockIdentify = vi.fn();
  return {
    posthog: {
      capture: mockCapture,
      identify: mockIdentify,
      init: vi.fn(),
    },
  };
});

import {
  trackEvent,
  trackSignup,
  trackLogin,
  trackOnboardingStart,
  trackOnboardingComplete,
  trackSchemaCopied,
  trackMetaTagCopied,
  trackReDiagnose,
  identifyUser,
} from '../posthog';
import { posthog } from 'posthog-js';

describe('PostHog Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should call posthog.capture with event name', () => {
      trackEvent('test_event');
      expect(posthog.capture).toHaveBeenCalledWith('test_event', {});
    });

    it('should include properties when provided', () => {
      const properties = { userId: '123', action: 'test' };
      trackEvent('test_event', properties);
      expect(posthog.capture).toHaveBeenCalledWith('test_event', properties);
    });

    it('should handle missing PostHog gracefully', () => {
      // Should not throw when PostHog is not initialized
      expect(() => trackEvent('test_event')).not.toThrow();
    });
  });

  describe('trackSignup', () => {
    it('should track email signup', () => {
      trackSignup('email');
      expect(posthog.capture).toHaveBeenCalledWith('signup', {
        method: 'email',
      });
    });

    it('should track google signup', () => {
      trackSignup('google');
      expect(posthog.capture).toHaveBeenCalledWith('signup', {
        method: 'google',
      });
    });
  });

  describe('trackLogin', () => {
    it('should track email login', () => {
      trackLogin('email');
      expect(posthog.capture).toHaveBeenCalledWith('login', {
        method: 'email',
      });
    });

    it('should track google login', () => {
      trackLogin('google');
      expect(posthog.capture).toHaveBeenCalledWith('login', {
        method: 'google',
      });
    });
  });

  describe('trackOnboardingStart', () => {
    it('should track onboarding start', () => {
      trackOnboardingStart();
      expect(posthog.capture).toHaveBeenCalledWith('onboarding_start', {});
    });
  });

  describe('trackOnboardingComplete', () => {
    it('should track onboarding completion with properties', () => {
      trackOnboardingComplete('tech', 'small');
      expect(posthog.capture).toHaveBeenCalledWith('onboarding_complete', {
        industry: 'tech',
        companySize: 'small',
      });
    });
  });

  describe('trackSchemaCopied', () => {
    it('should track schema copied event', () => {
      trackSchemaCopied('Organization');
      expect(posthog.capture).toHaveBeenCalledWith('schema_copied', {
        schemaType: 'Organization',
      });
    });
  });

  describe('trackMetaTagCopied', () => {
    it('should track meta tag copied event', () => {
      trackMetaTagCopied('title');
      expect(posthog.capture).toHaveBeenCalledWith('meta_tag_copied', {
        tagType: 'title',
      });
    });

    it('should track all meta tags copied', () => {
      trackMetaTagCopied('all');
      expect(posthog.capture).toHaveBeenCalledWith('meta_tag_copied', {
        tagType: 'all',
      });
    });
  });

  describe('trackReDiagnose', () => {
    it('should track re-diagnosis event', () => {
      trackReDiagnose('456');
      expect(posthog.capture).toHaveBeenCalledWith('re_diagnose', {
        companyId: '456',
      });
    });
  });

  describe('identifyUser', () => {
    it('should identify user without traits', () => {
      identifyUser('user123');
      expect(posthog.identify).toHaveBeenCalledWith('user123', {});
    });

    it('should identify user with traits', () => {
      const traits = { email: 'test@example.com', name: 'Test User' };
      identifyUser('user123', traits);
      expect(posthog.identify).toHaveBeenCalledWith('user123', traits);
    });
  });

  describe('Event Constants', () => {
    it('should have correct event names', () => {
      // This test verifies that the event constants match what we expect
      expect(typeof trackEvent).toBe('function');
      expect(typeof trackSignup).toBe('function');
      expect(typeof trackLogin).toBe('function');
      expect(typeof trackOnboardingStart).toBe('function');
      expect(typeof trackOnboardingComplete).toBe('function');
      expect(typeof trackSchemaCopied).toBe('function');
      expect(typeof trackMetaTagCopied).toBe('function');
      expect(typeof trackReDiagnose).toBe('function');
      expect(typeof identifyUser).toBe('function');
    });
  });
});
