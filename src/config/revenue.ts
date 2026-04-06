/** 업종별 벤치마크 — 매출 영향 환산에 사용 */

export type IndustryId =
  | 'saas'
  | 'ecommerce'
  | 'education'
  | 'healthcare'
  | 'consulting'
  | 'default'

interface IndustryBenchmark {
  label: string
  /** 전환율 (0.032 = 3.2%) */
  conversionRate: number
  /** 평균 객단가 (원) */
  averageOrderValue: number
  /** 기본 월 추정 트래픽 */
  defaultMonthlyTraffic: number
}

const INDUSTRY_BENCHMARKS: Record<IndustryId, IndustryBenchmark> = {
  saas: {
    label: 'SaaS',
    conversionRate: 0.032,
    averageOrderValue: 500_000,
    defaultMonthlyTraffic: 5_000,
  },
  ecommerce: {
    label: '이커머스',
    conversionRate: 0.025,
    averageOrderValue: 80_000,
    defaultMonthlyTraffic: 15_000,
  },
  education: {
    label: '교육',
    conversionRate: 0.04,
    averageOrderValue: 300_000,
    defaultMonthlyTraffic: 8_000,
  },
  healthcare: {
    label: '의료/건강',
    conversionRate: 0.05,
    averageOrderValue: 200_000,
    defaultMonthlyTraffic: 3_000,
  },
  consulting: {
    label: '컨설팅/전문서비스',
    conversionRate: 0.02,
    averageOrderValue: 1_000_000,
    defaultMonthlyTraffic: 2_000,
  },
  default: {
    label: '전체 업종 평균',
    conversionRate: 0.03,
    averageOrderValue: 150_000,
    defaultMonthlyTraffic: 5_000,
  },
} as const

/** severity별 트래픽 영향 비율 */
const SEVERITY_IMPACT_RATE: Record<string, number> = {
  critical: 0.15,
  warning: 0.05,
} as const

/** 원화 환산 결과 */
export interface RevenueImpact {
  /** 월 손실 추정 (만원) */
  monthlyLoss: number
  /** 연간 손실 추정 (만원) */
  annualLoss: number
  /** 개선 시 월 추가 유입 (만원) */
  monthlyGain: number
}

/**
 * 진단 항목의 매출 영향을 원화로 환산
 * @returns severity가 info이면 null (영향도 낮음)
 */
export function calculateRevenueImpact(params: {
  severity: 'critical' | 'warning' | 'info'
  industry?: IndustryId
  monthlyTraffic?: number
}): RevenueImpact | null {
  const { severity, industry = 'default', monthlyTraffic } = params

  const impactRate = SEVERITY_IMPACT_RATE[severity]
  if (impactRate === undefined) return null

  const benchmark = INDUSTRY_BENCHMARKS[industry] ?? INDUSTRY_BENCHMARKS.default
  const traffic = monthlyTraffic ?? benchmark.defaultMonthlyTraffic

  const rawMonthly =
    traffic *
    impactRate *
    benchmark.conversionRate *
    benchmark.averageOrderValue

  // 만원 단위, 1만원~1,000만원 클램핑
  const monthlyLoss = Math.max(
    1,
    Math.min(1000, Math.round(rawMonthly / 10_000))
  )
  const annualLoss = monthlyLoss * 12
  // 개선 시 회복은 손실의 70% 추정 (100% 회복은 비현실적)
  const monthlyGain = Math.round(monthlyLoss * 0.7)

  return { monthlyLoss, annualLoss, monthlyGain }
}

export function getBenchmark(industry?: IndustryId): IndustryBenchmark {
  return (
    INDUSTRY_BENCHMARKS[industry ?? 'default'] ?? INDUSTRY_BENCHMARKS.default
  )
}

export const REVENUE = {
  INDUSTRY_BENCHMARKS,
  calculateRevenueImpact,
  getBenchmark,
} as const

// ─── Phase A: 유료 리포트 매출 누수 재설계 (2026-04-06) ───
//
// 기존 calculateRevenueImpact()는 severity만으로 insight당 고정 금액을 반환해
// 20+ insights 합산 시 5,638만원 같은 월매출 3.4배 과장이 발생. 아래 상수/타입은
// 총 누수 캡 + 8개 영향 카테고리 가중 분배 방식으로 교체하기 위한 기반.
// 사용 로직: src/lib/utils/insight-aggregation.ts의 distributeRevenueLeakage()

/** 소상공인 월 평균 매출 기본값 (원) — KCD 2025 Q4 통계 */
export const BASE_MONTHLY_REVENUE = 16_400_000

/** 누수 상한 비율 — 매출의 20% */
export const LEAKAGE_CAP_RATIO = 0.2

/** 월 누수 상한 (원) = BASE_MONTHLY_REVENUE × LEAKAGE_CAP_RATIO = 3,280,000 */
export const LEAKAGE_CAP = Math.round(BASE_MONTHLY_REVENUE * LEAKAGE_CAP_RATIO)

/** 8개 영향 카테고리 ID */
export type ImpactCategoryId =
  | 'ssl'
  | 'lcp'
  | 'mobile'
  | 'schema'
  | 'internal-links'
  | 'images'
  | 'eeat'
  | 'other'

/**
 * 영향 카테고리별 가중치 (총합 = 1.0)
 * Phase A Step 0 승인 매핑 (2026-04-06)
 */
export const IMPACT_CATEGORY_WEIGHTS: Record<ImpactCategoryId, number> = {
  ssl: 0.15,
  lcp: 0.2,
  mobile: 0.12,
  schema: 0.08,
  'internal-links': 0.06,
  images: 0.08,
  eeat: 0.07,
  other: 0.24,
}

/** 영향 카테고리 한국어 라벨 (UI 표시용) */
export const IMPACT_CATEGORY_LABELS: Record<ImpactCategoryId, string> = {
  ssl: 'SSL 보안',
  lcp: '페이지 속도',
  mobile: '모바일 UX',
  schema: '구조화 데이터',
  'internal-links': '내부 링크',
  images: '이미지',
  eeat: '신뢰 신호 (E-E-A-T)',
  other: '기타',
}

/** 영향 카테고리 분류 우선순위 (다중 매칭 시 앞 항목 우선) */
export const IMPACT_CATEGORY_PRIORITY: readonly ImpactCategoryId[] = [
  'ssl',
  'lcp',
  'mobile',
  'schema',
  'images',
  'internal-links',
  'eeat',
  'other',
] as const
