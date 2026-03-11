import { describe, it, expect } from 'vitest';
import {
  sampleCompany,
  sampleCrawlResult,
  sampleDiagnosis,
  sampleActionItems,
  sampleGeneratedAsset,
} from './seed';

describe('Seed Data Exports', () => {
  describe('sampleCompany', () => {
    it('should have valid company structure', () => {
      expect(sampleCompany).toHaveProperty('userId');
      expect(sampleCompany).toHaveProperty('url');
      expect(sampleCompany).toHaveProperty('industry');
      expect(sampleCompany).toHaveProperty('companySize');
    });

    it('should have valid industry enum value', () => {
      expect(['ecommerce', 'blog', 'saas', 'local_business', 'other']).toContain(
        sampleCompany.industry
      );
    });

    it('should have valid company size enum value', () => {
      expect(['solo', 'small', 'medium']).toContain(sampleCompany.companySize);
    });

    it('should have valid URL format', () => {
      expect(sampleCompany.url).toMatch(/^https?:\/\/.+/);
    });

    it('should have userId as non-empty string', () => {
      expect(typeof sampleCompany.userId).toBe('string');
      expect(sampleCompany.userId.length).toBeGreaterThan(0);
    });
  });

  describe('sampleCrawlResult', () => {
    it('should have valid crawl result structure', () => {
      expect(sampleCrawlResult).toHaveProperty('companyId');
      expect(sampleCrawlResult).toHaveProperty('status');
      expect(sampleCrawlResult).toHaveProperty('metaTags');
      expect(sampleCrawlResult).toHaveProperty('headings');
      expect(sampleCrawlResult).toHaveProperty('performanceMetrics');
      expect(sampleCrawlResult).toHaveProperty('robotsTxt');
      expect(sampleCrawlResult).toHaveProperty('sitemapInfo');
      expect(sampleCrawlResult).toHaveProperty('detectedCms');
      expect(sampleCrawlResult).toHaveProperty('isLatest');
    });

    it('should have valid status enum value', () => {
      expect(['success', 'failed_timeout', 'failed_network', 'failed_invalid_url']).toContain(
        sampleCrawlResult.status
      );
    });

    it('should have valid meta tags object', () => {
      expect(typeof sampleCrawlResult.metaTags).toBe('object');
      expect(sampleCrawlResult.metaTags).toHaveProperty('title');
      expect(sampleCrawlResult.metaTags).toHaveProperty('description');
    });

    it('should have valid headings array', () => {
      expect(Array.isArray(sampleCrawlResult.headings)).toBe(true);
      expect(sampleCrawlResult.headings.length).toBeGreaterThan(0);
      sampleCrawlResult.headings.forEach(
        (heading: { level: number; text: string }) => {
          expect(heading).toHaveProperty('level');
          expect(heading).toHaveProperty('text');
          expect([1, 2, 3]).toContain(heading.level);
        }
      );
    });

    it('should have valid performance metrics', () => {
      expect(typeof sampleCrawlResult.performanceMetrics).toBe('object');
      expect(sampleCrawlResult.performanceMetrics).toHaveProperty('mobile');
      expect(sampleCrawlResult.performanceMetrics).toHaveProperty('desktop');
    });

    it('should have isLatest boolean', () => {
      expect(typeof sampleCrawlResult.isLatest).toBe('boolean');
      expect(sampleCrawlResult.isLatest).toBe(true);
    });
  });

  describe('sampleDiagnosis', () => {
    it('should have valid diagnosis structure', () => {
      expect(sampleDiagnosis).toHaveProperty('companyId');
      expect(sampleDiagnosis).toHaveProperty('crawlResultId');
      expect(sampleDiagnosis).toHaveProperty('seoScore');
      expect(sampleDiagnosis).toHaveProperty('geoScore');
      expect(sampleDiagnosis).toHaveProperty('performanceScore');
      expect(sampleDiagnosis).toHaveProperty('aiScore');
      expect(sampleDiagnosis).toHaveProperty('overallScore');
      expect(sampleDiagnosis).toHaveProperty('grade');
      expect(sampleDiagnosis).toHaveProperty('aiInsights');
      expect(sampleDiagnosis).toHaveProperty('isLatest');
    });

    it('should have valid grade enum value', () => {
      expect(['A', 'B', 'C', 'D', 'F']).toContain(sampleDiagnosis.grade);
    });

    it('should have numeric scores', () => {
      expect(typeof sampleDiagnosis.seoScore).toBe('string');
      expect(typeof sampleDiagnosis.geoScore).toBe('string');
      expect(typeof sampleDiagnosis.performanceScore).toBe('string');
      expect(typeof sampleDiagnosis.aiScore).toBe('string');
      expect(typeof sampleDiagnosis.overallScore).toBe('string');
    });

    it('should have valid AI insights', () => {
      expect(typeof sampleDiagnosis.aiInsights).toBe('object');
      expect(sampleDiagnosis.aiInsights).toHaveProperty('problems');
      expect(sampleDiagnosis.aiInsights).toHaveProperty('recommendations');
      expect(Array.isArray(sampleDiagnosis.aiInsights.problems)).toBe(true);
      expect(Array.isArray(sampleDiagnosis.aiInsights.recommendations)).toBe(true);
    });

    it('should have isLatest boolean', () => {
      expect(typeof sampleDiagnosis.isLatest).toBe('boolean');
      expect(sampleDiagnosis.isLatest).toBe(true);
    });
  });

  describe('sampleActionItems', () => {
    it('should be an array', () => {
      expect(Array.isArray(sampleActionItems)).toBe(true);
      expect(sampleActionItems.length).toBeGreaterThan(0);
    });

    it('each action item should have valid structure', () => {
      sampleActionItems.forEach((item) => {
        expect(item).toHaveProperty('companyId');
        expect(item).toHaveProperty('diagnosisId');
        expect(item).toHaveProperty('itemType');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('priority');
        expect(item).toHaveProperty('expectedImpactScore');
        expect(item).toHaveProperty('estimatedEffort');
        expect(item).toHaveProperty('completed');
      });
    });

    it('each action item should have valid enum values', () => {
      sampleActionItems.forEach((item) => {
        expect(['quick_win', 'standard', 'long_term']).toContain(item.itemType);
        expect(['high', 'medium', 'low']).toContain(item.priority);
        expect(['<1h', '1-8h', '>8h']).toContain(item.estimatedEffort);
      });
    });

    it('each action item should have non-empty title and description', () => {
      sampleActionItems.forEach((item) => {
        expect(typeof item.title).toBe('string');
        expect(item.title.length).toBeGreaterThan(0);
        expect(typeof item.description).toBe('string');
        expect(item.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('sampleGeneratedAsset', () => {
    it('should have valid asset structure', () => {
      expect(sampleGeneratedAsset).toHaveProperty('companyId');
      expect(sampleGeneratedAsset).toHaveProperty('diagnosisId');
      expect(sampleGeneratedAsset).toHaveProperty('assetType');
      expect(sampleGeneratedAsset).toHaveProperty('content');
    });

    it('should have valid asset type enum value', () => {
      expect(['schema_markup', 'meta_tags', 'guide']).toContain(
        sampleGeneratedAsset.assetType
      );
    });

    it('should have valid content object', () => {
      expect(typeof sampleGeneratedAsset.content).toBe('object');
      expect(sampleGeneratedAsset.content).not.toBeNull();
    });

    it('schema_markup asset should have JSON-LD structure', () => {
      if (sampleGeneratedAsset.assetType === 'schema_markup') {
        expect(sampleGeneratedAsset.content).toHaveProperty('@context');
        expect(sampleGeneratedAsset.content).toHaveProperty('@type');
      }
    });
  });

  describe('All sample data cross-references', () => {
    it('crawl result should reference a valid company id', () => {
      expect(sampleCrawlResult.companyId).toBe(1);
      expect(typeof sampleCrawlResult.companyId).toBe('number');
    });

    it('diagnosis should reference valid company and crawl result ids', () => {
      expect(sampleDiagnosis.companyId).toBe(1);
      expect(sampleDiagnosis.crawlResultId).toBe(1);
      expect(typeof sampleDiagnosis.companyId).toBe('number');
      expect(typeof sampleDiagnosis.crawlResultId).toBe('number');
    });

    it('action items should reference valid company and diagnosis ids', () => {
      sampleActionItems.forEach((item) => {
        expect(item.companyId).toBe(sampleDiagnosis.companyId);
        expect(item.diagnosisId).toBe(1);
      });
    });

    it('generated asset should reference valid company and diagnosis ids', () => {
      expect(sampleGeneratedAsset.companyId).toBe(sampleDiagnosis.companyId);
      expect(sampleGeneratedAsset.diagnosisId).toBe(1);
    });
  });
});
