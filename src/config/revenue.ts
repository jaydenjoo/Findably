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
