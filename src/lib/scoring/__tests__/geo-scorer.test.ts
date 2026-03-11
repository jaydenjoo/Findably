/**
 * GEO Scorer Tests
 * Test-driven development: Write tests first, then implement
 */

import { describe, it, expect } from 'vitest';
import { calculateGeoScore } from '../geo-scorer';
import type { CrawlResult } from '@/types/crawl';

describe('calculateGeoScore', () => {
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
    schemaMarkup: [],
    ...overrides,
  });

  describe('종합 점수', () => {
    it('모든 기준을 만족할 때 100점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [
          { type: 'Organization', properties: { name: '회사명' } },
          { type: 'Product', properties: { name: '상품명' } },
          { type: 'FAQPage', properties: { mainEntity: [] } },
        ],
        headings: [
          { level: 1, text: 'a'.repeat(250) }, // 500 chars total
          { level: 2, text: 'b'.repeat(250) },
        ],
        images: [
          { src: 'image1.jpg', alt: '이미지1' },
          { src: 'image2.jpg', alt: '이미지2' },
        ],
        metaTags: {
          author: '저자명',
          title: '제목 | 2026-03-11',
          description: '설명 저자 소개',
        },
      });
      const result = calculateGeoScore(crawl);
      expect(result.geoScore).toBe(100);
    });

    it('기본 요소만 있을 때 합산됨', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [{ type: 'Organization', properties: { name: '회사명' } }],
        headings: [{ level: 1, text: 'a'.repeat(500) }], // 500 chars = pass
        images: [],
        metaTags: {},
      });
      const result = calculateGeoScore(crawl);
      // 마크업 30 + 구조화 데이터 20 + 콘텐츠 길이 15 = 65점
      expect(result.geoScore).toBe(65);
    });
  });

  describe('Schema.org 마크업 존재 (30점) — 최소 1개 유형', () => {
    it('Schema 마크업이 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'Schema.org 마크업 존재 (≥1개)',
          points: 0,
          maxPoints: 30,
          status: 'fail',
        })
      );
    });

    it('Schema이 null/undefined이면 0점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: undefined,
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'Schema.org 마크업 존재 (≥1개)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('1개의 Schema 마크업이 있으면 30점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [{ type: 'Organization', properties: { name: '회사명' } }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'Schema.org 마크업 존재 (≥1개)',
          points: 30,
          status: 'pass',
        })
      );
    });

    it('여러 개의 Schema 마크업이 있으면 30점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [
          { type: 'Organization', properties: { name: '회사명' } },
          { type: 'Product', properties: { name: '상품명' } },
          { type: 'LocalBusiness', properties: { name: '비즈니스명' } },
        ],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'Schema.org 마크업 존재 (≥1개)',
          points: 30,
          status: 'pass',
        })
      );
    });
  });

  describe('구조화된 데이터 (20점) — Product/Organization/LocalBusiness', () => {
    it('특정 유형의 Schema가 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [{ type: 'BlogPosting', properties: { headline: '제목' } }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '구조화된 데이터 (Product/Organization/LocalBusiness)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('Product Schema가 있으면 20점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [{ type: 'Product', properties: { name: '상품명' } }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '구조화된 데이터 (Product/Organization/LocalBusiness)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('Organization Schema가 있으면 20점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [{ type: 'Organization', properties: { name: '회사명' } }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '구조화된 데이터 (Product/Organization/LocalBusiness)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('LocalBusiness Schema가 있으면 20점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [{ type: 'LocalBusiness', properties: { name: '비즈니스명' } }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '구조화된 데이터 (Product/Organization/LocalBusiness)',
          points: 20,
          status: 'pass',
        })
      );
    });

    it('여러 특정 유형이 있어도 20점 (최대값)', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [
          { type: 'Product', properties: { name: '상품1' } },
          { type: 'Organization', properties: { name: '회사명' } },
        ],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '구조화된 데이터 (Product/Organization/LocalBusiness)',
          points: 20,
          status: 'pass',
        })
      );
    });
  });

  describe('FAQ 페이지 Schema (15점)', () => {
    it('FAQPage Schema가 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [{ type: 'Organization', properties: { name: '회사명' } }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'FAQ 페이지 Schema',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('FAQPage Schema가 있으면 15점', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [
          { type: 'FAQPage', properties: { mainEntity: [{ question: 'Q1', acceptedAnswer: 'A1' }] } },
        ],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'FAQ 페이지 Schema',
          points: 15,
          status: 'pass',
        })
      );
    });
  });

  describe('콘텐츠 길이 (15점) — ≥500자', () => {
    it('콘텐츠가 500자 미만이면 0점', () => {
      const crawl = createBaseCrawlResult({
        headings: [{ level: 1, text: '짧은 제목' }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '콘텐츠 길이 (≥500자)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('콘텐츠가 200-499자이면 부분점수(5점)', () => {
      const crawl = createBaseCrawlResult({
        headings: [{ level: 1, text: 'a'.repeat(250) }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '콘텐츠 길이 (≥500자)',
          points: 5,
          status: 'partial',
        })
      );
    });

    it('콘텐츠가 500자 이상이면 15점', () => {
      const crawl = createBaseCrawlResult({
        headings: [
          { level: 1, text: 'a'.repeat(300) },
          { level: 2, text: 'b'.repeat(300) },
        ],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '콘텐츠 길이 (≥500자)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('정확히 500자이면 15점', () => {
      const crawl = createBaseCrawlResult({
        headings: [{ level: 1, text: 'a'.repeat(500) }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '콘텐츠 길이 (≥500자)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('정확히 200자이면 부분점수(5점)', () => {
      const crawl = createBaseCrawlResult({
        headings: [{ level: 1, text: 'a'.repeat(200) }],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '콘텐츠 길이 (≥500자)',
          points: 5,
          status: 'partial',
        })
      );
    });
  });

  describe('이미지 최적화 (15점) — alt 텍스트 + 형식', () => {
    it('이미지가 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        images: [],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '이미지 최적화 (alt 텍스트)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('alt 텍스트가 50% 이상 80% 미만이면 부분점수(8점)', () => {
      const crawl = createBaseCrawlResult({
        images: [
          { src: 'image1.jpg', alt: '이미지1' },
          { src: 'image2.jpg', alt: undefined },
        ],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '이미지 최적화 (alt 텍스트)',
          points: 8,
          status: 'partial',
        })
      );
    });

    it('alt 텍스트가 80% 이상이면 15점', () => {
      const crawl = createBaseCrawlResult({
        images: [
          { src: 'image1.jpg', alt: '이미지1' },
          { src: 'image2.jpg', alt: '이미지2' },
          { src: 'image3.jpg', alt: '이미지3' },
          { src: 'image4.jpg', alt: '이미지4' },
          { src: 'image5.jpg', alt: '이미지5' },
        ],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '이미지 최적화 (alt 텍스트)',
          points: 15,
          status: 'pass',
        })
      );
    });

    it('alt 텍스트가 50% 미만이면 0점', () => {
      const crawl = createBaseCrawlResult({
        images: [
          { src: 'image1.jpg', alt: undefined },
          { src: 'image2.jpg', alt: undefined },
          { src: 'image3.jpg', alt: '이미지3' },
        ],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '이미지 최적화 (alt 텍스트)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('정확히 80%의 이미지가 alt를 가지면 15점', () => {
      const crawl = createBaseCrawlResult({
        images: [
          { src: 'image1.jpg', alt: '이미지1' },
          { src: 'image2.jpg', alt: '이미지2' },
          { src: 'image3.jpg', alt: '이미지3' },
          { src: 'image4.jpg', alt: '이미지4' },
          { src: 'image5.jpg', alt: undefined },
        ],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '이미지 최적화 (alt 텍스트)',
          points: 15,
          status: 'pass',
        })
      );
    });
  });

  describe('E-E-A-T 신호 (5점) — author, publish date, author bio', () => {
    it('E-E-A-T 신호가 없으면 0점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {},
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'E-E-A-T 신호 (저자, 발행일, 저자 소개)',
          points: 0,
          status: 'fail',
        })
      );
    });

    it('author 메타 태그만 있으면 부분점수(2점)', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { author: '저자명' },
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'E-E-A-T 신호 (저자, 발행일, 저자 소개)',
          points: 2,
          status: 'partial',
        })
      );
    });

    it('publish date와 author 메타 태그가 있으면 부분점수(2점)', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {
          author: '저자명',
          title: '제목 | 2026-03-11',
        },
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'E-E-A-T 신호 (저자, 발행일, 저자 소개)',
          points: 2,
          status: 'partial',
        })
      );
    });

    it('모든 E-E-A-T 신호가 있으면 5점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {
          author: '저자명',
          title: '제목 | 2026-03-11',
          description: '설명 저자 소개',
        },
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'E-E-A-T 신호 (저자, 발행일, 저자 소개)',
          points: 5,
          status: 'pass',
        })
      );
    });
  });

  describe('결과 구조', () => {
    it('모든 상세 항목이 7개여야 함', () => {
      const crawl = createBaseCrawlResult();
      const result = calculateGeoScore(crawl);
      expect(result.details).toHaveLength(6);
    });

    it('각 상세 항목은 필요한 필드를 가져야 함', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [{ type: 'Organization', properties: { name: '회사명' } }],
      });
      const result = calculateGeoScore(crawl);
      result.details.forEach((detail) => {
        expect(detail).toHaveProperty('item');
        expect(detail).toHaveProperty('points');
        expect(detail).toHaveProperty('maxPoints');
        expect(detail).toHaveProperty('status');
        expect(['pass', 'partial', 'fail']).toContain(detail.status);
      });
    });

    it('geoScore는 0-100 범위여야 함', () => {
      const crawl = createBaseCrawlResult();
      const result = calculateGeoScore(crawl);
      expect(result.geoScore).toBeGreaterThanOrEqual(0);
      expect(result.geoScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge cases', () => {
    it('empty CrawlResult를 처리함', () => {
      const crawl = createBaseCrawlResult();
      const result = calculateGeoScore(crawl);
      expect(result.geoScore).toBeDefined();
      expect(result.details).toBeDefined();
    });

    it('모든 필드가 undefined인 CrawlResult를 처리함', () => {
      const crawl: CrawlResult = {
        companyId: 1,
        crawledAt: new Date(),
        status: 'success',
        isLatest: true,
      };
      const result = calculateGeoScore(crawl);
      expect(result.geoScore).toBeDefined();
      expect(result.geoScore).toBeGreaterThanOrEqual(0);
    });

    it('images 배열에 빈 alt가 있을 때 처리함', () => {
      const crawl = createBaseCrawlResult({
        images: [
          { src: 'image1.jpg', alt: '' },
          { src: 'image2.jpg', alt: '이미지2' },
        ],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '이미지 최적화 (alt 텍스트)',
          status: 'partial', // 1/2 = 50%, which is 50-80% range
        })
      );
    });

    it('headings 배열이 빈 경우 처리함', () => {
      const crawl = createBaseCrawlResult({
        headings: [],
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: '콘텐츠 길이 (≥500자)',
          status: 'fail',
        })
      );
    });
  });

  describe('publish date detection', () => {
    it('title에서 ISO 날짜 형식을 인식 (YYYY-MM-DD)', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {
          author: '저자명',
          title: '제목 | 2026-03-11',
        },
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'E-E-A-T 신호 (저자, 발행일, 저자 소개)',
          points: 2,
        })
      );
    });

    it('description에서 발행일을 인식하지 못하면 0점', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {
          author: '저자명',
          description: '설명 내용',
        },
      });
      const result = calculateGeoScore(crawl);
      expect(result.details).toContainEqual(
        expect.objectContaining({
          item: 'E-E-A-T 신호 (저자, 발행일, 저자 소개)',
          points: 2,
          status: 'partial',
        })
      );
    });
  });
});
