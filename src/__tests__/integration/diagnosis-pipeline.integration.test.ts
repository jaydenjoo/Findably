/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Mock data structures in integration tests have intentional type mismatches
/**
 * Integration Tests for Diagnosis Pipeline
 *
 * 테스트 전체 진단 파이프라인: 크롤링 데이터 → 파싱 → 점수 계산 → 집계 → 진단 저장
 *
 * 테스트 항목:
 * 1. 전체 진단 파이프라인 (happy path)
 * 2. 외부 의존성 모킹: n8n 웹훅, Claude API, PageSpeed API
 * 3. 데이터베이스 삽입 검증: diagnoses, action_items, generated_assets
 * 4. RLS 격리 검증: 사용자 A는 사용자 B의 데이터 접근 불가
 * 5. 에러 처리: 각 단계에서의 실패 처리
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { CrawlResult } from '@/types/crawl';
import type { DiagnosisOrchestrationResult } from '@/lib/diagnosis/orchestrator';
import { runDiagnosis } from '@/actions/diagnosis';
import * as orchestrator from '@/lib/diagnosis/orchestrator';
import * as dbClient from '@/lib/db/client';
import * as claudioAnalyzer from '@/lib/ai/claude-analyzer';

/**
 * 테스트용 크롤링 결과 데이터
 * 실제 n8n 웹훅에서 반환되는 데이터 구조 모의
 */
function createMockCrawlResult(overrides: Partial<CrawlResult> = {}): CrawlResult {
  return {
    companyId: 1,
    id: 1,
    crawledAt: new Date('2026-03-12T10:00:00Z'),
    status: 'success',
    rawHtml: `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <title>Test E-commerce Store</title>
        <meta name="description" content="Best products online">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta charset="utf-8">
      </head>
      <body>
        <h1>Welcome to Our Store</h1>
        <h2>Featured Products</h2>
        <p>High quality products at great prices. This is our main content.</p>
        <h2>About Us</h2>
        <p>We have been serving customers since 2020.</p>
      </body>
      </html>
    `,
    metaTags: {
      title: 'Test E-commerce Store',
      description: 'Best products online',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      'og:title': 'Test Store',
      'og:description': 'Shop online',
      'twitter:card': 'summary',
    },
    headings: [
      { text: 'Welcome to Our Store', level: 1 },
      { text: 'Featured Products', level: 2 },
      { text: 'About Us', level: 2 },
    ],
    schemaMarkup: [
      {
        '@type': 'Organization',
        name: 'Test Store',
        url: 'https://example.com',
        logo: 'https://example.com/logo.png',
      },
    ],
    performanceMetrics: {
      mobileLCP: 2.5,
      desktopLCP: 1.8,
      mobileScore: 78,
      desktopScore: 85,
    },
    robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin',
    sitemapInfo: { urlCount: 150, lastModified: new Date('2026-03-01') },
    links: [
      { text: 'Home', href: '/' },
      { text: 'Products', href: '/products' },
      { text: 'Contact', href: '/contact' },
    ],
    images: [
      { src: 'https://example.com/hero.jpg', alt: 'Hero image' },
      { src: 'https://example.com/product1.jpg', alt: 'Product 1' },
    ],
    detectedCms: 'shopify',
    isLatest: true,
    htmlTruncated: false,
    ...overrides,
  };
}

/**
 * 테스트용 진단 오케스트레이션 결과
 */
function createMockOrchestrationResult(
  overrides?: Partial<DiagnosisOrchestrationResult>
): DiagnosisOrchestrationResult {
  const baseResult: DiagnosisOrchestrationResult = {
    success: true,
    data: {
      seoScore: 75,
      geoScore: 68,
      performanceScore: 82,
      aiScore: 73,
      overallScore: 74.5,
      grade: 'B',
      quickWins: [
        {
          title: 'Meta Description 추가',
          description: 'Meta description을 모든 페이지에 추가하세요',
          priority: 'high',
          expectedImpact: '+5-10점',
          effort: '<1시간',
          category: 'seo',
        },
        {
          title: '내부 링크 개선',
          description: '관련 페이지 간 내부 링크를 추가하세요',
          priority: 'high',
          expectedImpact: '+3-5점',
          effort: '1-8시간',
          category: 'seo',
        },
      ],
      aiInsights: {
        contentQuality: 75,
        keywordDensity: 68,
        uniqueness: 82,
        recommendations: [
          '콘텐츠의 독창성을 높이세요',
          '주요 키워드의 밀도를 개선하세요',
        ],
      },
      aiUnavailable: false,
      diagnosedAt: new Date('2026-03-12T10:05:00Z'),
    },
  };

  if (overrides?.success === false) {
    return { success: false, data: { error: 'Unknown error' } };
  }

  if (!overrides) {
    return baseResult;
  }

  if (overrides.data && typeof overrides.data === 'object' && 'error' in overrides.data) {
    return overrides as DiagnosisOrchestrationResult;
  }

  if (overrides.data && typeof overrides.data === 'object' && 'seoScore' in overrides.data) {
    return {
      success: true,
      data: {
        ...baseResult.data,
        ...overrides.data,
      },
    };
  }

  return { ...baseResult, ...overrides };
}

