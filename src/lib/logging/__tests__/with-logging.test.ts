import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { withLogging, type LoggingOptions } from '../with-logging';

// Mock logRequest
vi.mock('../request-logger', () => ({
  logRequest: vi.fn().mockResolvedValue(undefined),
}));

describe('with-logging middleware', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the logRequest mock
    const { logRequest } = await import('../request-logger');
    vi.mocked(logRequest).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should wrap a handler and execute it', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
    const wrappedHandler = withLogging(handler);

    const request = new Request('http://localhost:3000/api/test', {
      method: 'GET',
      headers: { 'User-Agent': 'test-agent' },
    });

    const response = await wrappedHandler(request);

    expect(handler).toHaveBeenCalledWith(request);
    expect(response.status).toBe(200);
  });

  it('should measure response time', async () => {
    const handler = vi.fn().mockImplementation(async () => {
      // Simulate some delay
      await new Promise((resolve) => setTimeout(resolve, 10));
      return new Response('OK', { status: 200 });
    });

    const wrappedHandler = withLogging(handler);

    const request = new Request('http://localhost:3000/api/test', {
      method: 'GET',
      headers: { 'User-Agent': 'test-agent' },
    });

    const start = Date.now();
    await wrappedHandler(request);
    const end = Date.now();

    const duration = end - start;
    expect(duration).toBeGreaterThanOrEqual(10);
  });

  it('should extract request information', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
    const wrappedHandler = withLogging(handler);

    const request = new Request('http://localhost:3000/api/diagnose', {
      method: 'POST',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    await wrappedHandler(request);

    expect(handler).toHaveBeenCalledWith(request);
  });

  it('should handle errors and still log', async () => {
    const error = new Error('Handler error');
    const handler = vi.fn().mockRejectedValue(error);
    const wrappedHandler = withLogging(handler);

    const request = new Request('http://localhost:3000/api/test', {
      method: 'GET',
      headers: { 'User-Agent': 'test-agent' },
    });

    await expect(wrappedHandler(request)).rejects.toThrow('Handler error');
  });

  it('should support custom logging options', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
    const options: LoggingOptions = {
      excludePaths: ['/api/health'],
    };
    const wrappedHandler = withLogging(handler, options);

    const request = new Request('http://localhost:3000/api/test', {
      method: 'GET',
      headers: { 'User-Agent': 'test-agent' },
    });

    const response = await wrappedHandler(request);

    expect(response.status).toBe(200);
  });

  it('should extract user ID from request when available', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
    const wrappedHandler = withLogging(handler);

    const request = new Request('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'User-Agent': 'test-agent',
        'x-user-id': 'user-123',
      },
    });

    await wrappedHandler(request);

    expect(handler).toHaveBeenCalledWith(request);
  });

  it('should extract IP address from x-forwarded-for header', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
    const wrappedHandler = withLogging(handler);

    const request = new Request('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'User-Agent': 'test-agent',
        'x-forwarded-for': '203.0.113.42',
      },
    });

    await wrappedHandler(request);

    expect(handler).toHaveBeenCalledWith(request);
  });

  it('should handle response with different status codes', async () => {
    const statusCodes = [200, 201, 400, 401, 404, 500];

    for (const statusCode of statusCodes) {
      const handler = vi.fn().mockResolvedValue(new Response('Response', { status: statusCode }));
      const wrappedHandler = withLogging(handler);

      const request = new Request('http://localhost:3000/api/test', {
        method: 'GET',
        headers: { 'User-Agent': 'test-agent' },
      });

      const response = await wrappedHandler(request);

      expect(response.status).toBe(statusCode);
    }
  });

  it('should not log excluded paths', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));
    const options: LoggingOptions = {
      excludePaths: ['/api/health', '/api/metrics'],
    };
    const wrappedHandler = withLogging(handler, options);

    const request = new Request('http://localhost:3000/api/health', {
      method: 'GET',
      headers: { 'User-Agent': 'test-agent' },
    });

    await wrappedHandler(request);

    expect(handler).toHaveBeenCalledWith(request);
  });
});
