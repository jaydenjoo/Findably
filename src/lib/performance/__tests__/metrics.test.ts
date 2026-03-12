import { describe, it, expect, vi } from 'vitest';
import {
  reportWebVitals,
  PERFORMANCE_CONFIG,
  type WebVitalsMetric,
} from '../metrics';

describe('Performance Metrics', () => {
  describe('reportWebVitals', () => {
    it('should log Core Web Vitals metric', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const metric: WebVitalsMetric = {
        name: 'LCP',
        value: 1200,
        rating: 'good',
        delta: 50,
        id: 'test-lcp',
      };

      reportWebVitals(metric);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('LCP'),
        expect.objectContaining({
          name: 'LCP',
          value: 1200,
          rating: 'good',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should report FCP metric', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const metric: WebVitalsMetric = {
        name: 'FCP',
        value: 1400,
        rating: 'good',
        delta: 0,
        id: 'test-fcp',
      };

      reportWebVitals(metric);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should report CLS metric', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const metric: WebVitalsMetric = {
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        delta: 0,
        id: 'test-cls',
      };

      reportWebVitals(metric);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle poor ratings', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const metric: WebVitalsMetric = {
        name: 'LCP',
        value: 3500,
        rating: 'poor',
        delta: 200,
        id: 'test-poor-lcp',
      };

      reportWebVitals(metric);

      // Poor metrics might be logged as warnings
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('PERFORMANCE_CONFIG', () => {
    it('should define FCP target of 1500ms', () => {
      expect(PERFORMANCE_CONFIG.FCP_TARGET_MS).toBe(1500);
    });

    it('should define TTI target of 3000ms', () => {
      expect(PERFORMANCE_CONFIG.TTI_TARGET_MS).toBe(3000);
    });

    it('should define performance score target of 80', () => {
      expect(PERFORMANCE_CONFIG.PERFORMANCE_SCORE_TARGET).toBe(80);
    });

    it('should define image quality of 80', () => {
      expect(PERFORMANCE_CONFIG.IMAGE_QUALITY).toBe(80);
    });

    it('should define lazy loading as default for images', () => {
      expect(PERFORMANCE_CONFIG.IMAGE_LOADING_DEFAULT).toBe('lazy');
    });

    it('should define cache TTL for images', () => {
      expect(PERFORMANCE_CONFIG.IMAGE_CACHE_TTL_DAYS).toBe(30);
    });
  });

  describe('Web Vitals Integration', () => {
    it('should support metric with all required fields', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const metric: WebVitalsMetric = {
        name: 'FCP',
        value: 1200,
        rating: 'good',
        delta: 100,
        id: 'web-vital-fcp-123',
      };

      expect(() => reportWebVitals(metric)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle different metric types', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const metrics: WebVitalsMetric[] = [
        {
          name: 'LCP',
          value: 1200,
          rating: 'good',
          delta: 0,
          id: 'lcp-1',
        },
        {
          name: 'FID',
          value: 100,
          rating: 'good',
          delta: 0,
          id: 'fid-1',
        },
        {
          name: 'CLS',
          value: 0.05,
          rating: 'good',
          delta: 0,
          id: 'cls-1',
        },
      ];

      metrics.forEach((metric) => {
        reportWebVitals(metric);
      });

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });
  });
});
