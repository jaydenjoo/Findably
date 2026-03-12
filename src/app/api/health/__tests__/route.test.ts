import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock the health-checker module
vi.mock('@/lib/health/health-checker', () => ({
  checkAllServices: vi.fn(),
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with healthy status', async () => {
    const { checkAllServices } = await import('@/lib/health/health-checker');
    vi.mocked(checkAllServices).mockResolvedValue({
      status: 'healthy',
      timestamp: '2026-03-12T10:00:00Z',
      services: {
        database: { status: 'healthy', latency_ms: 10 },
        claude: { status: 'healthy', latency_ms: 5 },
        pagespeed: { status: 'healthy', latency_ms: 8 },
        n8n: { status: 'healthy', latency_ms: 15 },
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.services.database.status).toBe('healthy');
  });

  it('should return 200 with degraded status', async () => {
    const { checkAllServices } = await import('@/lib/health/health-checker');
    vi.mocked(checkAllServices).mockResolvedValue({
      status: 'degraded',
      timestamp: '2026-03-12T10:00:00Z',
      services: {
        database: { status: 'healthy', latency_ms: 10 },
        claude: { status: 'healthy', latency_ms: 5 },
        pagespeed: { status: 'degraded', latency_ms: 0, message: 'API key not configured' },
        n8n: { status: 'healthy', latency_ms: 15 },
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('degraded');
  });

  it('should return 503 with unhealthy status', async () => {
    const { checkAllServices } = await import('@/lib/health/health-checker');
    vi.mocked(checkAllServices).mockResolvedValue({
      status: 'unhealthy',
      timestamp: '2026-03-12T10:00:00Z',
      services: {
        database: { status: 'unhealthy', latency_ms: 5000, message: 'Connection refused' },
        claude: { status: 'healthy', latency_ms: 5 },
        pagespeed: { status: 'healthy', latency_ms: 8 },
        n8n: { status: 'healthy', latency_ms: 15 },
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
  });

  it('should include all services in response', async () => {
    const { checkAllServices } = await import('@/lib/health/health-checker');
    vi.mocked(checkAllServices).mockResolvedValue({
      status: 'healthy',
      timestamp: '2026-03-12T10:00:00Z',
      services: {
        database: { status: 'healthy', latency_ms: 10 },
        claude: { status: 'healthy', latency_ms: 5 },
        pagespeed: { status: 'healthy', latency_ms: 8 },
        n8n: { status: 'healthy', latency_ms: 15 },
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(data.services).toHaveProperty('database');
    expect(data.services).toHaveProperty('claude');
    expect(data.services).toHaveProperty('pagespeed');
    expect(data.services).toHaveProperty('n8n');
  });

  it('should include timestamp in ISO format', async () => {
    const { checkAllServices } = await import('@/lib/health/health-checker');
    vi.mocked(checkAllServices).mockResolvedValue({
      status: 'healthy',
      timestamp: '2026-03-12T10:00:00Z',
      services: {
        database: { status: 'healthy', latency_ms: 10 },
        claude: { status: 'healthy', latency_ms: 5 },
        pagespeed: { status: 'healthy', latency_ms: 8 },
        n8n: { status: 'healthy', latency_ms: 15 },
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should set appropriate cache headers', async () => {
    const { checkAllServices } = await import('@/lib/health/health-checker');
    vi.mocked(checkAllServices).mockResolvedValue({
      status: 'healthy',
      timestamp: '2026-03-12T10:00:00Z',
      services: {
        database: { status: 'healthy', latency_ms: 10 },
        claude: { status: 'healthy', latency_ms: 5 },
        pagespeed: { status: 'healthy', latency_ms: 8 },
        n8n: { status: 'healthy', latency_ms: 15 },
      },
    });

    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should handle unexpected errors gracefully', async () => {
    const { checkAllServices } = await import('@/lib/health/health-checker');
    vi.mocked(checkAllServices).mockRejectedValue(
      new Error('Unexpected error in health check')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.error).toContain('Unexpected error');
  });
});
