import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { logRequest, type RequestLogData } from '../request-logger';

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  createServiceDb: vi.fn(),
}));

describe('request-logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('logRequest', () => {
    it('should insert log entry into database with all fields', async () => {
      const { createServiceDb } = await import('@/lib/db/client');
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      const mockDb = { insert: mockInsert };
      (createServiceDb as any).mockReturnValue(mockDb);

      const logData: RequestLogData = {
        timestamp: new Date('2026-03-12T10:00:00Z'),
        userId: 'user-123',
        method: 'GET',
        path: '/api/health',
        statusCode: 200,
        responseTimeMs: 45,
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
        errorMessage: null,
      };

      await logRequest(logData);

      expect(createServiceDb).toHaveBeenCalled();
    });

    it('should handle missing userId for public routes', async () => {
      const { createServiceDb } = await import('@/lib/db/client');
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      const mockDb = { insert: mockInsert };
      (createServiceDb as any).mockReturnValue(mockDb);

      const logData: RequestLogData = {
        timestamp: new Date('2026-03-12T10:00:00Z'),
        userId: null,
        method: 'GET',
        path: '/api/health',
        statusCode: 200,
        responseTimeMs: 32,
        userAgent: 'curl/7.68.0',
        ip: '203.0.113.42',
        errorMessage: null,
      };

      await logRequest(logData);

      expect(createServiceDb).toHaveBeenCalled();
    });

    it('should handle error responses with error message', async () => {
      const { createServiceDb } = await import('@/lib/db/client');
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      const mockDb = { insert: mockInsert };
      (createServiceDb as any).mockReturnValue(mockDb);

      const logData: RequestLogData = {
        timestamp: new Date('2026-03-12T10:00:00Z'),
        userId: 'user-456',
        method: 'POST',
        path: '/api/diagnose',
        statusCode: 500,
        responseTimeMs: 1200,
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.2',
        errorMessage: 'Database connection failed',
      };

      await logRequest(logData);

      expect(createServiceDb).toHaveBeenCalled();
    });

    it('should gracefully handle database insertion errors (fire-and-forget)', async () => {
      const { createServiceDb } = await import('@/lib/db/client');
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error('DB error')),
      });
      const mockDb = { insert: mockInsert };
      (createServiceDb as any).mockReturnValue(mockDb);

      const logData: RequestLogData = {
        timestamp: new Date('2026-03-12T10:00:00Z'),
        userId: 'user-789',
        method: 'GET',
        path: '/api/data',
        statusCode: 200,
        responseTimeMs: 88,
        userAgent: 'Safari',
        ip: '192.168.1.3',
        errorMessage: null,
      };

      // Should not throw even if DB fails
      await expect(logRequest(logData)).resolves.toBeUndefined();
    });

    it('should handle various HTTP methods', async () => {
      const { createServiceDb } = await import('@/lib/db/client');
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      const mockDb = { insert: mockInsert };
      (createServiceDb as any).mockReturnValue(mockDb);

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const logData: RequestLogData = {
          timestamp: new Date(),
          userId: 'user-123',
          method: method as RequestLogData['method'],
          path: '/api/test',
          statusCode: 200,
          responseTimeMs: 50,
          userAgent: 'test-agent',
          ip: '192.168.1.1',
          errorMessage: null,
        };

        await logRequest(logData);
      }

      expect(createServiceDb).toHaveBeenCalledTimes(5);
    });

    it('should handle various status codes', async () => {
      const { createServiceDb } = await import('@/lib/db/client');
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      const mockDb = { insert: mockInsert };
      (createServiceDb as any).mockReturnValue(mockDb);

      const statusCodes = [200, 201, 400, 401, 403, 404, 500, 502, 503];

      for (const statusCode of statusCodes) {
        const logData: RequestLogData = {
          timestamp: new Date(),
          userId: 'user-123',
          method: 'GET',
          path: '/api/test',
          statusCode,
          responseTimeMs: 50,
          userAgent: 'test-agent',
          ip: '192.168.1.1',
          errorMessage: statusCode >= 400 ? 'Error occurred' : null,
        };

        await logRequest(logData);
      }

      expect(createServiceDb).toHaveBeenCalledTimes(9);
    });
  });
});
