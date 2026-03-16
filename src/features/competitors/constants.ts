import type { MatrixCategoryId } from './types'

/** 비교할 최대 경쟁사 수 (PRD: 건당 3개사) */
export const MAX_COMPETITORS = 3

/** PageSpeed API 호출 타임아웃 (ms) */
export const PAGESPEED_TIMEOUT_MS = 15_000

/** 매트릭스 카테고리 라벨 */
export const MATRIX_CATEGORY_LABELS: Record<MatrixCategoryId, string> = {
  performance: '성능',
  seo: 'SEO',
  accessibility: '접근성',
  content: '콘텐츠',
  geo: 'GEO/AI',
}

/** 갭 임계값 (점수 차이) */
export const GAP_THRESHOLDS = {
  /** 20점 초과 → critical */
  critical: 20,
  /** 10점 초과 → warning */
  warning: 10,
} as const

/** 경쟁 포지션 판정 기준 (원본 평균 - 경쟁사 평균) */
export const POSITION_THRESHOLDS = {
  /** +10점 이상 → leading */
  leading: 10,
  /** -10점 이하 → lagging */
  lagging: -10,
} as const
