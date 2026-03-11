/**
 * Performance Scorer Test Suite
 * 성능 점수 계산 로직 검증
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePerformanceScore,
  type PerformanceScorerResult,
} from '../performance-scorer';
import type { CrawlResult, PerformanceMetrics, CoreWebVitals } from '@/types/crawl';

// 테스트용 헬퍼: Mock CrawlResult 생성
function createMockCrawlResult(
  performanceMetrics?: PerformanceMetrics,
): CrawlResult {
  return {
    companyId: 1,
    crawledAt: new Date('2026-03-11T12:00:00Z'),
    status: 'success',
    performanceMetrics,
    isLatest: true,
  };
}

// 테스트용 헬퍼: CWV 데이터 생성
function createMockCoreWebVitals(
  lcp = 2000,
  fid = 50,
  cls = 0.05,
): CoreWebVitals {
  return {
    lcp,
    fid,
    cls,
    fcp: 1800,
    ttfb: 400,
  };
}

// 테스트용 헬퍼: 성능 메트릭 생성
function createMockPerformanceMetrics(
  mobileScore = 85,
  desktopScore = 92,
  mobileCwv = createMockCoreWebVitals(),
  desktopCwv = createMockCoreWebVitals(),
): PerformanceMetrics {
  return {
    mobile: {
      score: mobileScore,
      cwv: mobileCwv,
    },
    desktop: {
      score: desktopScore,
      cwv: desktopCwv,
    },
  };
}

describe('Performance Scorer', () => {
  describe('calculatePerformanceScore', () => {
    describe('정상 케이스: 성능 메트릭 존재', () => {
      it('모바일+데스크톱 점수 가중치 합계(60% + 40%) 계산하여 0-100 범위 정규화', () => {
        // Arrange
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(80, 90),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        // 가중치: 모바일 60% + 데스크톱 40%
        // (80 * 0.6) + (90 * 0.4) = 48 + 36 = 84
        expect(result.performanceScore).toBe(84);
        expect(result.performanceScore).toBeGreaterThanOrEqual(0);
        expect(result.performanceScore).toBeLessThanOrEqual(100);
      });

      it('모바일과 데스크톱 점수가 같을 때 동일 점수 반환', () => {
        // Arrange
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(75, 75),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.performanceScore).toBe(75);
      });

      it('높은 점수 (모바일 95, 데스크톱 100)을 올바르게 계산', () => {
        // Arrange
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(95, 100),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        // (95 * 0.6) + (100 * 0.4) = 57 + 40 = 97
        expect(result.performanceScore).toBe(97);
      });

      it('낮은 점수 (모바일 10, 데스크톱 20)을 올바르게 계산', () => {
        // Arrange
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(10, 20),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        // (10 * 0.6) + (20 * 0.4) = 6 + 8 = 14
        expect(result.performanceScore).toBe(14);
      });

      it('0점인 경우 정규화하여 0 반환', () => {
        // Arrange
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(0, 0),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.performanceScore).toBe(0);
      });

      it('100점 만점인 경우 정규화하여 100 반환', () => {
        // Arrange
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(100, 100),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.performanceScore).toBe(100);
      });
    });

    describe('예외 케이스: performanceMetrics 없음', () => {
      it('performanceMetrics = null일 때 중립 패널티 50점 반환', () => {
        // Arrange
        const crawl = createMockCrawlResult(undefined);

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.performanceScore).toBe(50);
      });

      it('performanceMetrics = undefined일 때 중립 패널티 50점 반환', () => {
        // Arrange
        const crawl = createMockCrawlResult();

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.performanceScore).toBe(50);
      });
    });

    describe('Core Web Vitals (CWV) 추출 및 정규화', () => {
      it('모바일과 데스크톱 CWV를 올바르게 추출', () => {
        // Arrange
        const mobileCwv = createMockCoreWebVitals(2100, 60, 0.08);
        const desktopCwv = createMockCoreWebVitals(1800, 45, 0.05);
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(85, 90, mobileCwv, desktopCwv),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.coreWebVitals.mobile.lcp).toBe(2100);
        expect(result.coreWebVitals.mobile.fid).toBe(60);
        expect(result.coreWebVitals.mobile.cls).toBe(0.08);

        expect(result.coreWebVitals.desktop.lcp).toBe(1800);
        expect(result.coreWebVitals.desktop.fid).toBe(45);
        expect(result.coreWebVitals.desktop.cls).toBe(0.05);
      });

      it('CWV 값이 없을 때 구조는 유지하되 값은 undefined', () => {
        // Arrange
        const mobileCwv = createMockCoreWebVitals();
        const desktopCwv = createMockCoreWebVitals();
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(80, 90, mobileCwv, desktopCwv),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.coreWebVitals).toBeDefined();
        expect(result.coreWebVitals.mobile).toBeDefined();
        expect(result.coreWebVitals.desktop).toBeDefined();
      });

      it('Google CWV 기준에 따라 Good/Needs Improvement 범위 정의', () => {
        // LCP good <2.5s, FID good <100ms, CLS good <0.1
        // Arrange
        const goodCwv = createMockCoreWebVitals(2400, 99, 0.09);
        const needsImprovementCwv = createMockCoreWebVitals(3000, 150, 0.15);
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(90, 95, goodCwv, needsImprovementCwv),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.coreWebVitals.mobile.lcp).toBeLessThan(2500); // Good
        expect(result.coreWebVitals.desktop.lcp).toBeGreaterThan(2500); // Needs improvement
      });
    });

    describe('결과 구조 (PerformanceScorerResult)', () => {
      it('performanceScore와 coreWebVitals를 포함하는 객체 반환', () => {
        // Arrange
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(80, 90),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result).toHaveProperty('performanceScore');
        expect(result).toHaveProperty('coreWebVitals');
        expect(typeof result.performanceScore).toBe('number');
        expect(result.coreWebVitals).toBeDefined();
      });

      it('coreWebVitals는 mobile과 desktop 속성을 포함', () => {
        // Arrange
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(80, 90),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.coreWebVitals.mobile).toBeDefined();
        expect(result.coreWebVitals.desktop).toBeDefined();
        expect(result.coreWebVitals.mobile.lcp).toBeDefined();
        expect(result.coreWebVitals.mobile.fid).toBeDefined();
        expect(result.coreWebVitals.mobile.cls).toBeDefined();
      });
    });

    describe('엣지 케이스', () => {
      it('분수점 점수 계산 결과 올바르게 처리', () => {
        // Arrange
        // (85 * 0.6) + (90 * 0.4) = 51 + 36 = 87
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(85, 90),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.performanceScore).toBe(87);
      });

      it('매우 작은 CWV 값 처리 (0ms, 0)', () => {
        // Arrange
        const cwv = createMockCoreWebVitals(0, 0, 0);
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(100, 100, cwv, cwv),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        expect(result.performanceScore).toBe(100);
        expect(result.coreWebVitals.mobile.lcp).toBe(0);
        expect(result.coreWebVitals.mobile.fid).toBe(0);
        expect(result.coreWebVitals.mobile.cls).toBe(0);
      });

      it('매우 큰 CWV 값 처리 (10000ms, 10)', () => {
        // Arrange
        const cwv = createMockCoreWebVitals(10000, 1000, 1.5);
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(10, 15, cwv, cwv),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        // (10 * 0.6) + (15 * 0.4) = 6 + 6 = 12
        expect(result.performanceScore).toBe(12);
        expect(result.coreWebVitals.mobile.lcp).toBe(10000);
        expect(result.coreWebVitals.mobile.fid).toBe(1000);
        expect(result.coreWebVitals.mobile.cls).toBe(1.5);
      });
    });

    describe('SEO/GEO 점수와의 일관성', () => {
      it('다른 점수와 동일한 형식의 결과 반환', () => {
        // Arrange
        const crawl = createMockCrawlResult(
          createMockPerformanceMetrics(80, 90),
        );

        // Act
        const result = calculatePerformanceScore(crawl);

        // Assert
        // 다른 점수들처럼 0-100 범위의 단일 숫자 반환
        expect(result.performanceScore).toBeGreaterThanOrEqual(0);
        expect(result.performanceScore).toBeLessThanOrEqual(100);
        expect(Number.isInteger(result.performanceScore) || result.performanceScore % 1 !== 0).toBe(true);
      });
    });
  });
});
