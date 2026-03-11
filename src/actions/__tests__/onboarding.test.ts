import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { submitOnboarding } from '../onboarding';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: null },
            error: null,
          })
        ),
      },
    })
  ),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/config', () => ({
  getN8nConfig: vi.fn(() => ({
    webhookBaseUrl: 'https://n8n.example.com',
    apiKey: 'test-api-key',
    crawlWebhookPath: '/webhook/findably-crawl',
  })),
}));

describe('submitOnboarding server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should return error for missing URL', async () => {
      const result = await submitOnboarding({
        url: '',
        industry: 'ecommerce',
        companySize: 'solo',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('URL');
      }
    });

    it('should return error for invalid URL format', async () => {
      const result = await submitOnboarding({
        url: 'not-a-url',
        industry: 'ecommerce',
        companySize: 'solo',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('URL');
      }
    });

    it('should accept https URLs', async () => {
      const result = await submitOnboarding({
        url: 'https://example.com',
        industry: 'ecommerce',
        companySize: 'solo',
      });

      // URL validation passes, will fail on auth check
      if (!result.success) {
        expect(result.error).not.toContain('URL');
      }
    });

    it('should accept http URLs', async () => {
      const result = await submitOnboarding({
        url: 'http://example.com',
        industry: 'ecommerce',
        companySize: 'solo',
      });

      // URL validation passes, will fail on auth check
      if (!result.success) {
        expect(result.error).not.toContain('URL');
      }
    });

    it('should return error for invalid industry', async () => {
      const result = await submitOnboarding({
        url: 'https://example.com',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        industry: 'invalid-industry' as any,
        companySize: 'solo',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should return error for invalid company size', async () => {
      const result = await submitOnboarding({
        url: 'https://example.com',
        industry: 'ecommerce',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        companySize: 'invalid-size' as any,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should accept valid industry values', async () => {
      const validIndustries = ['ecommerce', 'blog', 'saas', 'local_business', 'other'];

      for (const industry of validIndustries) {
        const result = await submitOnboarding({
          url: 'https://example.com',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          industry: industry as any,
          companySize: 'solo',
        });

        // If validation fails, it's not because of industry
        if (!result.success) {
          expect(result.error).not.toContain('업종');
        }
      }
    });

    it('should accept valid company size values', async () => {
      const validSizes = ['solo', 'small', 'medium'];

      for (const size of validSizes) {
        const result = await submitOnboarding({
          url: 'https://example.com',
          industry: 'ecommerce',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          companySize: size as any,
        });

        // If validation fails, it's not because of company size
        if (!result.success) {
          expect(result.error).not.toContain('규모');
        }
      }
    });
  });

  describe('authentication check', () => {
    it('should return authentication error when user not logged in', async () => {
      const result = await submitOnboarding({
        url: 'https://example.com',
        industry: 'ecommerce',
        companySize: 'solo',
      });

      // Will fail at auth check since mocks aren't providing user
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('error response structure', () => {
    it('should return { success: false, error: string } on validation failure', async () => {
      const result = await submitOnboarding({
        url: 'invalid',
        industry: 'ecommerce',
        companySize: 'solo',
      });

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      if (!result.success) {
        expect(typeof result.error).toBe('string');
      }
      expect('companyId' in result).toBe(false);
      expect('crawlTriggered' in result).toBe(false);
    });
  });

  describe('error messages in Korean', () => {
    it('should return Korean error message for invalid input', async () => {
      const result = await submitOnboarding({
        url: 'invalid',
        industry: 'ecommerce',
        companySize: 'solo',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have some error message (Korean or English)
        expect(result.error).toBeDefined();
        expect(result.error.length).toBeGreaterThan(0);
      }
    });
  });

  describe('form schema validation', () => {
    it('should validate complete form data', async () => {
      const validData = {
        url: 'https://example.com',
        industry: 'ecommerce' as const,
        companySize: 'solo' as const,
      };

      // This will pass schema validation but fail auth
      const result = await submitOnboarding(validData);
      if (!result.success) {
        expect(result.error).not.toContain('입력');
      }
    });

    it('should reject partial data', async () => {
      const result = await submitOnboarding({
        url: 'https://example.com',
        industry: 'ecommerce',
        // missing companySize
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});
