import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkDatabase,
  checkClaudeApi,
  checkPageSpeedApi,
  checkN8n,
  checkAllServices,
} from '../health-checker';

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  createServiceDb: vi.fn(() => ({
    execute: vi.fn(),
  })),
}));

describe('Health Checker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear env vars
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GOOGLE_PAGESPEED_API_KEY;
    delete process.env.N8N_WEBHOOK_BASE_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkDatabase', () => {
    it('should return healthy status when database query succeeds', async () => {
      const { createServiceDb } = await import('@/lib/db/client');
      vi.mocked(createServiceDb).mockReturnValue({
        execute: vi.fn().mockResolvedValue(true),
      } as unknown as ReturnType<typeof createServiceDb>);

      const result = await checkDatabase();

      expect(result.status).toBe('healthy');
      expect(result.name).toBe('database');
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
      expect(result.message).toBeUndefined();
    });

    it('should return unhealthy status when database query fails', async () => {
      const { createServiceDb } = await import('@/lib/db/client');
      vi.mocked(createServiceDb).mockReturnValue({
        execute: vi.fn().mockRejectedValue(new Error('Connection refused')),
      } as unknown as ReturnType<typeof createServiceDb>);

      const result = await checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.name).toBe('database');
      expect(result.message).toContain('Connection refused');
    });

    it('should measure latency correctly', async () => {
      const { createServiceDb } = await import('@/lib/db/client');
      vi.mocked(createServiceDb).mockReturnValue({
        execute: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => setTimeout(() => resolve(true), 50))
        ),
      } as unknown as ReturnType<typeof createServiceDb>);

      const result = await checkDatabase();

      expect(result.latency_ms).toBeGreaterThanOrEqual(50);
    });
  });

  describe('checkClaudeApi', () => {
    it('should return healthy status when API key is set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-test-key';

      const result = checkClaudeApi();

      expect(result.status).toBe('healthy');
      expect(result.name).toBe('claude');
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
      expect(result.message).toBeUndefined();
    });

    it('should return degraded status when API key is missing', () => {
      const result = checkClaudeApi();

      expect(result.status).toBe('degraded');
      expect(result.name).toBe('claude');
      expect(result.message).toContain('API key not configured');
    });

    it('should return degraded status when API key is empty string', () => {
      process.env.ANTHROPIC_API_KEY = '   ';

      const result = checkClaudeApi();

      expect(result.status).toBe('degraded');
      expect(result.message).toContain('API key not configured');
    });
  });

  describe('checkPageSpeedApi', () => {
    it('should return healthy status when API key is set', () => {
      process.env.GOOGLE_PAGESPEED_API_KEY = 'AIzaSyD-test-key';

      const result = checkPageSpeedApi();

      expect(result.status).toBe('healthy');
      expect(result.name).toBe('pagespeed');
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
      expect(result.message).toBeUndefined();
    });

    it('should return degraded status when API key is missing', () => {
      const result = checkPageSpeedApi();

      expect(result.status).toBe('degraded');
      expect(result.name).toBe('pagespeed');
      expect(result.message).toContain('API key not configured');
    });

    it('should return degraded status when API key is empty', () => {
      process.env.GOOGLE_PAGESPEED_API_KEY = '';

      const result = checkPageSpeedApi();

      expect(result.status).toBe('degraded');
    });
  });

  describe('checkN8n', () => {
    it('should return healthy status when webhook URL is reachable', async () => {
      process.env.N8N_WEBHOOK_BASE_URL = 'http://localhost:5678';

      // Mock fetch for successful response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await checkN8n();

      expect(result.status).toBe('healthy');
      expect(result.name).toBe('n8n');
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return healthy status when webhook returns 405 (Method Not Allowed)', async () => {
      process.env.N8N_WEBHOOK_BASE_URL = 'http://localhost:5678';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 405,
      });

      const result = await checkN8n();

      expect(result.status).toBe('healthy');
    });

    it('should return degraded status when webhook URL is not configured', async () => {
      const result = await checkN8n();

      expect(result.status).toBe('degraded');
      expect(result.name).toBe('n8n');
      expect(result.message).toContain('Webhook URL not configured');
    });

    it('should return degraded status when webhook returns error status', async () => {
      process.env.N8N_WEBHOOK_BASE_URL = 'http://localhost:5678';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await checkN8n();

      expect(result.status).toBe('degraded');
      expect(result.message).toContain('500');
    });

    it('should return degraded status when webhook request fails', async () => {
      process.env.N8N_WEBHOOK_BASE_URL = 'http://localhost:5678';

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkN8n();

      expect(result.status).toBe('degraded');
      expect(result.message).toContain('Network error');
    });
  });

  describe('checkAllServices', () => {
    it('should return healthy overall status when all services are healthy', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-test';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'AIzaSy-test';
      process.env.N8N_WEBHOOK_BASE_URL = 'http://localhost:5678';

      const { createServiceDb } = await import('@/lib/db/client');
      vi.mocked(createServiceDb).mockReturnValue({
        execute: vi.fn().mockResolvedValue(true),
      } as unknown as ReturnType<typeof createServiceDb>);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await checkAllServices();

      expect(result.status).toBe('healthy');
      expect(result.services.database.status).toBe('healthy');
      expect(result.services.claude.status).toBe('healthy');
      expect(result.services.pagespeed.status).toBe('healthy');
      expect(result.services.n8n.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
    });

    it('should return degraded status when one service is degraded', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-test';
      // Missing PageSpeed key
      process.env.N8N_WEBHOOK_BASE_URL = 'http://localhost:5678';

      const { createServiceDb } = await import('@/lib/db/client');
      vi.mocked(createServiceDb).mockReturnValue({
        execute: vi.fn().mockResolvedValue(true),
      } as unknown as ReturnType<typeof createServiceDb>);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await checkAllServices();

      expect(result.status).toBe('degraded');
      expect(result.services.pagespeed.status).toBe('degraded');
    });

    it('should return unhealthy status when any service is unhealthy', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-test';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'AIzaSy-test';
      process.env.N8N_WEBHOOK_BASE_URL = 'http://localhost:5678';

      const { createServiceDb } = await import('@/lib/db/client');
      vi.mocked(createServiceDb).mockReturnValue({
        execute: vi.fn().mockRejectedValue(new Error('DB down')),
      } as unknown as ReturnType<typeof createServiceDb>);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await checkAllServices();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('unhealthy');
    });

    it('should include service latencies in response', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-test';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'AIzaSy-test';
      process.env.N8N_WEBHOOK_BASE_URL = 'http://localhost:5678';

      const { createServiceDb } = await import('@/lib/db/client');
      vi.mocked(createServiceDb).mockReturnValue({
        execute: vi.fn().mockResolvedValue(true),
      } as unknown as ReturnType<typeof createServiceDb>);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await checkAllServices();

      expect(result.services.database.latency_ms).toBeGreaterThanOrEqual(0);
      expect(result.services.claude.latency_ms).toBeGreaterThanOrEqual(0);
      expect(result.services.pagespeed.latency_ms).toBeGreaterThanOrEqual(0);
      expect(result.services.n8n.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return ISO timestamp in response', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-test';
      process.env.GOOGLE_PAGESPEED_API_KEY = 'AIzaSy-test';
      process.env.N8N_WEBHOOK_BASE_URL = 'http://localhost:5678';

      const { createServiceDb } = await import('@/lib/db/client');
      vi.mocked(createServiceDb).mockReturnValue({
        execute: vi.fn().mockResolvedValue(true),
      } as unknown as ReturnType<typeof createServiceDb>);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await checkAllServices();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
