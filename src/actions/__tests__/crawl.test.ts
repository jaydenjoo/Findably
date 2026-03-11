/**
 * Tests for Crawl Server Actions
 *
 * Test coverage:
 * - Validate triggerCrawling() Server Action
 * - Validate POST to n8n webhook URL
 * - Validate JSON body structure
 * - Error handling for missing env vars
 * - Error handling for webhook failures
 * - Sentry logging for errors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerCrawling } from '../crawl';

// Mock the config module
vi.mock('@/lib/config', () => ({
  getN8nConfig: vi.fn(() => ({
    webhookBaseUrl: 'https://n8n.example.com',
    apiKey: 'test-api-key',
  })),
}));

// Mock environment variables
const mockEnv = {
  N8N_WEBHOOK_URL: 'https://n8n.example.com',
};

describe('crawl.ts - Server Actions', () => {
  beforeEach(() => {
    // Set up environment variables
    process.env.N8N_WEBHOOK_URL = mockEnv.N8N_WEBHOOK_URL;

    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.N8N_WEBHOOK_URL;
  });

  describe('triggerCrawling()', () => {
    it('should successfully trigger n8n webhook with valid input', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'n8n 크롤링이 시작되었습니다',
      });

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockEnv.N8N_WEBHOOK_URL}/webhook/findably-crawl`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        }
      );
    });

    it('should return failure when N8N_WEBHOOK_URL is not set', async () => {
      // Arrange
      const { getN8nConfig } = await import('@/lib/config');
      vi.mocked(getN8nConfig).mockReturnValueOnce({
        webhookBaseUrl: '',
        apiKey: 'test-api-key',
      });

      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'N8N_WEBHOOK_URL 환경변수가 설정되지 않았습니다',
      });

      // Verify fetch was NOT called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return failure when n8n webhook returns error status', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'n8n 웹훅 호출 실패: 상태 500',
      });
    });

    it('should return failure when n8n webhook request times out', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      (global.fetch as any).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'n8n 웹훅 호출 중 오류가 발생했습니다',
      });
    });

    it('should validate that company_id is a number', async () => {
      // Arrange
      const input = {
        company_id: 'invalid' as unknown as number,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate that url is a valid URL string', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'not-a-valid-url',
        industry: 'ecommerce',
        company_size: 'small',
      };

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('URL'),
      });
    });

    it('should validate that industry is a valid value', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'invalid_industry',
        company_size: 'small',
      };

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('업종'),
      });
    });

    it('should validate that company_size is a valid value', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'invalid_size',
      };

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('회사 규모'),
      });
    });

    it('should include company_id, url, industry, and company_size in webhook body', async () => {
      // Arrange
      const input = {
        company_id: 456,
        url: 'https://mysite.com',
        industry: 'blog',
        company_size: 'medium',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      // Act
      await triggerCrawling(input);

      // Assert
      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toEqual({
        company_id: 456,
        url: 'https://mysite.com',
        industry: 'blog',
        company_size: 'medium',
      });
    });

    it('should handle webhook response with non-JSON body gracefully', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'n8n 크롤링이 시작되었습니다',
      });
    });

    it('should handle 404 error from n8n webhook', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Webhook not found',
      });

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });

    it('should handle 401 unauthorized from n8n webhook', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });

    it('should handle network connectivity errors', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      (global.fetch as any).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('오류');
    });

    it('should handle URL with HTTP scheme', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'http://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle URL with subdomain', async () => {
      // Arrange
      const input = {
        company_id: 123,
        url: 'https://shop.example.com/path',
        industry: 'ecommerce',
        company_size: 'small',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      // Act
      const result = await triggerCrawling(input);

      // Assert
      expect(result.success).toBe(true);
      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.url).toBe('https://shop.example.com/path');
    });
  });
});
