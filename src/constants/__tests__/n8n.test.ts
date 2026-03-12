import { describe, it, expect } from 'vitest';
import {
  N8N_CRAWL_WEBHOOK_PATH,
  N8N_REDIAGNOSIS_WEBHOOK_PATH,
  N8N_DEFAULT_PORT,
  N8N_HEALTH_CHECK_PATH,
  buildN8nWebhookUrl,
  buildN8nHealthCheckUrl,
} from '../n8n';

describe('n8n Constants', () => {
  describe('Webhook path constants', () => {
    it('should define crawl webhook path', () => {
      expect(N8N_CRAWL_WEBHOOK_PATH).toBe('/webhook/findably-crawl');
    });

    it('should define rediagnosis webhook path', () => {
      expect(N8N_REDIAGNOSIS_WEBHOOK_PATH).toBe('/webhook/findably-rediagnosis');
    });

    it('should define health check path', () => {
      expect(N8N_HEALTH_CHECK_PATH).toBe('/api/v1/health');
    });

    it('should define default port as 5678', () => {
      expect(N8N_DEFAULT_PORT).toBe(5678);
    });
  });

  describe('buildN8nWebhookUrl', () => {
    it('should build URL from base and path without trailing slash on base', () => {
      const url = buildN8nWebhookUrl(
        'https://n8n.railway.app',
        '/webhook/findably-crawl'
      );
      expect(url).toBe('https://n8n.railway.app/webhook/findably-crawl');
    });

    it('should build URL from base with trailing slash on base', () => {
      const url = buildN8nWebhookUrl(
        'https://n8n.railway.app/',
        '/webhook/findably-crawl'
      );
      expect(url).toBe('https://n8n.railway.app/webhook/findably-crawl');
    });

    it('should build URL when path does not start with slash', () => {
      const url = buildN8nWebhookUrl('https://n8n.railway.app', 'webhook/findably-crawl');
      expect(url).toBe('https://n8n.railway.app/webhook/findably-crawl');
    });

    it('should use default path when no path provided', () => {
      const url = buildN8nWebhookUrl('https://n8n.railway.app');
      expect(url).toBe('https://n8n.railway.app/webhook/findably-crawl');
    });

    it('should handle localhost URL', () => {
      const url = buildN8nWebhookUrl('http://localhost:5678');
      expect(url).toBe('http://localhost:5678/webhook/findably-crawl');
    });

    it('should handle environment-specific URLs', () => {
      const devUrl = buildN8nWebhookUrl('http://localhost:5678', N8N_CRAWL_WEBHOOK_PATH);
      const prodUrl = buildN8nWebhookUrl(
        'https://n8n-prod.railway.app',
        N8N_CRAWL_WEBHOOK_PATH
      );

      expect(devUrl).toBe('http://localhost:5678/webhook/findably-crawl');
      expect(prodUrl).toBe('https://n8n-prod.railway.app/webhook/findably-crawl');
    });
  });

  describe('buildN8nHealthCheckUrl', () => {
    it('should build health check URL', () => {
      const url = buildN8nHealthCheckUrl('https://n8n.railway.app');
      expect(url).toBe('https://n8n.railway.app/api/v1/health');
    });

    it('should handle localhost URL for health check', () => {
      const url = buildN8nHealthCheckUrl('http://localhost:5678');
      expect(url).toBe('http://localhost:5678/api/v1/health');
    });

    it('should handle trailing slash in base URL', () => {
      const url = buildN8nHealthCheckUrl('https://n8n.railway.app/');
      expect(url).toBe('https://n8n.railway.app/api/v1/health');
    });
  });
});
