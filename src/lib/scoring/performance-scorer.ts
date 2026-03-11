/**
 * Performance Score Calculator Module
 * 계산 규칙: Google PageSpeed 점수(0-100)를 내부 성능 척도(0-100)로 정규화
 * - 모바일과 데스크톱 점수를 가중치로 합산: 모바일 60% + 데스크톱 40%
 * - performanceMetrics가 null이면 중립 패널티로 50점 할당
 * - Core Web Vitals (LCP, FID, CLS) 추출 및 반환
 * - 순수 함수: 부작용 없음
 */

import type { CrawlResult, CoreWebVitals } from '@/types/crawl';

/**
 * Performance 점수 계산 결과
 */
export interface PerformanceScorerResult {
  performanceScore: number; // 0-100 정규화된 점수
  coreWebVitals: {
    mobile: CoreWebVitals;
    desktop: CoreWebVitals;
  };
}

/**
 * 크롤 데이터로부터 Performance 점수를 계산합니다
 *
 * 점수 계산 로직:
 * - performanceMetrics.mobile.score와 performanceMetrics.desktop.score를 가중합
 * - 가중치: 모바일 60% (모바일-퍼스트 접근) + 데스크톱 40%
 * - 최종 점수는 0-100 범위로 정규화
 * - performanceMetrics가 null/undefined면 중립 패널티 50점
 *
 * Core Web Vitals:
 * - LCP (Largest Contentful Paint): 목표 <2.5초
 * - FID (First Input Delay): 목표 <100ms
 * - CLS (Cumulative Layout Shift): 목표 <0.1
 *
 * @param crawl - 크롤링 결과 데이터
 * @returns 성능 점수와 CWV 메트릭
 */
export function calculatePerformanceScore(
  crawl: CrawlResult,
): PerformanceScorerResult {
  // 성능 메트릭이 없으면 중립 패널티 (50점)
  if (!crawl.performanceMetrics) {
    return {
      performanceScore: 50,
      coreWebVitals: {
        mobile: {},
        desktop: {},
      },
    };
  }

  // 가중 평균 계산: 모바일 60% + 데스크톱 40%
  const mobileScore = crawl.performanceMetrics.mobile.score ?? 0;
  const desktopScore = crawl.performanceMetrics.desktop.score ?? 0;

  const performanceScore =
    mobileScore * 0.6 + desktopScore * 0.4;

  // Core Web Vitals 추출
  const coreWebVitals = {
    mobile: crawl.performanceMetrics.mobile.cwv,
    desktop: crawl.performanceMetrics.desktop.cwv,
  };

  return {
    performanceScore,
    coreWebVitals,
  };
}
