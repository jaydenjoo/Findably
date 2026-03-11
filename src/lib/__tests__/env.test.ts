import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Environment Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    process.env = { ...originalEnv };
    const { clearEnvCache } = await import('../env');
    clearEnvCache();
  });

  afterEach(async () => {
    process.env = originalEnv;
    const { clearEnvCache } = await import('../env');
    clearEnvCache();
  });

  describe('validateEnv()', () => {
    it('should validate all required env variables', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { validateEnv } = await import('../env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('should throw error when required SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { validateEnv } = await import('../env');
      expect(() => validateEnv()).toThrow('NEXT_PUBLIC_SUPABASE_URL');
    });

    it('should throw error when required SUPABASE_ANON_KEY is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { validateEnv } = await import('../env');
      expect(() => validateEnv()).toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    });

    it('should throw error when required DATABASE_URL is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      delete process.env.DATABASE_URL;
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { validateEnv } = await import('../env');
      expect(() => validateEnv()).toThrow('DATABASE_URL');
    });

    it('should throw error when required ANTHROPIC_API_KEY is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      delete process.env.ANTHROPIC_API_KEY;
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { validateEnv } = await import('../env');
      expect(() => validateEnv()).toThrow('ANTHROPIC_API_KEY');
    });

    it('should throw error when required N8N_WEBHOOK_BASE_URL is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      delete process.env.N8N_WEBHOOK_BASE_URL;
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { validateEnv } = await import('../env');
      expect(() => validateEnv()).toThrow('N8N_WEBHOOK_BASE_URL');
    });

    it('should allow optional SENTRY_DSN to be missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';
      delete process.env.SENTRY_DSN;

      const { validateEnv } = await import('../env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('should validate DATABASE_URL format', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'invalid-url';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { validateEnv } = await import('../env');
      expect(() => validateEnv()).toThrow();
    });

    it('should validate SUPABASE_URL format', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { validateEnv } = await import('../env');
      expect(() => validateEnv()).toThrow();
    });
  });

  describe('getEnvConfig()', () => {
    it('should return properly typed config object', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { getEnvConfig } = await import('../env');
      const config = getEnvConfig();

      expect(config).toHaveProperty('supabase');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('anthropic');
      expect(config).toHaveProperty('pageSpeed');
      expect(config).toHaveProperty('n8n');
      expect(config).toHaveProperty('app');
      expect(config).toHaveProperty('sentry');
    });

    it('should return correct Supabase config', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { getEnvConfig } = await import('../env');
      const config = getEnvConfig();

      expect(config.supabase.url).toBe('https://test.supabase.co');
      expect(config.supabase.anonKey).toBe('test-anon-key');
      expect(config.supabase.serviceRoleKey).toBe('test-service-role-key');
    });

    it('should return correct Database config', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { getEnvConfig } = await import('../env');
      const config = getEnvConfig();

      expect(config.database.url).toBe('postgresql://user:pass@host/db');
    });

    it('should return correct Anthropic config', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { getEnvConfig } = await import('../env');
      const config = getEnvConfig();

      expect(config.anthropic.apiKey).toBe('sk-test-anthropic-key');
    });

    it('should return correct n8n config', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';

      const { getEnvConfig } = await import('../env');
      const config = getEnvConfig();

      expect(config.n8n.webhookBaseUrl).toBe('https://n8n.example.com');
      expect(config.n8n.apiKey).toBe('test-n8n-key');
    });

    it('should return undefined for optional Sentry config when not set', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';
      delete process.env.SENTRY_DSN;

      const { getEnvConfig } = await import('../env');
      const config = getEnvConfig();

      expect(config.sentry.dsn).toBeUndefined();
    });

    it('should return correct Sentry config when set', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
      process.env.DATABASE_URL = 'postgresql://user:pass@host/db';
      process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'test-pagespeed-key';
      process.env.N8N_WEBHOOK_BASE_URL = 'https://n8n.example.com';
      process.env.N8N_API_KEY = 'test-n8n-key';
      process.env.NEXT_PUBLIC_APP_URL = 'https://findably.com';
      process.env.SENTRY_DSN = 'https://key@sentry.io/project-id';

      const { getEnvConfig } = await import('../env');
      const config = getEnvConfig();

      expect(config.sentry.dsn).toBe('https://key@sentry.io/project-id');
    });
  });
});