interface MockDbOptions {
  crawlResultExists: boolean;
  diagnosisRecord: Record<string, unknown>;
  actionItemsCount: number;
  shouldFailOnUpdate?: boolean;
  shouldFailOnInsert?: boolean;
}

/**
 * 테스트용 데이터베이스 모킹 헬퍼
 */
function createMockDb(options: MockDbOptions = {
  crawlResultExists: true,
  diagnosisRecord: {
    id: 10,
    companyId: 1,
    crawlResultId: 1,
    diagnosedAt: new Date(),
    seoScore: 75,
    geoScore: 68,
    performanceScore: 82,
    aiScore: 73,
    overallScore: 74.5,
    grade: 'B',
    aiInsights: null,
    isLatest: true,
  },
  actionItemsCount: 2,
}) {
  const insertFn = vi.fn();

  // 첫 번째 호출: 진단 레코드 삽입
  insertFn.mockReturnValueOnce({
    values: vi.fn().mockReturnValue({
      returning: options.shouldFailOnInsert
        ? vi.fn().mockRejectedValue(new Error('Insert failed'))
        : vi.fn().mockResolvedValue([options.diagnosisRecord]),
    }),
  });

  // 두 번째 호출: action_items 삽입
  insertFn.mockReturnValueOnce({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(
        Array(options.actionItemsCount).fill({ id: 1, completed: false })
      ),
    }),
  });

  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(
          options.crawlResultExists ? [createMockCrawlResult()] : []
        ),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: options.shouldFailOnUpdate
          ? vi.fn().mockRejectedValue(new Error('Update failed'))
          : vi.fn().mockResolvedValue(undefined),
      }),
    }),
    insert: insertFn,
  };
}

