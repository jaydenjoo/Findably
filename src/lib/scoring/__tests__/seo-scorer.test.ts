/**
 * SEO Scorer Tests
 * Test-driven development: Write tests first, then implement
 */

import { describe, it, expect } from 'vitest';
import { calculateSeoScore } from '../seo-scorer';
import type { CrawlResult } from '@/types/crawl';

describe('calculateSeoScore', () => {
  // 테스트 헬퍼: 기본 크롤 결과 생성
  const createBaseCrawlResult = (overrides?: Partial<CrawlResult>): CrawlResult => ({
    companyId: 1,
    crawledAt: new Date(),
    status: 'success',
    isLatest: true,
    metaTags: {},
    headings: [],
    links: [],
    images: [],
    ...overrides,
  });

  describe('제목 태그 (Title tag) — 20점 만점', () => {
    it('제목이 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { title: undefined },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '제목 태그 (Title)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('제목이 빈 문자열이면 0점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { title: '' },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '제목 태그 (Title)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('제목이 최적 길이(50-60자)일 때 20점', () => {
      const title = 'a'.repeat(55); // 50-60자 범위
      const crawl = createBaseCrawlResult({
        metaTags: { title },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '제목 태그 (Title)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('제목이 정확히 50자일 때 20점', () => {
      const title = 'a'.repeat(50);
      const crawl = createBaseCrawlResult({
        metaTags: { title },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '제목 태그 (Title)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('제목이 정확히 60자일 때 20점', () => {
      const title = 'a'.repeat(60);
      const crawl = createBaseCrawlResult({
        metaTags: { title },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '제목 태그 (Title)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('제목이 최적 범위보다 짧으면(49자) 부분점수(10점)', () => {
      const title = 'a'.repeat(49);
      const crawl = createBaseCrawlResult({
        metaTags: { title },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '제목 태그 (Title)',
          points: 10,
          status: 'partial',
        })
      );
    });

    it('제목이 최적 범위보다 길면(61자) 부분점수(10점)', () => {
      const title = 'a'.repeat(61);
      const crawl = createBaseCrawlResult({
        metaTags: { title },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '제목 태그 (Title)',
          points: 10,
          status: 'partial',
        })
      );
    });
  });

  describe('메타 설명 (Meta description) — 20점 만점', () => {
    it('메타 설명이 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { description: undefined },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '메타 설명 (Meta description)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('메타 설명이 빈 문자열이면 0점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { description: '' },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '메타 설명 (Meta description)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('메타 설명이 최적 길이(120-160자)일 때 20점', () => {
      const description = 'a'.repeat(140);
      const crawl = createBaseCrawlResult({
        metaTags: { description },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '메타 설명 (Meta description)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('메타 설명이 정확히 120자일 때 20점', () => {
      const description = 'a'.repeat(120);
      const crawl = createBaseCrawlResult({
        metaTags: { description },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '메타 설명 (Meta description)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('메타 설명이 정확히 160자일 때 20점', () => {
      const description = 'a'.repeat(160);
      const crawl = createBaseCrawlResult({
        metaTags: { description },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '메타 설명 (Meta description)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('메타 설명이 최적 범위보다 짧으면(119자) 부분점수(10점)', () => {
      const description = 'a'.repeat(119);
      const crawl = createBaseCrawlResult({
        metaTags: { description },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '메타 설명 (Meta description)',
          points: 10,
          status: 'partial',
        })
      );
    });

    it('메타 설명이 최적 범위보다 길면(161자) 부분점수(10점)', () => {
      const description = 'a'.repeat(161);
      const crawl = createBaseCrawlResult({
        metaTags: { description },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '메타 설명 (Meta description)',
          points: 10,
          status: 'partial',
        })
      );
    });
  });

  describe('H1 태그 — 15점 만점', () => {
    it('H1이 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        headings: [],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'H1 태그',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('정확히 1개의 H1이 있으면 15점', () => {
      const crawl = createBaseCrawlResult({
        headings: [{ level: 1, text: 'Main Heading' }],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'H1 태그',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('2개 이상의 H1이 있으면 0점', () => {
      const crawl = createBaseCrawlResult({
        headings: [
          { level: 1, text: 'First H1' },
          { level: 1, text: 'Second H1' },
        ],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'H1 태그',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('H2만 있고 H1이 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        headings: [
          { level: 2, text: 'Heading 2' },
          { level: 3, text: 'Heading 3' },
        ],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'H1 태그',
          points: 0,
          status: 'fail',
        })
      );
    });
  });

  describe('모바일 반응형 (Viewport meta tag) — 15점 만점', () => {
    it('viewport 메타 태그가 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { viewport: undefined },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '모바일 반응형 (Viewport)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('viewport 메타 태그가 있으면 15점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { viewport: 'width=device-width, initial-scale=1' },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '모바일 반응형 (Viewport)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('viewport 메타 태그가 빈 문자열이면 0점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { viewport: '' },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '모바일 반응형 (Viewport)',
          points: 0,
          status: 'fail',
        })
      );
    });
  });

  describe('내부 링크 구조 (깊이 ≤ 3) — 15점 만점', () => {
    it('링크가 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        links: [],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('모든 내부 링크의 깊이가 3 이하면 15점', () => {
      const crawl = createBaseCrawlResult({
        links: [
          { href: '/', text: 'Home', isInternal: true },
          { href: '/products', text: 'Products', isInternal: true },
          { href: '/products/category', text: 'Category', isInternal: true },
          { href: '/products/category/item', text: 'Item', isInternal: true },
        ],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('내부 링크 중 일부의 깊이가 3을 초과하면 0점', () => {
      const crawl = createBaseCrawlResult({
        links: [
          { href: '/', text: 'Home', isInternal: true },
          { href: '/products', text: 'Products', isInternal: true },
          { href: '/products/category/item/detail/page', text: 'Deep', isInternal: true }, // 깊이 5
        ],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('외부 링크는 깊이 계산에서 제외', () => {
      const crawl = createBaseCrawlResult({
        links: [
          { href: '/', text: 'Home', isInternal: true },
          { href: '/products', text: 'Products', isInternal: true },
          { href: 'https://external.com/some/deep/path', text: 'External', isInternal: false },
        ],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('루트 경로 / 는 깊이 1', () => {
      const crawl = createBaseCrawlResult({
        links: [{ href: '/', text: 'Home', isInternal: true }],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('경로 /a 는 깊이 1', () => {
      const crawl = createBaseCrawlResult({
        links: [{ href: '/products', text: 'Products', isInternal: true }],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('경로 /a/b 는 깊이 2', () => {
      const crawl = createBaseCrawlResult({
        links: [{ href: '/products/electronics', text: 'Electronics', isInternal: true }],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('경로 /a/b/c 는 깊이 3', () => {
      const crawl = createBaseCrawlResult({
        links: [
          { href: '/products/electronics/phones', text: 'Phones', isInternal: true },
        ],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('경로 /a/b/c/d 는 깊이 4 (초과)', () => {
      const crawl = createBaseCrawlResult({
        links: [
          {
            href: '/products/electronics/phones/details',
            text: 'Details',
            isInternal: true,
          },
        ],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 0,
          status: 'fail',
        })
      );
    });
  });

  describe('사이트맵 (Sitemap) — 10점 만점', () => {
    it('사이트맵이 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        sitemapInfo: undefined,
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '사이트맵',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('사이트맵이 있으면 10점', () => {
      const crawl = createBaseCrawlResult({
        sitemapInfo: { urlCount: 100, lastModified: '2026-03-11' },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '사이트맵',
          points: 10,
          status: 'pass',
        })
      );
    });

    it('사이트맵의 urlCount가 0이면 0점', () => {
      const crawl = createBaseCrawlResult({
        sitemapInfo: { urlCount: 0 },
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '사이트맵',
          points: 0,
          status: 'fail',
        })
      );
    });
  });

  describe('robots.txt — 5점 만점', () => {
    it('robots.txt가 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        robotsTxt: undefined,
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'robots.txt',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('robots.txt가 있으면 5점', () => {
      const crawl = createBaseCrawlResult({
        robotsTxt: 'User-agent: *\nDisallow: /admin',
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'robots.txt',
          points: 5,
          status: 'pass',
        })
      );
    });

    it('robots.txt가 빈 문자열이면 0점', () => {
      const crawl = createBaseCrawlResult({
        robotsTxt: '',
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'robots.txt',
          points: 0,
          status: 'fail',
        })
      );
    });
  });

  describe('종합 점수 계산', () => {
    it('모든 항목이 통과하면 100점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {
          title: 'a'.repeat(55),
          description: 'b'.repeat(140),
          viewport: 'width=device-width, initial-scale=1',
        },
        headings: [{ level: 1, text: 'Main' }],
        links: [
          { href: '/', text: 'Home', isInternal: true },
          { href: '/products', text: 'Products', isInternal: true },
        ],
        sitemapInfo: { urlCount: 50 },
        robotsTxt: 'User-agent: *',
      });
      const result = calculateSeoScore(crawl);
      expect(result.seoScore).toBe(100);
    });

    it('모든 항목이 실패하면 0점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {},
        headings: [],
        links: [],
      });
      const result = calculateSeoScore(crawl);
      expect(result.seoScore).toBe(0);
    });

    it('부분점수 포함 계산 가능', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {
          title: 'a'.repeat(49), // 부분점수 10점
          description: 'b'.repeat(150), // 만점 20점
          viewport: 'width=device-width',
        },
        headings: [{ level: 1, text: 'Main' }], // 만점 15점
        links: [{ href: '/', text: 'Home', isInternal: true }], // 만점 15점
        sitemapInfo: { urlCount: 1 }, // 만점 10점
        robotsTxt: 'User-agent: *', // 만점 5점
      });
      const result = calculateSeoScore(crawl);
      // 10 + 20 + 15 + 15 + 15 + 10 + 5 = 90
      expect(result.seoScore).toBe(90);
    });

    it('부분점수와 실패점수 혼합', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {
          title: 'a'.repeat(30), // 부분점수 10점 (20-49자)
          description: undefined, // 0점
          viewport: 'width=device-width', // 만점 15점
        },
        headings: [{ level: 1, text: 'Main' }], // 만점 15점
        links: [{ href: '/', text: 'Home', isInternal: true }], // 만점 15점
        sitemapInfo: undefined, // 0점
        robotsTxt: undefined, // 0점
      });
      const result = calculateSeoScore(crawl);
      // 10 + 0 + 15 + 15 + 15 + 0 + 0 = 55
      expect(result.seoScore).toBe(55);
    });
  });

  describe('결과 객체 구조', () => {
    it('seoScore와 details 속성 포함', () => {
      const crawl = createBaseCrawlResult();
      const result = calculateSeoScore(crawl);
      expect(result).toHaveProperty('seoScore');
      expect(result).toHaveProperty('details');
      expect(Array.isArray(result.details)).toBe(true);
    });

    it('각 detail 항목이 item, points, status 포함', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { title: 'a'.repeat(55) },
      });
      const result = calculateSeoScore(crawl);
      result.details.forEach((detail) => {
        expect(detail).toHaveProperty('item');
        expect(detail).toHaveProperty('points');
        expect(detail).toHaveProperty('status');
        expect(['pass', 'partial', 'fail']).toContain(detail.status);
        expect(typeof detail.points).toBe('number');
        expect(detail.points).toBeGreaterThanOrEqual(0);
        expect(detail.points).toBeLessThanOrEqual(100);
      });
    });

    it('7개의 세부 항목 반환', () => {
      const crawl = createBaseCrawlResult();
      const result = calculateSeoScore(crawl);
      expect(result.details).toHaveLength(7);
    });

    it('detail 항목들이 올바른 순서로 배열됨', () => {
      const crawl = createBaseCrawlResult();
      const result = calculateSeoScore(crawl);
      const itemNames = result.details.map((d) => d.item);
      expect(itemNames).toEqual([
        '제목 태그 (Title)',
        '메타 설명 (Meta description)',
        'H1 태그',
        '모바일 반응형 (Viewport)',
        '내부 링크 구조 (깊이 ≤3)',
        '사이트맵',
        'robots.txt',
      ]);
    });
  });

  describe('엣지 케이스', () => {
    it('headings가 undefined인 경우 안전 처리', () => {
      const crawl = createBaseCrawlResult({
        headings: undefined,
      });
      const result = calculateSeoScore(crawl);
      expect(result.seoScore).toBeDefined();
      expect(() => calculateSeoScore(crawl)).not.toThrow();
    });

    it('links가 undefined인 경우 안전 처리', () => {
      const crawl = createBaseCrawlResult({
        links: undefined,
      });
      const result = calculateSeoScore(crawl);
      expect(result.seoScore).toBeDefined();
      expect(() => calculateSeoScore(crawl)).not.toThrow();
    });

    it('metaTags가 undefined인 경우 안전 처리', () => {
      const crawl = createBaseCrawlResult({
        metaTags: undefined,
      });
      const result = calculateSeoScore(crawl);
      expect(result.seoScore).toBeDefined();
      expect(() => calculateSeoScore(crawl)).not.toThrow();
    });

    it('제목 길이 계산 시 공백 포함', () => {
      const title = 'Hello World'.repeat(5); // 공백 포함 길이
      const crawl = createBaseCrawlResult({
        metaTags: { title },
      });
      const result = calculateSeoScore(crawl);
      // 실제 길이 확인: "Hello World" = 11글자, 5회 반복 = 55글자
      expect(title.length).toBe(55);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '제목 태그 (Title)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('메타 설명 길이 계산 시 공백 포함', () => {
      const description = 'This is a test description. '.repeat(5); // 공백 포함
      const crawl = createBaseCrawlResult({
        metaTags: { description },
      });
      const result = calculateSeoScore(crawl);
      // 실제 길이 확인: "This is a test description. " = 28글자, 5회 반복 = 140글자
      expect(description.length).toBe(140);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '메타 설명 (Meta description)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('경로에 쿼리 문자열이 있으면 무시하고 깊이 계산', () => {
      const crawl = createBaseCrawlResult({
        links: [
          {
            href: '/products/electronics?color=red&size=large',
            text: 'Products',
            isInternal: true,
          },
        ],
      });
      const result = calculateSeoScore(crawl);
      // /products/electronics = 깊이 2 (pass)
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('경로에 프래그먼트가 있으면 무시하고 깊이 계산', () => {
      const crawl = createBaseCrawlResult({
        links: [
          { href: '/products#section1', text: 'Products', isInternal: true },
        ],
      });
      const result = calculateSeoScore(crawl);
      // /products = 깊이 1 (pass)
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('경로의 마지막이 슬래시(/)로 끝나도 깊이 계산 일관성', () => {
      const crawl = createBaseCrawlResult({
        links: [
          { href: '/products/', text: 'Products', isInternal: true },
          { href: '/products/electronics/', text: 'Electronics', isInternal: true },
        ],
      });
      const result = calculateSeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '내부 링크 구조 (깊이 ≤3)',
          points: 15,
          status: 'pass',
        })
      );
    });
  });
});
