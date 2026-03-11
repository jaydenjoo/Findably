/**
 * Diagnosis Server Action Tests
 * 진단 결과 생성 및 저장 Server Action 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CrawlResult } from '@/types/crawl';
import { runDiagnosis } from '../diagnosis';
import * as orchestrator from '@/lib/diagnosis/orchestrator';
import * as dbClient from '@/lib/db/client';

describe('Diagnosis Server Action', () => {
  let mockCrawlResult: CrawlResult;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCrawlResult = {
      companyId: 1,
      id: 1,
      crawledAt: new Date(),
      status: 'success',
      rawHtml: '<html></html>',
      metaTags: {
        title: 'Test Site',
        description: 'Test Description',
        charset: 'utf-8',
        viewport: 'width=device-width',
      },
      headings: [{ text: 'Main Heading', level: 1 }],
      schemaMarkup: [],
      performanceMetrics: {
        mobileLCP: 2.5,
        desktopLCP: 2.0,
        mobileScore: 80,
        desktopScore: 85,
      },
      robotsTxt: 'User-agent: *\\nAllow: /',
      sitemapInfo: { urlCount: 100, lastModified: new Date() },
      links: [],
      images: [],
      detectedCms: null,
      isLatest: true,
    };
  });

  /**
   * Helper to create a mock database object with proper Drizzle query builder pattern
   */
  function createMockDb(diagnosisRecord: any, actionItemsCount: number = 0) {
    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockCrawlResult]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      insert: vi
        .fn()
        // First call: insert diagnosis
        .mockReturnValueOnce({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([diagnosisRecord]),
          }),
        })
        // Second call: insert action items
        .mockReturnValueOnce({
          values: vi
            .fn()
            .mockReturnValue({
              returning: vi
                .fn()
                .mockResolvedValue(
                  Array(actionItemsCount).fill({ id: 1, completed: false })
                ),
            }),
        }),
    };
  }

  describe('runDiagnosis', () => {
    it('should successfully create a diagnosis record', async () => {
      const diagnosedDate = new Date();

      const mockOrchestrationResult = {
        success: true,
        data: {
          seoScore: 75,
          geoScore: 65,
          performanceScore: 70,
          aiScore: 82,
          overallScore: 73.5,
          grade: 'B' as const,
          quickWins: [],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt: diagnosedDate,
        },
      };

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue(
        mockOrchestrationResult
      );

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt: diagnosedDate,
        seoScore: 75,
        geoScore: 65,
        performanceScore: 70,
        aiScore: 82,
        overallScore: 73.5,
        grade: 'B',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb(diagnosisRecord);
      vi.spyOn(dbClient, 'createServiceDb').mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(10);
      expect(result.data.overallScore).toBe(73.5);
      expect(result.data.grade).toBe('B');
    });

    it('should validate input parameters', async () => {
      // Mock orchestrator just in case validation is bypassed
      vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue({
        success: false,
        data: { error: 'Should not be reached' },
      });

      const result = await runDiagnosis({
        companyId: -1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.data.error).toContain('양수');
    });

    it('should return error when crawl result not found', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      vi.spyOn(dbClient, 'createServiceDb').mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 999,
      });

      expect(result.success).toBe(false);
      expect(result.data.error).toContain('찾을 수 없습니다');
    });

    it('should update is_latest flag for previous diagnoses', async () => {
      const diagnosedDate = new Date();

      const mockOrchestrationResult = {
        success: true,
        data: {
          seoScore: 75,
          geoScore: 65,
          performanceScore: 70,
          aiScore: 82,
          overallScore: 73.5,
          grade: 'B' as const,
          quickWins: [],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt: diagnosedDate,
        },
      };

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue(
        mockOrchestrationResult
      );

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt: diagnosedDate,
        seoScore: 75,
        geoScore: 65,
        performanceScore: 70,
        aiScore: 82,
        overallScore: 73.5,
        grade: 'B',
        aiInsights: null,
        isLatest: true,
      };

      const updateSpy = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockCrawlResult]),
          }),
        }),
        update: updateSpy,
        insert: vi
          .fn()
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([diagnosisRecord]),
            }),
          })
          .mockReturnValueOnce({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
      };

      vi.spyOn(dbClient, 'createServiceDb').mockReturnValue(mockDb as any);

      await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle orchestrator failure', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockCrawlResult]),
          }),
        }),
      };

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue({
        success: false,
        data: {
          error: '진단 계산 실패',
        },
      });

      vi.spyOn(dbClient, 'createServiceDb').mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.data.error).toContain('진단 계산 실패');
    });

    it('should store diagnosis with NULL ai_score when ai fails', async () => {
      const diagnosedDate = new Date();

      const mockOrchestrationResult = {
        success: true,
        data: {
          seoScore: 75,
          geoScore: 65,
          performanceScore: 70,
          aiScore: null,
          overallScore: 71.0,
          grade: 'B' as const,
          quickWins: [],
          aiInsights: null,
          aiUnavailable: true,
          diagnosedAt: diagnosedDate,
        },
      };

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue(
        mockOrchestrationResult
      );

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt: diagnosedDate,
        seoScore: 75,
        geoScore: 65,
        performanceScore: 70,
        aiScore: null,
        overallScore: 71.0,
        grade: 'B',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb(diagnosisRecord);
      vi.spyOn(dbClient, 'createServiceDb').mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.aiScore).toBeNull();
    });

    it('should return complete diagnosis record', async () => {
      const diagnosedDate = new Date();

      const mockOrchestrationResult = {
        success: true,
        data: {
          seoScore: 80,
          geoScore: 70,
          performanceScore: 75,
          aiScore: 88,
          overallScore: 78.5,
          grade: 'B' as const,
          quickWins: [
            {
              title: 'Title 추가',
              description: 'Title을 추가하세요',
              priority: 'high' as const,
              effort: '1시간 이내',
              expectedImpact: '+10점',
            },
          ],
          aiInsights: {
            contentQuality: 80,
            keywordDensity: 1.5,
            uniqueness: 85,
            recommendations: ['추천 1', '추천 2'],
          },
          aiUnavailable: false,
          diagnosedAt: diagnosedDate,
        },
      };

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue(
        mockOrchestrationResult
      );

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt: diagnosedDate,
        seoScore: 80,
        geoScore: 70,
        performanceScore: 75,
        aiScore: 88,
        overallScore: 78.5,
        grade: 'B',
        aiInsights: { recommendations: ['추천 1', '추천 2'] },
        isLatest: true,
      };

      const mockDb = createMockDb(diagnosisRecord, 1);
      vi.spyOn(dbClient, 'createServiceDb').mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(10);
      expect(result.data.seoScore).toBe(80);
      expect(result.data.grade).toBe('B');
      expect(result.data.aiInsights).toBeDefined();
    });

    it('should handle database transaction rollback on error', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockCrawlResult]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(new Error('DB Error')),
          }),
        }),
      };

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue({
        success: true,
        data: {
          seoScore: 75,
          geoScore: 65,
          performanceScore: 70,
          aiScore: 82,
          overallScore: 73.5,
          grade: 'B' as const,
          quickWins: [],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt: new Date(),
        },
      });

      vi.spyOn(dbClient, 'createServiceDb').mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.data.error).toContain('DB Error');
    });

    it('should parse Quick Wins effort correctly', async () => {
      const diagnosedDate = new Date();

      const mockOrchestrationResult = {
        success: true,
        data: {
          seoScore: 80,
          geoScore: 70,
          performanceScore: 75,
          aiScore: 88,
          overallScore: 78.5,
          grade: 'B' as const,
          quickWins: [
            {
              title: 'Meta Tag 추가',
              description: 'Meta Tag를 추가하세요',
              priority: 'high' as const,
              effort: '1시간 이내',
              expectedImpact: '+5점',
            },
            {
              title: 'Schema 구조화',
              description: 'Schema를 추가하세요',
              priority: 'medium' as const,
              effort: '8시간 이상 필요',
              expectedImpact: '+15점',
            },
          ],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt: diagnosedDate,
        },
      };

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue(
        mockOrchestrationResult
      );

      const diagnosisRecord = {
        id: 10,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt: diagnosedDate,
        seoScore: 80,
        geoScore: 70,
        performanceScore: 75,
        aiScore: 88,
        overallScore: 78.5,
        grade: 'B',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb(diagnosisRecord, 2);
      vi.spyOn(dbClient, 'createServiceDb').mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(10);
    });

    it('should handle missing quick wins gracefully', async () => {
      const diagnosedDate = new Date();

      const mockOrchestrationResult = {
        success: true,
        data: {
          seoScore: 70,
          geoScore: 60,
          performanceScore: 65,
          aiScore: 75,
          overallScore: 67.5,
          grade: 'C' as const,
          quickWins: [],
          aiInsights: null,
          aiUnavailable: false,
          diagnosedAt: diagnosedDate,
        },
      };

      vi.spyOn(orchestrator, 'runDiagnosisOrchestration').mockResolvedValue(
        mockOrchestrationResult
      );

      const diagnosisRecord = {
        id: 11,
        companyId: 1,
        crawlResultId: 1,
        diagnosedAt: diagnosedDate,
        seoScore: 70,
        geoScore: 60,
        performanceScore: 65,
        aiScore: 75,
        overallScore: 67.5,
        grade: 'C',
        aiInsights: null,
        isLatest: true,
      };

      const mockDb = createMockDb(diagnosisRecord, 0);
      vi.spyOn(dbClient, 'createServiceDb').mockReturnValue(mockDb as any);

      const result = await runDiagnosis({
        companyId: 1,
        crawlResultId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.overallScore).toBe(67.5);
      expect(result.data.grade).toBe('C');
    });
  });
});
