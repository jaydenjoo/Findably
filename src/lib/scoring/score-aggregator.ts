/**
 * Score Aggregator Module
 * 종합 점수 산출 및 등급 부여
 * 순수 함수: 부작용 없음
 */

/**
 * 개별 점수 입력
 */
export interface ScoreInput {
  seoScore: number; // 0-100
  geoScore: number; // 0-100
  performanceScore: number; // 0-100
  aiScore: number; // 0-100
}

/**
 * 등급 타입
 */
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * 세부 점수 분해
 */
export interface ScoreBreakdown {
  seo: number;
  geo: number;
  performance: number;
  ai: number;
}

/**
 * 종합 점수 계산 결과
 */
export interface ScoreAggregatorResult {
  overallScore: number; // 0-100, 소수점 1자리
  grade: Grade;
  breakdown: ScoreBreakdown;
}

/**
 * 개별 점수들을 종합 점수로 집계하고 등급을 부여합니다
 *
 * 점수 공식:
 * overallScore = (SEO × 0.35) + (GEO × 0.35) + (성능 × 0.2) + (AI × 0.1)
 *
 * 등급 기준:
 * - A: 85-100점
 * - B: 70-84점
 * - C: 55-69점
 * - D: 40-54점
 * - F: 0-39점
 *
 * @param input - 개별 점수들 (각 0-100)
 * @returns 종합 점수, 등급, 세부 분해 정보
 */
export function aggregateScores(input: ScoreInput): ScoreAggregatorResult {
  // 가중치 적용하여 종합 점수 계산
  const rawScore =
    input.seoScore * 0.35 +
    input.geoScore * 0.35 +
    input.performanceScore * 0.2 +
    input.aiScore * 0.1;

  // 소수점 1자리로 반올림
  const overallScore = Math.round(rawScore * 10) / 10;

  // 등급 부여
  const grade = assignGrade(overallScore);

  // 결과 반환
  return {
    overallScore,
    grade,
    breakdown: {
      seo: input.seoScore,
      geo: input.geoScore,
      performance: input.performanceScore,
      ai: input.aiScore,
    },
  };
}

/**
 * 점수에 따라 등급을 부여합니다
 *
 * @param score - 종합 점수 (0-100)
 * @returns 등급 (A/B/C/D/F)
 */
function assignGrade(score: number): Grade {
  if (score >= 85) {
    return 'A';
  }
  if (score >= 70) {
    return 'B';
  }
  if (score >= 55) {
    return 'C';
  }
  if (score >= 40) {
    return 'D';
  }
  return 'F';
}
