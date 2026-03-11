/**
 * Quick Win Engine Tests
 * Test-driven development: Write tests first, then implement
 */

import { describe, it, expect } from 'vitest';
import { identifyQuickWins } from '../quick-win-engine';
import type { CrawlResult } from '@/types/crawl';

describe('identifyQuickWins', () => {
  // 테스트 헬퍼: 기본 크롤 결과 생성
  const createBaseCrawlResult = (overrides?: Partial<CrawlResult>): CrawlResult => ({
    companyId: 1,
    crawledAt: new Date(),
    status: 'success',
    isLatest: true,
    metaTags: {
      title: '회사명 | 서비스 설명',
      description: '우리 서비스는 최고의 솔루션을 제공합니다.',
    },
    headings: [
      { level: 1, text: 'Welcome' },
      { level: 2, text: 'Features' },
    ],
    links: [
      { href: '/', text: 'Home', isInternal: true },
      { href: '/about', text: 'About', isInternal: true },
    ],
    images: [
      { src: '/img1.png', alt: 'Good image' },
      { src: '/img2.png' },
    ],
    schemaMarkup: [
      {
        type: 'Organization',
        properties: { name: 'Company' },
      },
    ],
    ...overrides,
  });

  describe('기본 동작', () => {
    it('크롤 결과에서 Quick Win 배열을 반환합니다', () => {
      const crawl = createBaseCrawlResult();
      const result = identifyQuickWins(crawl);

      expect(Array.isArray(result)).toBe(true);
    });

    it('반환된 각 Quick Win에는 필수 필드가 있습니다', () => {
      const crawl = createBaseCrawlResult();
      const result = identifyQuickWins(crawl);

      if (result.length > 0) {
        result.forEach((win) => {
          expect(win).toHaveProperty('title');
          expect(win).toHaveProperty('description');
          expect(win).toHaveProperty('priority');
          expect(win).toHaveProperty('effort');
          expect(win).toHaveProperty('expectedImpact');
        });
      }
    });
  });

  describe('Title 태그 누락 감지', () => {
    it('Title 태그가 없으면 Quick Win을 추가합니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { description: 'Desc' },
      });
      const result = identifyQuickWins(crawl);

      expect(result).toContainEqual(
        expect.objectContaining({
          title: 'Title 태그 추가',
          priority: 'high',
        })
      );
    });

    it('Title 태그가 비어있으면 Quick Win을 추가합니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { title: '', description: 'Desc' },
      });
      const result = identifyQuickWins(crawl);

      expect(result).toContainEqual(
        expect.objectContaining({
          title: 'Title 태그 추가',
        })
      );
    });

    it('Title 태그가 있으면 Quick Win을 추가하지 않습니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { title: '회사명 | 설명' },
      });
      const result = identifyQuickWins(crawl);

      expect(result).not.toContainEqual(
        expect.objectContaining({
          title: 'Title 태그 추가',
        })
      );
    });

    it('Title 추천값은 한국어 가이드를 포함합니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { description: undefined },
      });
      const result = identifyQuickWins(crawl);

      const titleWin = result.find((w) => w.title === 'Title 태그 추가');
      expect(titleWin?.description).toContain('키워드');
    });
  });

  describe('Meta Description 누락 감지', () => {
    it('Meta description이 없으면 Quick Win을 추가합니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { title: 'Title' },
      });
      const result = identifyQuickWins(crawl);

      expect(result).toContainEqual(
        expect.objectContaining({
          title: 'Meta Description 추가',
          priority: 'high',
        })
      );
    });

    it('Meta description이 비어있으면 Quick Win을 추가합니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: { title: 'Title', description: '' },
      });
      const result = identifyQuickWins(crawl);

      expect(result).toContainEqual(
        expect.objectContaining({
          title: 'Meta Description 추가',
        })
      );
    });

    it('Meta description이 있으면 Quick Win을 추가하지 않습니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {
          title: 'Title',
          description: '좋은 설명입니다.',
        },
      });
      const result = identifyQuickWins(crawl);

      expect(result).not.toContainEqual(
        expect.objectContaining({
          title: 'Meta Description 추가',
        })
      );
    });
  });

  describe('H1 태그 누락 감지', () => {
    it('H1 태그가 없으면 Quick Win을 추가합니다', () => {
      const crawl = createBaseCrawlResult({
        headings: [
          { level: 2, text: 'Subtitle' },
          { level: 3, text: 'Sub-subtitle' },
        ],
      });
      const result = identifyQuickWins(crawl);

      expect(result).toContainEqual(
        expect.objectContaining({
          title: 'H1 태그 추가',
          priority: 'high',
        })
      );
    });

    it('정확히 1개의 H1 태그가 있으면 Quick Win을 추가하지 않습니다', () => {
      const crawl = createBaseCrawlResult({
        headings: [
          { level: 1, text: 'Main Title' },
          { level: 2, text: 'Subtitle' },
        ],
      });
      const result = identifyQuickWins(crawl);

      expect(result).not.toContainEqual(
        expect.objectContaining({
          title: 'H1 태그 추가',
        })
      );
    });

    it('2개 이상의 H1 태그가 있으면 Quick Win을 추가합니다', () => {
      const crawl = createBaseCrawlResult({
        headings: [
          { level: 1, text: 'Title 1' },
          { level: 1, text: 'Title 2' },
        ],
      });
      const result = identifyQuickWins(crawl);

      expect(result).toContainEqual(
        expect.objectContaining({
          title: 'H1 태그 추가',
        })
      );
    });
  });

  describe('Schema.org 마크업 누락 감지', () => {
    it('Schema 마크업이 없으면 Quick Win을 추가합니다', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [],
      });
      const result = identifyQuickWins(crawl);

      expect(result).toContainEqual(
        expect.objectContaining({
          title: 'Schema.org 마크업 추가',
          priority: 'high',
        })
      );
    });

    it('Schema 마크업이 undefined면 Quick Win을 추가합니다', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: undefined,
      });
      const result = identifyQuickWins(crawl);

      expect(result).toContainEqual(
        expect.objectContaining({
          title: 'Schema.org 마크업 추가',
        })
      );
    });

    it('Schema 마크업이 있으면 Quick Win을 추가하지 않습니다', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [
          {
            type: 'Organization',
            properties: { name: 'Company' },
          },
        ],
      });
      const result = identifyQuickWins(crawl);

      expect(result).not.toContainEqual(
        expect.objectContaining({
          title: 'Schema.org 마크업 추가',
        })
      );
    });

    it('Schema 마크업 추천값은 Organization 기본 예시를 포함합니다', () => {
      const crawl = createBaseCrawlResult({
        schemaMarkup: [],
      });
      const result = identifyQuickWins(crawl);

      const schemaWin = result.find((w) =>
        w.title.includes('Schema.org')
      );
      expect(schemaWin?.description).toContain('Organization');
    });
  });

  describe('이미지 Alt 텍스트 누락 감지', () => {
    it('Alt 텍스트가 없는 이미지가 있으면 Quick Win을 추가합니다', () => {
      const crawl = createBaseCrawlResult({
        images: [
          { src: '/img1.png', alt: 'Good' },
          { src: '/img2.png' }, // alt 없음
        ],
      });
      const result = identifyQuickWins(crawl);

      expect(result).toContainEqual(
        expect.objectContaining({
          title: '이미지 Alt 텍스트 추가',
          priority: 'medium',
        })
      );
    });

    it('모든 이미지에 Alt 텍스트가 있으면 Quick Win을 추가하지 않습니다', () => {
      const crawl = createBaseCrawlResult({
        images: [
          { src: '/img1.png', alt: 'Image 1' },
          { src: '/img2.png', alt: 'Image 2' },
        ],
      });
      const result = identifyQuickWins(crawl);

      expect(result).not.toContainEqual(
        expect.objectContaining({
          title: '이미지 Alt 텍스트 추가',
        })
      );
    });

    it('이미지가 없으면 Alt 텍스트 Quick Win을 추가하지 않습니다', () => {
      const crawl = createBaseCrawlResult({
        images: [],
      });
      const result = identifyQuickWins(crawl);

      expect(result).not.toContainEqual(
        expect.objectContaining({
          title: '이미지 Alt 텍스트 추가',
        })
      );
    });

    it('Alt 텍스트 Quick Win에는 누락된 이미지 수가 포함됩니다', () => {
      const crawl = createBaseCrawlResult({
        images: [
          { src: '/img1.png' },
          { src: '/img2.png' },
          { src: '/img3.png', alt: 'Good' },
        ],
      });
      const result = identifyQuickWins(crawl);

      const altWin = result.find((w) => w.title.includes('Alt 텍스트'));
      expect(altWin?.description).toContain('2');
    });
  });

  describe('Quick Win 속성', () => {
    it('모든 Quick Win의 effort는 "1시간 이내"입니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {},
        headings: [],
        schemaMarkup: [],
        images: [{ src: '/img.png' }],
      });
      const result = identifyQuickWins(crawl);

      result.forEach((win) => {
        expect(win.effort).toBe('1시간 이내');
      });
    });

    it('Quick Win의 priority는 "high" 또는 "medium"입니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {},
        headings: [],
        schemaMarkup: [],
        images: [{ src: '/img.png' }],
      });
      const result = identifyQuickWins(crawl);

      result.forEach((win) => {
        expect(['high', 'medium']).toContain(win.priority);
      });
    });

    it('expectedImpact는 "+5-10점" 또는 "+10-15점" 형식입니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {},
        headings: [],
        schemaMarkup: [],
        images: [{ src: '/img.png' }],
      });
      const result = identifyQuickWins(crawl);

      result.forEach((win) => {
        expect(win.expectedImpact).toMatch(/^\+\d+-\d+점$/);
      });
    });
  });

  describe('정렬 및 우선순위', () => {
    it('높은 영향도와 낮은 난이도가 먼저 오는 순서로 정렬됩니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {}, // Title, Description 없음 → priority: high
        headings: [], // H1 없음 → priority: high
        schemaMarkup: [], // Schema 없음 → priority: high
        images: [{ src: '/img.png' }], // Alt 없음 → priority: medium
      });
      const result = identifyQuickWins(crawl);

      // 높은 우선순위가 먼저 와야 함
      const highPriorityIndices = result
        .map((w, i) => (w.priority === 'high' ? i : -1))
        .filter((i) => i !== -1);
      const mediumPriorityIndices = result
        .map((w, i) => (w.priority === 'medium' ? i : -1))
        .filter((i) => i !== -1);

      if (highPriorityIndices.length > 0 && mediumPriorityIndices.length > 0) {
        expect(Math.max(...highPriorityIndices)).toBeLessThan(
          Math.min(...mediumPriorityIndices)
        );
      }
    });

    it('같은 우선순위 내에서 expectedImpact 순으로 정렬됩니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {}, // 모두 high priority
        headings: [],
        schemaMarkup: [],
        images: [{ src: '/img1.png' }, { src: '/img2.png' }], // Alt 2개 → medium
      });
      const result = identifyQuickWins(crawl);

      // 같은 priority 내에서 영향도 큰 것이 먼저 와야 함
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i].priority === result[i + 1].priority) {
          const impact1 = parseInt(result[i].expectedImpact.split('-')[0].replace('+', ''));
          const impact2 = parseInt(result[i + 1].expectedImpact.split('-')[0].replace('+', ''));
          expect(impact1).toBeGreaterThanOrEqual(impact2);
        }
      }
    });
  });

  describe('엣지 케이스', () => {
    it('모든 필드가 완벽하면 Quick Win이 없습니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {
          title: 'Good Title',
          description: 'Good Description',
        },
        headings: [{ level: 1, text: 'Title' }],
        images: [{ src: '/img.png', alt: 'Good alt' }],
        schemaMarkup: [{ type: 'Organization', properties: {} }],
      });
      const result = identifyQuickWins(crawl);

      expect(result.length).toBe(0);
    });

    it('metaTags가 undefined면 처리합니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: undefined,
      });
      const result = identifyQuickWins(crawl);

      expect(Array.isArray(result)).toBe(true);
    });

    it('headings가 undefined면 처리합니다', () => {
      const crawl = createBaseCrawlResult({
        headings: undefined,
      });
      const result = identifyQuickWins(crawl);

      expect(Array.isArray(result)).toBe(true);
    });

    it('images가 undefined면 처리합니다', () => {
      const crawl = createBaseCrawlResult({
        images: undefined,
      });
      const result = identifyQuickWins(crawl);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('통합 테스트', () => {
    it('복합적인 상황에서 모든 Quick Win을 올바르게 감지합니다', () => {
      const crawl = createBaseCrawlResult({
        metaTags: {}, // Title, Description 모두 없음
        headings: [{ level: 2, text: 'No H1' }], // H1 없음
        images: [
          { src: '/img1.png' }, // Alt 없음
          { src: '/img2.png', alt: 'Good' }, // Alt 있음
        ],
        schemaMarkup: undefined, // Schema 없음
      });
      const result = identifyQuickWins(crawl);

      // 최소 4개의 Quick Win (Title, Description, H1, Schema)
      expect(result.length).toBeGreaterThanOrEqual(4);

      // 예상되는 Quick Win 확인
      const titles = result.map((w) => w.title);
      expect(titles).toContainEqual(expect.stringContaining('Title'));
      expect(titles).toContainEqual(expect.stringContaining('Meta Description'));
      expect(titles).toContainEqual(expect.stringContaining('H1'));
      expect(titles).toContainEqual(expect.stringContaining('Schema'));
    });
  });
});
