/**
 * Orchestrator Tests
 * 모든 점수 계산을 조율하고 일관된 진단 결과를 생성하는 Orchestrator 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CrawlResult } from '@/types/crawl';
import {
  runDiagnosisOrchestration,
  type DiagnosisOrchestratorInput,
} from '../orchestrator';
import * as seoScorer from '@/lib/scoring/seo-scorer';
import * as geoScorer from '@/lib/scoring/geo-scorer';
import * as performanceScorer from '@/lib/scoring/performance-scorer';
import * as claudeAnalyzer from '@/lib/ai/claude-analyzer';
import * as scoreAggregator from '@/lib/scoring/score-aggregator';
import * as quickWinEngine from '@/lib/diagnosis/quick-win-engine';

describe('Orchestrator', () => {
  let mockCrawlResult: CrawlResult;

  beforeEach(() => {
    // 모든 모듈 mock 설정
    vi.clearAllMocks();

    // 기본 크롤 결과 설정
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
      robotsTxt: 'User-agent: *\nAllow: /',
      sitemapInfo: { urlCount: 100, lastModified: new Date() },
      links: [],
      images: [],
      detectedCms: null,
      isLatest: true,
    };
  });

  describe('runDiagnosisOrchestration', () => {
    it('should successfully orchestrate all scoring modules', async () => {
      // Mock 반환값 설정
      vi.spyOn(seoScorer, 'calculateSeoScore').mockReturnValue({
        seoScore: 75,
        details: [],
      });
      vi.spyOn(geoScorer, 'calculateGeoScore').mockReturnValue({
        geoScore: 65,
        details: [],
      });
      vi.spyOn(performanceScorer, 'calculatePerformanceScore').mockReturnValue({
        performanceScore: 70,
        details: [],
      });
      vi.spyOn(claudeAnalyzer, 'analyzeContent').mockResolvedValue({
        success: true,
        data: {
          contentQuality: 80,
          keywordDensity: 1.5,
          uniqueness: 85,
          recommendations: ['추천 1', '추천 2'],
          aiScore: 82,
        },
      });
      vi.spyOn(scoreAggregator, 'aggregateScores').mockReturnValue({
        overallScore: 73.5,
        grade: 'B',
        breakdown: {
          seo: 75,
          geo: 65,
          performance: 70,
          ai: 82,
        },
      });
      vi.spyOn(quickWinEngine, 'identifyQuickWins').mockReturnValue([
        {
          title: 'Title 추가',
          description: 'Title을 추가하세요',
          priority: 'high',
          effort: '1시간 이내',
          expectedImpact: '+10점',
        },
      ]);

      const input: DiagnosisOrchestratorInput = {
        crawlResult: mockCrawlResult,
        companyId: 1,
        crawlResultId: 1,
      };

      const result = await runDiagnosisOrchestration(input);

      // 모든 점수가 계산되었는지 확인
      expect(result.success).toBe(true);
      expect(result.data.seoScore).toBe(75);
      expect(result.data.geoScore).toBe(65);
      expect(result.data.performanceScore).toBe(70);
      expect(result.data.aiScore).toBe(82);
      expect(result.data.overallScore).toBe(73.5);
      expect(result.data.grade).toBe('B');
      expect(result.data.quickWins).toHaveLength(1);

      // 모든 모듈이 호출되었는지 확인
      expect(seoScorer.calculateSeoScore).toHaveBeenCalledWith(mockCrawlResult);
      expect(geoScorer.calculateGeoScore).toHaveBeenCalledWith(mockCrawlResult);
      expect(performanceScorer.calculatePerformanceScore).toHaveBeenCalledWith(
        mockCrawlResult
      );
      expect(scoreAggregator.aggregateScores).toHaveBeenCalled();
      expect(quickWinEngine.identifyQuickWins).toHaveBeenCalledWith(mockCrawlResult);
    });

    it('should handle AI analyzer failure gracefully', async () => {
      // Mock 반환값 설정 (AI 실패)
      vi.spyOn(seoScorer, 'calculateSeoScore').mockReturnValue({
        seoScore: 75,
        details: [],
      });
      vi.spyOn(geoScorer, 'calculateGeoScore').mockReturnValue({
        geoScore: 65,
        details: [],
      });
      vi.spyOn(performanceScorer, 'calculatePerformanceScore').mockReturnValue({
        performanceScore: 70,
        details: [],
      });
      vi.spyOn(claudeAnalyzer, 'analyzeContent').mockResolvedValue({
        success: false,
        error: 'API 인증 실패',
        data: {
          aiScore: 0,
          error: 'API 인증 실패',
        },
      });
      vi.spyOn(scoreAggregator, 'aggregateScores').mockReturnValue({
        overallScore: 71.0,
        grade: 'B',
        breakdown: {
          seo: 75,
          geo: 65,
          performance: 70,
          ai: 0,
        },
      });
      vi.spyOn(quickWinEngine, 'identifyQuickWins').mockReturnValue([]);

      const input: DiagnosisOrchestratorInput = {
        crawlResult: mockCrawlResult,
        companyId: 1,
        crawlResultId: 1,
      };

      const result = await runDiagnosisOrchestration(input);

      // AI 점수는 null/0이지만 다른 점수는 유효해야 함
      expect(result.success).toBe(true);
      expect(result.data.seoScore).toBe(75);
      expect(result.data.geoScore).toBe(65);
      expect(result.data.performanceScore).toBe(70);
      expect(result.data.aiScore).toBeNull();
      expect(result.data.aiUnavailable).toBe(true);
      expect(result.data.overallScore).toBe(71.0);
    });

    it('should calculate all scores in parallel', async () => {
      const seoSpyFn = vi
        .spyOn(seoScorer, 'calculateSeoScore')
        .mockReturnValue({
          seoScore: 75,
          details: [],
        });
      const geoSpyFn = vi
        .spyOn(geoScorer, 'calculateGeoScore')
        .mockReturnValue({
          geoScore: 65,
          details: [],
        });
      const perfSpyFn = vi
        .spyOn(performanceScorer, 'calculatePerformanceScore')
        .mockReturnValue({
          performanceScore: 70,
          details: [],
        });

      vi.spyOn(claudeAnalyzer, 'analyzeContent').mockResolvedValue({
        success: true,
        data: {
          contentQuality: 80,
          keywordDensity: 1.5,
          uniqueness: 85,
          recommendations: [],
          aiScore: 82,
        },
      });
      vi.spyOn(scoreAggregator, 'aggregateScores').mockReturnValue({
        overallScore: 73.5,
        grade: 'B',
        breakdown: {
          seo: 75,
          geo: 65,
          performance: 70,
          ai: 82,
        },
      });
      vi.spyOn(quickWinEngine, 'identifyQuickWins').mockReturnValue([]);

      const input: DiagnosisOrchestratorInput = {
        crawlResult: mockCrawlResult,
        companyId: 1,
        crawlResultId: 1,
      };

      await runDiagnosisOrchestration(input);

      // 모든 synchronous 점수가 호출되었는지 확인
      expect(seoSpyFn).toHaveBeenCalled();
      expect(geoSpyFn).toHaveBeenCalled();
      expect(perfSpyFn).toHaveBeenCalled();
    });

    it('should return correct structure with all required fields', async () => {
      vi.spyOn(seoScorer, 'calculateSeoScore').mockReturnValue({
        seoScore: 80,
        details: [],
      });
      vi.spyOn(geoScorer, 'calculateGeoScore').mockReturnValue({
        geoScore: 70,
        details: [],
      });
      vi.spyOn(performanceScorer, 'calculatePerformanceScore').mockReturnValue({
        performanceScore: 75,
        details: [],
      });
      vi.spyOn(claudeAnalyzer, 'analyzeContent').mockResolvedValue({
        success: true,
        data: {
          contentQuality: 85,
          keywordDensity: 2.0,
          uniqueness: 90,
          recommendations: ['추천 1'],
          aiScore: 88,
        },
      });
      vi.spyOn(scoreAggregator, 'aggregateScores').mockReturnValue({
        overallScore: 78.5,
        grade: 'B',
        breakdown: {
          seo: 80,
          geo: 70,
          performance: 75,
          ai: 88,
        },
      });
      vi.spyOn(quickWinEngine, 'identifyQuickWins').mockReturnValue([
        {
          title: 'Quick Win 1',
          description: 'Description',
          priority: 'high',
          effort: '1시간 이내',
          expectedImpact: '+5점',
        },
      ]);

      const input: DiagnosisOrchestratorInput = {
        crawlResult: mockCrawlResult,
        companyId: 1,
        crawlResultId: 1,
      };

      const result = await runDiagnosisOrchestration(input);

      // 반환 구조 검증
      expect(result.success).toBe(true);
      const data = result.data;
      expect(data).toHaveProperty('seoScore');
      expect(data).toHaveProperty('geoScore');
      expect(data).toHaveProperty('performanceScore');
      expect(data).toHaveProperty('aiScore');
      expect(data).toHaveProperty('overallScore');
      expect(data).toHaveProperty('grade');
      expect(data).toHaveProperty('quickWins');
      expect(data).toHaveProperty('aiInsights');
      expect(data).toHaveProperty('aiUnavailable');
      expect(data.quickWins).toBeInstanceOf(Array);
    });

    it('should handle missing performance metrics gracefully', async () => {
      const crawlWithoutMetrics: CrawlResult = {
        ...mockCrawlResult,
        performanceMetrics: undefined,
      };

      vi.spyOn(seoScorer, 'calculateSeoScore').mockReturnValue({
        seoScore: 75,
        details: [],
      });
      vi.spyOn(geoScorer, 'calculateGeoScore').mockReturnValue({
        geoScore: 65,
        details: [],
      });
      vi.spyOn(performanceScorer, 'calculatePerformanceScore').mockReturnValue({
        performanceScore: 0,
        details: [],
      });
      vi.spyOn(claudeAnalyzer, 'analyzeContent').mockResolvedValue({
        success: true,
        data: {
          contentQuality: 80,
          keywordDensity: 1.5,
          uniqueness: 85,
          recommendations: [],
          aiScore: 82,
        },
      });
      vi.spyOn(scoreAggregator, 'aggregateScores').mockReturnValue({
        overallScore: 70.5,
        grade: 'B',
        breakdown: {
          seo: 75,
          geo: 65,
          performance: 0,
          ai: 82,
        },
      });
      vi.spyOn(quickWinEngine, 'identifyQuickWins').mockReturnValue([]);

      const input: DiagnosisOrchestratorInput = {
        crawlResult: crawlWithoutMetrics,
        companyId: 1,
        crawlResultId: 1,
      };

      const result = await runDiagnosisOrchestration(input);

      expect(result.success).toBe(true);
      expect(result.data.performanceScore).toBe(0);
    });

    it('should include ai insights when analysis succeeds', async () => {
      const aiInsights = {
        problems: ['문제 1', '문제 2'],
        recommendations: ['추천 1', '추천 2'],
      };

      vi.spyOn(seoScorer, 'calculateSeoScore').mockReturnValue({
        seoScore: 75,
        details: [],
      });
      vi.spyOn(geoScorer, 'calculateGeoScore').mockReturnValue({
        geoScore: 65,
        details: [],
      });
      vi.spyOn(performanceScorer, 'calculatePerformanceScore').mockReturnValue({
        performanceScore: 70,
        details: [],
      });
      vi.spyOn(claudeAnalyzer, 'analyzeContent').mockResolvedValue({
        success: true,
        data: {
          contentQuality: 80,
          keywordDensity: 1.5,
          uniqueness: 85,
          recommendations: aiInsights.recommendations,
          aiScore: 82,
        },
      });
      vi.spyOn(scoreAggregator, 'aggregateScores').mockReturnValue({
        overallScore: 73.5,
        grade: 'B',
        breakdown: {
          seo: 75,
          geo: 65,
          performance: 70,
          ai: 82,
        },
      });
      vi.spyOn(quickWinEngine, 'identifyQuickWins').mockReturnValue([]);

      const input: DiagnosisOrchestratorInput = {
        crawlResult: mockCrawlResult,
        companyId: 1,
        crawlResultId: 1,
      };

      const result = await runDiagnosisOrchestration(input);

      expect(result.success).toBe(true);
      expect(result.data.aiInsights).toBeDefined();
      expect(result.data.aiInsights?.recommendations).toContain('추천 1');
    });

    it('should format timestamps correctly', async () => {
      vi.spyOn(seoScorer, 'calculateSeoScore').mockReturnValue({
        seoScore: 75,
        details: [],
      });
      vi.spyOn(geoScorer, 'calculateGeoScore').mockReturnValue({
        geoScore: 65,
        details: [],
      });
      vi.spyOn(performanceScorer, 'calculatePerformanceScore').mockReturnValue({
        performanceScore: 70,
        details: [],
      });
      vi.spyOn(claudeAnalyzer, 'analyzeContent').mockResolvedValue({
        success: true,
        data: {
          contentQuality: 80,
          keywordDensity: 1.5,
          uniqueness: 85,
          recommendations: [],
          aiScore: 82,
        },
      });
      vi.spyOn(scoreAggregator, 'aggregateScores').mockReturnValue({
        overallScore: 73.5,
        grade: 'B',
        breakdown: {
          seo: 75,
          geo: 65,
          performance: 70,
          ai: 82,
        },
      });
      vi.spyOn(quickWinEngine, 'identifyQuickWins').mockReturnValue([]);

      const input: DiagnosisOrchestratorInput = {
        crawlResult: mockCrawlResult,
        companyId: 1,
        crawlResultId: 1,
      };

      const result = await runDiagnosisOrchestration(input);

      expect(result.success).toBe(true);
      expect(result.data.diagnosedAt).toBeInstanceOf(Date);
    });
  });
});
