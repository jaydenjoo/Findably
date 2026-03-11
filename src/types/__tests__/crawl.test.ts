import { describe, it, expect } from 'vitest';
import type {
  CrawlWebhookRequest,
  MetaTags,
  Heading,
  Link,
  Image,
  SchemaMarkupItem,
  CoreWebVitals,
  PerformanceMetrics,
  SitemapInfo,
  CrawlResult,
  N8nWorkflowResponse,
} from '../crawl';

describe('Crawl Types', () => {
  describe('CrawlWebhookRequest', () => {
    it('should have required fields', () => {
      const request: CrawlWebhookRequest = {
        company_id: 123,
        url: 'https://example.com',
        industry: 'ecommerce',
        company_size: 'small',
      };
      expect(request.company_id).toBe(123);
      expect(request.url).toBe('https://example.com');
      expect(request.industry).toBe('ecommerce');
      expect(request.company_size).toBe('small');
    });

    it('should accept different industries', () => {
      const request: CrawlWebhookRequest = {
        company_id: 1,
        url: 'https://blog.example.com',
        industry: 'blog',
        company_size: 'medium',
      };
      expect(request.industry).toBe('blog');
    });
  });

  describe('MetaTags', () => {
    it('should have optional string fields', () => {
      const tags: MetaTags = {
        title: 'Example Page',
        description: 'This is an example page',
      };
      expect(tags.title).toBe('Example Page');
      expect(tags.description).toBe('This is an example page');
      expect(tags.ogImage).toBeUndefined();
    });

    it('should support all meta tag types', () => {
      const tags: MetaTags = {
        title: 'Page Title',
        description: 'Page description',
        ogTitle: 'OG Title',
        ogDescription: 'OG Description',
        ogImage: 'https://example.com/image.jpg',
        ogType: 'website',
        twitterTitle: 'Twitter Title',
        twitterDescription: 'Twitter Description',
        twitterImage: 'https://example.com/twitter.jpg',
        canonical: 'https://example.com/canonical',
        robots: 'index, follow',
        charset: 'utf-8',
        viewport: 'width=device-width, initial-scale=1',
        keywords: 'example, keywords',
        author: 'John Doe',
      };
      expect(tags.ogType).toBe('website');
      expect(tags.canonical).toBe('https://example.com/canonical');
      expect(tags.viewport).toContain('device-width');
    });
  });

  describe('Heading', () => {
    it('should have level (1-3) and text', () => {
      const h1: Heading = { level: 1, text: 'Main Title' };
      const h2: Heading = { level: 2, text: 'Subtitle' };
      const h3: Heading = { level: 3, text: 'Sub-subtitle' };

      expect(h1.level).toBe(1);
      expect(h2.level).toBe(2);
      expect(h3.level).toBe(3);
    });

    it('should create array of headings', () => {
      const headings: Heading[] = [
        { level: 1, text: 'Main' },
        { level: 2, text: 'Section 1' },
        { level: 2, text: 'Section 2' },
        { level: 3, text: 'Subsection' },
      ];
      expect(headings.length).toBe(4);
      expect(headings[0].level).toBe(1);
      expect(headings[3].level).toBe(3);
    });
  });

  describe('Link', () => {
    it('should classify internal links', () => {
      const link: Link = {
        href: '/about',
        text: 'About Us',
        isInternal: true,
      };
      expect(link.isInternal).toBe(true);
    });

    it('should classify external links', () => {
      const link: Link = {
        href: 'https://external.com',
        text: 'External Site',
        isInternal: false,
      };
      expect(link.isInternal).toBe(false);
    });

    it('should mark broken links', () => {
      const link: Link = {
        href: 'https://example.com/404',
        text: 'Broken Link',
        isInternal: false,
        isBroken: true,
      };
      expect(link.isBroken).toBe(true);
    });
  });

  describe('Image', () => {
    it('should have src and optional alt text', () => {
      const image: Image = {
        src: 'https://example.com/image.jpg',
        alt: 'Descriptive alt text',
        hasWidth: true,
        hasHeight: true,
      };
      expect(image.src).toBe('https://example.com/image.jpg');
      expect(image.alt).toBe('Descriptive alt text');
      expect(image.hasWidth).toBe(true);
    });

    it('should allow missing alt text', () => {
      const image: Image = {
        src: 'https://example.com/image.jpg',
        hasHeight: false,
      };
      expect(image.alt).toBeUndefined();
      expect(image.hasHeight).toBe(false);
    });
  });

  describe('SchemaMarkupItem', () => {
    it('should store schema type and properties', () => {
      const schema: SchemaMarkupItem = {
        type: 'Organization',
        properties: {
          name: 'Example Corp',
          url: 'https://example.com',
          logo: 'https://example.com/logo.png',
        },
      };
      expect(schema.type).toBe('Organization');
      expect(schema.properties.name).toBe('Example Corp');
    });

    it('should support flexible properties', () => {
      const schema: SchemaMarkupItem = {
        type: 'Product',
        properties: {
          name: 'Example Product',
          price: 99.99,
          currency: 'USD',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: 4.5,
            ratingCount: 100,
          },
        },
      };
      expect(schema.properties.price).toBe(99.99);
      expect((schema.properties.aggregateRating as Record<string, unknown>).ratingValue).toBe(4.5);
    });
  });

  describe('CoreWebVitals', () => {
    it('should store performance metrics', () => {
      const cwv: CoreWebVitals = {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        fcp: 1800,
        ttfb: 600,
      };
      expect(cwv.lcp).toBe(2500);
      expect(cwv.cls).toBe(0.1);
    });

    it('should allow optional metrics', () => {
      const cwv: CoreWebVitals = {
        lcp: 2500,
      };
      expect(cwv.lcp).toBe(2500);
      expect(cwv.fid).toBeUndefined();
    });
  });

  describe('PerformanceMetrics', () => {
    it('should include mobile and desktop scores', () => {
      const metrics: PerformanceMetrics = {
        mobile: {
          score: 85,
          cwv: { lcp: 2500, fid: 100, cls: 0.1 },
        },
        desktop: {
          score: 92,
          cwv: { lcp: 1800, fid: 50, cls: 0.05 },
        },
      };
      expect(metrics.mobile.score).toBe(85);
      expect(metrics.desktop.score).toBe(92);
      expect(metrics.mobile.cwv.lcp).toBe(2500);
    });
  });

  describe('SitemapInfo', () => {
    it('should store URL count and last modified', () => {
      const sitemap: SitemapInfo = {
        urlCount: 150,
        lastModified: '2026-03-11T10:30:00Z',
      };
      expect(sitemap.urlCount).toBe(150);
      expect(sitemap.lastModified).toContain('2026-03-11');
    });

    it('should allow missing lastModified', () => {
      const sitemap: SitemapInfo = {
        urlCount: 50,
      };
      expect(sitemap.urlCount).toBe(50);
      expect(sitemap.lastModified).toBeUndefined();
    });
  });

  describe('CrawlResult', () => {
    it('should create valid crawl result', () => {
      const result: CrawlResult = {
        companyId: 1,
        crawledAt: new Date('2026-03-11T11:00:00Z'),
        status: 'success',
        rawHtml: '<html>...</html>',
        metaTags: { title: 'Example' },
        headings: [{ level: 1, text: 'Title' }],
        detectedCms: 'WordPress',
        isLatest: true,
      };
      expect(result.status).toBe('success');
      expect(result.isLatest).toBe(true);
      expect(result.detectedCms).toBe('WordPress');
    });

    it('should support all failure statuses', () => {
      const timeoutResult: CrawlResult = {
        companyId: 1,
        crawledAt: new Date(),
        status: 'failed_timeout',
        isLatest: true,
      };
      expect(timeoutResult.status).toBe('failed_timeout');

      const networkResult: CrawlResult = {
        companyId: 2,
        crawledAt: new Date(),
        status: 'failed_network',
        isLatest: true,
      };
      expect(networkResult.status).toBe('failed_network');

      const invalidUrlResult: CrawlResult = {
        companyId: 3,
        crawledAt: new Date(),
        status: 'failed_invalid_url',
        isLatest: true,
      };
      expect(invalidUrlResult.status).toBe('failed_invalid_url');
    });
  });

  describe('N8nWorkflowResponse', () => {
    it('should return success response with crawl result ID', () => {
      const response: N8nWorkflowResponse = {
        success: true,
        crawlResultId: 42,
        status: 'success',
        metadata: {
          executionTime: 15000,
          htmlLength: 45000,
          schemaCount: 3,
        },
      };
      expect(response.success).toBe(true);
      expect(response.crawlResultId).toBe(42);
      expect(response.metadata?.htmlLength).toBe(45000);
    });

    it('should return error response with error message', () => {
      const response: N8nWorkflowResponse = {
        success: false,
        status: 'failed_timeout',
        errorMessage: 'Crawl operation exceeded 300 second timeout',
        errorCode: 'TIMEOUT_EXCEEDED',
      };
      expect(response.success).toBe(false);
      expect(response.errorMessage).toContain('timeout');
      expect(response.errorCode).toBe('TIMEOUT_EXCEEDED');
    });

    it('should return network error response', () => {
      const response: N8nWorkflowResponse = {
        success: false,
        status: 'failed_network',
        errorMessage: 'Failed to reach https://example.com: ECONNREFUSED',
        errorCode: 'NETWORK_ERROR',
      };
      expect(response.status).toBe('failed_network');
      expect(response.errorMessage).toContain('ECONNREFUSED');
    });
  });
});