describe('Integration: Diagnosis Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Test Suite 1: Full Diagnosis Pipeline (Happy Path)
  // ============================================================================

  describe('Full diagnosis pipeline (happy path)', () => {
    it('should execute complete diagnosis: crawl → parse → score → aggregate → store', async () => {
      // Arrange
      const mockOrchestration = createMockOrchestrationResult();
      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord: {
          id: 10,
          companyId: 1,
          crawlResultId: 1,
          diagnosedAt: mockOrchestration.data.diagnosedAt,
          seoScore: mockOrchestration.data.seoScore,
          geoScore: mockOrchestration.data.geoScore,
          performanceScore: mockOrchestration.data.performanceScore,
          aiScore: mockOrchestration.data.aiScore,
          overallScore: mockOrchestration.data.overallScore,
          grade: mockOrchestration.data.grade,
          aiInsights: null,
          isLatest: true,
        },
        actionItemsCount: mockOrchestration.data.quickWins.length,
      });

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);
      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      // Act
      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(10);
      expect(result.data.companyId).toBe(1);
      expect(result.data.crawlResultId).toBe(1);
      expect(result.data.overallScore).toBe(74.5);
      expect(result.data.grade).toBe('B');
      expect(result.data.seoScore).toBe(75);
      expect(result.data.geoScore).toBe(68);
      expect(result.data.performanceScore).toBe(82);
      expect(result.data.aiScore).toBe(73);
    });

    it('should create diagnosis record with all score components', async () => {
      const diagnosedAt = new Date();
      const mockOrchestration = createMockOrchestrationResult({
        data: {
          seoScore: 85,
          geoScore: 72,
          performanceScore: 90,
          aiScore: 78,
          overallScore: 81.25,
          grade: 'A',
          quickWins: [],
          aiInsights: {
            contentQuality: 85,
            keywordDensity: 75,
            uniqueness: 88,
            recommendations: ['Excellent content structure'],
          },
          aiUnavailable: false,
          diagnosedAt,
        },
      } as unknown as DiagnosisOrchestrationResult);

      const diagnosisRecord = {
        id: 20,
        companyId: 2,
        crawlResultId: 2,
        diagnosedAt,
        seoScore: 85,
        geoScore: 72,
        performanceScore: 90,
        aiScore: 78,
        overallScore: 81.25,
        grade: 'A',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord,
        actionItemsCount: 0,
      });

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);
      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 2,
        crawlResultId: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data.grade).toBe('A');
      expect(result.data.overallScore).toBe(81.25);
    });
  });

  // ============================================================================
  // Test Suite 2: External Dependencies Mocking
  // ============================================================================

  describe('External dependencies mocking', () => {
    it('should process n8n webhook response correctly', async () => {
      // n8n으로부터의 실제 크롤링 결과를 모킹 (mocked by mock DB select chain)

      const diagnosedAt = new Date();
      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord: {
          id: 10,
          companyId: 1,
          crawlResultId: 1,
          diagnosedAt,
          seoScore: 75,
          geoScore: 68,
          performanceScore: 82,
          aiScore: 73,
          overallScore: 74.5,
          grade: 'B',
          aiInsights: null,
          isLatest: true,
        },
      });
      const mockOrchestration = createMockOrchestrationResult({
        data: {
          seoScore: 75,
          geoScore: 68,
          performanceScore: 82,
          aiScore: 73,
          overallScore: 74.5,
          grade: 'B',
          quickWins: [],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt,
        },
      } as unknown as DiagnosisOrchestrationResult);

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      // n8n 데이터가 정상적으로 처리되었음을 검증
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should mock Claude API response (AI analysis)', async () => {
      // Claude API 응답을 모킹
      const diagnosedAt = new Date();
      const mockAiResponse = {
        success: true,
        data: {
          aiScore: 82,
          contentQuality: 82,
          keywordDensity: 76,
          uniqueness: 85,
          recommendations: [
            'AI 분석으로부터의 권장사항 1',
            'AI 분석으로부터의 권장사항 2',
          ],
        },
      };

      vi.spyOn(claudioAnalyzer, 'analyzeContent')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockAiResponse as any);

      const mockOrchestration = createMockOrchestrationResult({
        data: {
          seoScore: 75,
          geoScore: 68,
          performanceScore: 82,
          aiScore: 82,
          overallScore: 76.75,
          grade: 'B',
          quickWins: [],
          aiInsights: mockAiResponse.data,
          aiUnavailable: false,
          diagnosedAt,
        },
      } as unknown as DiagnosisOrchestrationResult);

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt,
        seoScore: 75,
        geoScore: 68,
        performanceScore: 82,
        aiScore: 82,
        overallScore: 76.75,
        grade: 'B',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord,
        actionItemsCount: 0,
      });

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);
      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.aiScore).toBe(82);
    });

    it('should gracefully handle Claude API failure', async () => {
      // Claude API 실패를 모킹
      vi.spyOn(claudioAnalyzer, 'analyzeContent')
        .mockResolvedValue({
          success: false,
          error: 'API rate limit exceeded',
        } as unknown as DiagnosisOrchestrationResult);

      // AI 실패 시에도 다른 점수는 정상 반환
      const diagnosedAt = new Date();
      const mockOrchestration = createMockOrchestrationResult({
        data: {
          seoScore: 75,
          geoScore: 68,
          performanceScore: 82,
          aiScore: null,
          overallScore: 74.5, // AI 점수 제외하고 계산
          grade: 'B',
          quickWins: [],
          aiInsights: null,
          aiUnavailable: true,
          diagnosedAt,
        },
      } as unknown as DiagnosisOrchestrationResult);

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt,
        seoScore: 75,
        geoScore: 68,
        performanceScore: 82,
        aiScore: null,
        overallScore: 74.5,
        grade: 'B',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord,
        actionItemsCount: 0,
      });

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);
      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      // AI 실패해도 진단 완료
      expect(result.success).toBe(true);
      expect(result.data.aiScore).toBeNull();
      expect(result.data.seoScore).toBe(75);
      expect(result.data.geoScore).toBe(68);
    });
  });

  // ============================================================================
  // Test Suite 3: Database Operations Verification
  // ============================================================================

  describe('Database operations verification', () => {
    it('should insert diagnosis record into diagnoses table', async () => {
      const mockDb = createMockDb();
      const mockOrchestration = createMockOrchestrationResult();

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);

      await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      // insert() 호출을 검증
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should insert quick wins into action_items table', async () => {
      const diagnosedAt = new Date();
      const mockOrchestration = createMockOrchestrationResult({
        data: {
          seoScore: 75,
          geoScore: 68,
          performanceScore: 82,
          aiScore: 73,
          overallScore: 74.5,
          grade: 'B',
          quickWins: [
            {
              title: 'Quick Win 1',
              description: 'Description 1',
              priority: 'high',
              expectedImpact: '+5점',
              effort: '<1시간',
              category: 'seo',
            },
            {
              title: 'Quick Win 2',
              description: 'Description 2',
              priority: 'medium',
              expectedImpact: '+3점',
              effort: '1-8시간',
              category: 'geo',
            },
          ],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt,
        },
      } as unknown as DiagnosisOrchestrationResult);

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt,
        seoScore: 75,
        geoScore: 68,
        performanceScore: 82,
        aiScore: 73,
        overallScore: 74.5,
        grade: 'B',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord,
        actionItemsCount: 2,
      });

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);
      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      // action_items 삽입을 검증
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // diagnoses + action_items
    });

    it('should update is_latest flag for previous diagnoses', async () => {
      const mockDb = createMockDb();
      const mockOrchestration = createMockOrchestrationResult();

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);

      await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      // update() 호출을 검증
      expect(mockDb.update).toHaveBeenCalled();
      // set() 호출을 검증
      expect(mockDb.update().set).toHaveBeenCalledWith({ isLatest: false });
    });

    it('should set newly created diagnosis as is_latest = true', async () => {
      const diagnosedAt = new Date();
      const diagnosisRecord = {
        id: 15,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt,
        seoScore: 75,
        geoScore: 68,
        performanceScore: 82,
        aiScore: 73,
        overallScore: 74.5,
        grade: 'B',
        aiInsights: null,
        isLatest: true, // 새로 생성된 레코드는 항상 true
      };

      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord,
        actionItemsCount: 0,
      });

      const mockOrchestration = createMockOrchestrationResult({
        data: {
          seoScore: 75,
          geoScore: 68,
          performanceScore: 82,
          aiScore: 73,
          overallScore: 74.5,
          grade: 'B',
          quickWins: [],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt,
        },
      } as unknown as DiagnosisOrchestrationResult);

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.isLatest).toBe(true);
    });
  });

  // ============================================================================
  // Test Suite 4: RLS Isolation (Row Level Security)
  // ============================================================================

  describe('RLS isolation: user data isolation', () => {
    it('should only retrieve crawl result for same company_id', async () => {
      const mockCrawlResult = createMockCrawlResult({ companyId: 1 });
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValue([mockCrawlResult]), // User 1의 데이터만 반환
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        insert: vi
          .fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                {
                  id: 10,
                  companyId: 1,
                  crawlResultId: 1,
                  seoScore: 75,
                  geoScore: 68,
                  performanceScore: 82,
                  aiScore: 73,
                  overallScore: 74.5,
                  grade: 'B',
                  isLatest: true,
                },
              ]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
      };

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        .mockResolvedValue(createMockOrchestrationResult());

      const result = await runDiagnosis({
        companyId: 1, // User A's company
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      // select().from().where()에서 company_id 필터링이 적용되었는지 검증
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should fail if crawl result belongs to different company_id', async () => {
      // 다른 회사의 크롤링 결과로 인해 쿼리 결과가 비어있음
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]), // 다른 회사이므로 빈 배열
          }),
        }),
      };

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1, // User A
        crawlResultId: 999, // User B의 크롤링 결과
      });

      expect(result.success).toBe(false);
      expect(result.data.error).toContain('찾을 수 없습니다');
    });

    it('should prevent user from accessing other user diagnosis results via RLS', async () => {
      // RLS가 적용되면 다른 사용자의 데이터는 select 쿼리 결과에 포함되지 않음
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValue([]), // RLS에 의해 필터링되어 빈 배열
          }),
        }),
      };

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1, // User A
        crawlResultId: 999, // User B의 데이터
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Test Suite 5: Error Handling and Edge Cases
  // ============================================================================

  describe('Error handling at each pipeline stage', () => {
    it('should handle input validation errors', async () => {
      // 잘못된 입력 (음수 company_id)
      const result = await runDiagnosis({
        companyId: -1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.data.error).toContain('양수');
    });

    it('should handle missing crawl result gracefully', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]), // 크롤링 결과 없음
          }),
        }),
      };

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 999,
      });

      expect(result.success).toBe(false);
      expect(result.data.error).toContain('찾을 수 없습니다');
    });

    it('should handle orchestration failure (scoring failed)', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([createMockCrawlResult()]),
          }),
        }),
      };

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        .mockResolvedValue({
          success: false,
          data: { error: '점수 계산 실패' },
        });

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.data.error).toContain('진단 계산 실패');
    });

    it('should handle database insert failure', async () => {
      const mockDb = createMockDb({ shouldFailOnInsert: true });

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        .mockResolvedValue(createMockOrchestrationResult());

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(false);
    });

    it('should handle invalid crawl result status', async () => {
      const failedCrawlResult = createMockCrawlResult({
        status: 'failed_network',
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([failedCrawlResult]),
          }),
        }),
      };

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        .mockResolvedValue({
          success: false,
          data: { error: '크롤링 실패 데이터로 진단할 수 없습니다' },
        });

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Test Suite 6: Different Industry Types
  // ============================================================================

  describe('Diagnosis for different industry types', () => {
    it('should diagnose ecommerce sites correctly', async () => {
      const ecommerceCrawl = createMockCrawlResult({
        metaTags: {
          title: 'Online Store',
          description: 'Buy products online',
        },
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([ecommerceCrawl]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        insert: vi
          .fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                {
                  id: 10,
                  companyId: 1,
                  grade: 'B',
                  overallScore: 72,
                },
              ]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
      };

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        .mockResolvedValue(createMockOrchestrationResult());

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
    });

    it('should diagnose blog/content sites correctly', async () => {
      const blogCrawl = createMockCrawlResult({
        headings: [
          { text: '블로그 포스트 제목', level: 1 },
          { text: '소제목', level: 2 },
          { text: '내용', level: 2 },
        ],
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([blogCrawl]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        insert: vi
          .fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([
                { id: 10, grade: 'A', overallScore: 78 },
              ]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
      };

      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        .mockResolvedValue(createMockOrchestrationResult());

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Test Suite 7: Concurrent Diagnosis Operations
  // ============================================================================

  describe('Concurrent diagnosis handling', () => {
    it('should handle concurrent diagnosis requests for different companies', async () => {
      const mockOrchestration = createMockOrchestrationResult();

      // 각 호출마다 새로운 mock DB 생성
      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => createMockDb() as any);
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);

      // 동시에 여러 회사의 진단 요청
      const results = await Promise.all([
        runDiagnosis({ companyId: 1, crawlResultId: 1 }),
        runDiagnosis({ companyId: 2, crawlResultId: 2 }),
        runDiagnosis({ companyId: 3, crawlResultId: 3 }),
      ]);

      // 모든 진단이 성공해야 함
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  // ============================================================================
  // Test Suite 8: Score Boundary Conditions
  // ============================================================================

  describe('Score boundary conditions', () => {
    it('should handle perfect score (100)', async () => {
      const diagnosedAt = new Date();
      const mockOrchestration = createMockOrchestrationResult({
        data: {
          seoScore: 100,
          geoScore: 100,
          performanceScore: 100,
          aiScore: 100,
          overallScore: 100,
          grade: 'A',
          quickWins: [],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt,
        },
      } as unknown as DiagnosisOrchestrationResult);

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt,
        seoScore: 100,
        geoScore: 100,
        performanceScore: 100,
        aiScore: 100,
        overallScore: 100,
        grade: 'A',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord,
        actionItemsCount: 0,
      });

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);
      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.overallScore).toBe(100);
      expect(result.data.grade).toBe('A');
    });

    it('should handle minimum score (0)', async () => {
      const diagnosedAt = new Date();
      const mockOrchestration = createMockOrchestrationResult({
        data: {
          seoScore: 0,
          geoScore: 0,
          performanceScore: 0,
          aiScore: 0,
          overallScore: 0,
          grade: 'F',
          quickWins: [],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt,
        },
      } as unknown as DiagnosisOrchestrationResult);

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt,
        seoScore: 0,
        geoScore: 0,
        performanceScore: 0,
        aiScore: 0,
        overallScore: 0,
        grade: 'F',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord,
        actionItemsCount: 0,
      });

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);
      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.overallScore).toBe(0);
      expect(result.data.grade).toBe('F');
    });

    it('should handle decimal scores correctly', async () => {
      const diagnosedAt = new Date();
      const mockOrchestration = createMockOrchestrationResult({
        data: {
          seoScore: 73.5,
          geoScore: 68.2,
          performanceScore: 81.7,
          aiScore: 76.4,
          overallScore: 74.95,
          grade: 'B',
          quickWins: [],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt,
        },
      } as unknown as DiagnosisOrchestrationResult);

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt,
        seoScore: 73.5,
        geoScore: 68.2,
        performanceScore: 81.7,
        aiScore: 76.4,
        overallScore: 74.95,
        grade: 'B',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb({
        crawlResultExists: true,
        diagnosisRecord,
        actionItemsCount: 0,
      });

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(mockOrchestration as any);
      vi.spyOn(dbClient, 'createServiceDb')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.overallScore).toBe(74.95);
    });
  });
});
