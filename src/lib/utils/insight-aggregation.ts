/**
 * Insight 집계 유틸리티 — Phase A (2026-04-06)
 *
 * 유료 리포트의 AI insights를 8개 영향 카테고리로 분류하고,
 * 총 누수 캡(매출의 20%) 내에서 가중 분배한다. 지시문:
 * docs/paid-report-audit-v1.md Task 1 + Task 3
 *
 * 왜 필요한가: 기존 calculateRevenueImpact(severity)가 insight마다
 * 고정 금액을 반환해 단순 합산 시 5,638만원 같은 월매출 3.4배 과장이
 * 발생. distributeRevenueLeakage()는 (1) 키워드 기반 카테고리 태깅,
 * (2) 빈 카테고리 제외 후 가중치 재정규화, (3) 대표 insight 선정으로
 * 중복 영향을 자동 보정한다.
 */

import {
  BASE_MONTHLY_REVENUE,
  IMPACT_CATEGORY_LABELS,
  IMPACT_CATEGORY_PRIORITY,
  IMPACT_CATEGORY_WEIGHTS,
  LEAKAGE_CAP,
  LEAKAGE_CAP_RATIO,
  type ImpactCategoryId,
} from '@/config/revenue'
import type { CategoryId } from '@/features/diagnosis-free'
import type { AIInsight } from '@/features/diagnosis-paid'

// ─── 키워드 패턴 (Step 0 승인) ───

/**
 * Insight title/description 키워드 매칭 패턴
 * 대소문자 무시, 한글+영문 혼용 케이스 대응
 */
const KEYWORD_PATTERNS: Record<Exclude<ImpactCategoryId, 'other'>, RegExp> = {
  ssl: /SSL|HTTPS|보안\s*인증|인증서|자물쇠|\bTLS\b/i,
  lcp: /\bLCP\b|페이지\s*속도|로딩\s*속도|PageSpeed|\bTTFB\b|\bFID\b|로딩\s*시간|느립|느려|느린|페이지\s*크기/i,
  mobile: /모바일|터치|viewport|\bINP\b|반응형|스마트폰|작게\s*보이/i,
  schema:
    /Schema|구조화\s*데이터|구조화\s*코드|JSON-?LD|마크업|리치\s*결과|별점/i,
  images: /이미지|\balt\b|대체\s*텍스트|og:image|Open\s*Graph\s*이미지|썸네일/i,
  'internal-links':
    /내부\s*링크|사이트\s*내\s*(페이지\s*)?연결|깨진\s*링크|\b404\b/i,
  eeat: /E-?E-?A-?T|Safe\s*Browsing|보안\s*위협|위험\s*사이트|신뢰도|전문성|권위|Observatory|보안\s*헤더/i,
}

// ─── 타입 ───

/** 분배 결과 — 카테고리 단위 */
export interface LeakageCategory {
  categoryId: ImpactCategoryId
  label: string
  /** 월 누수 금액 (만원 단위, UI 표시용) */
  monthlyLossManwon: number
  /** 원본 가중치 (재정규화 전) */
  weight: number
  /** 카테고리에 속한 insights (중복 포함) */
  insights: AIInsight[]
  /** 카테고리 대표 insight (최대 3개) */
  representatives: AIInsight[]
  /**
   * 영향 범위 — 해당 카테고리 insights의 원본 CategoryId 집합
   * 지시문 Task 3: "영향 범위: SEO, GEO, Technical" 복수 태그
   */
  affectedCategories: CategoryId[]
}

/** 분배 결과 — 전체 */
export interface LeakageDistribution {
  /** 카테고리별 결과 (금액 있는 것만, 내림차순 정렬) */
  byCategory: LeakageCategory[]
  /** 총 월 누수 (만원) — 항상 LEAKAGE_CAP / 10000 이하 */
  totalMonthlyManwon: number
  /** 총 연간 누수 (만원) */
  totalAnnualManwon: number
  /** 기준 월 매출 (원) — 문구 병기용 */
  baseMonthlyRevenue: number
  /** 매출 대비 누수 비율 (0~LEAKAGE_CAP_RATIO) */
  leakageRatio: number
  /** 중복 보정 안내 문구 (지시문 Task 1-4) */
  note: string
  /** 키워드 매칭 실패 비율 (dev 모니터링용, 0~1) */
  otherRatio: number
}

// ─── 분류 ───

/**
 * 단일 insight를 8개 영향 카테고리 중 하나로 분류
 * 매칭 순서: IMPACT_CATEGORY_PRIORITY 순회 → 첫 매칭 → fallback 'other'
 */
export function classifyInsight(
  insight: Pick<AIInsight, 'title' | 'description'>
): ImpactCategoryId {
  const haystack = `${insight.title ?? ''} ${insight.description ?? ''}`
  if (!haystack.trim()) return 'other'

  for (const categoryId of IMPACT_CATEGORY_PRIORITY) {
    if (categoryId === 'other') continue
    const pattern = KEYWORD_PATTERNS[categoryId]
    if (pattern.test(haystack)) return categoryId
  }
  return 'other'
}

// ─── 분배 ───

const MANWON = 10_000
const MAX_REPRESENTATIVES_PER_CATEGORY = 3

interface DistributeOptions {
  /** 기준 월 매출 (원) — 기본 BASE_MONTHLY_REVENUE */
  baseMonthlyRevenue?: number
}

/**
 * insights 배열 → 가중 분배된 월 누수 맵
 *
 * 알고리즘:
 * 1. 각 insight를 classifyInsight()로 8개 중 하나에 태깅
 * 2. insights가 1개 이상 있는 카테고리만 활성화
 * 3. 활성 카테고리 가중치 합 presentWeightSum 계산
 * 4. 각 활성 카테고리 금액 = cap × (weight / presentWeightSum)
 *    → 총합이 항상 cap 이하로 유지 (일부 카테고리만 활성 시 캡 미만)
 *    → 모든 카테고리 활성 시 presentWeightSum = 1.0, 총합 = cap
 * 5. 카테고리 내부 대표 insights 최대 3개 (priority DESC → severity DESC 순)
 * 6. affectedCategories는 insights의 원본 CategoryId 집합
 *
 * 입력이 비면 빈 분배 반환 (지연 표시 방지).
 */
export function distributeRevenueLeakage(
  insights: readonly AIInsight[],
  options: DistributeOptions = {}
): LeakageDistribution {
  const baseMonthlyRevenue = options.baseMonthlyRevenue ?? BASE_MONTHLY_REVENUE
  const cap = Math.round(baseMonthlyRevenue * LEAKAGE_CAP_RATIO)

  if (insights.length === 0) {
    return {
      byCategory: [],
      totalMonthlyManwon: 0,
      totalAnnualManwon: 0,
      baseMonthlyRevenue,
      leakageRatio: 0,
      note: NOTE_TEXT,
      otherRatio: 0,
    }
  }

  // 1. 카테고리별 insight 그룹핑 (immutable — 새 객체 누적)
  const grouped = new Map<ImpactCategoryId, AIInsight[]>()
  let otherCount = 0
  for (const insight of insights) {
    const categoryId = classifyInsight(insight)
    if (categoryId === 'other') otherCount += 1
    const existing = grouped.get(categoryId) ?? []
    grouped.set(categoryId, [...existing, insight])
  }

  // 2. 활성 카테고리 + 가중치 합
  const activeCategories = Array.from(grouped.keys())
  const presentWeightSum = activeCategories.reduce(
    (sum, id) => sum + IMPACT_CATEGORY_WEIGHTS[id],
    0
  )

  if (presentWeightSum === 0) {
    // defensive — 위 로직상 도달 불가
    return {
      byCategory: [],
      totalMonthlyManwon: 0,
      totalAnnualManwon: 0,
      baseMonthlyRevenue,
      leakageRatio: 0,
      note: NOTE_TEXT,
      otherRatio: 0,
    }
  }

  // 3. 카테고리별 금액 + 대표 + affected categories
  const byCategory: LeakageCategory[] = activeCategories.map((categoryId) => {
    const weight = IMPACT_CATEGORY_WEIGHTS[categoryId]
    const categoryInsights = grouped.get(categoryId) ?? []

    // 금액 (원 → 만원 반올림, 최소 1만원)
    const amountWon = cap * (weight / presentWeightSum)
    const monthlyLossManwon = Math.max(1, Math.round(amountWon / MANWON))

    // 대표 insights (severity 우선: critical > warning > info)
    const representatives = [...categoryInsights]
      .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
      .slice(0, MAX_REPRESENTATIVES_PER_CATEGORY)

    // 영향 범위 — 원본 CategoryId 집합
    const affectedCategories = Array.from(
      new Set(categoryInsights.map((i) => i.category).filter(isCategoryId))
    )

    return {
      categoryId,
      label: IMPACT_CATEGORY_LABELS[categoryId],
      monthlyLossManwon,
      weight,
      insights: categoryInsights,
      representatives,
      affectedCategories,
    }
  })

  // 4. 금액 내림차순 정렬 (큰 누수가 위)
  const sortedByAmount = [...byCategory].sort(
    (a, b) => b.monthlyLossManwon - a.monthlyLossManwon
  )

  // 5. 총합 계산 (카테고리 금액 합 — 반올림 오차로 cap을 1~2만원 초과 가능)
  const totalMonthlyManwon = sortedByAmount.reduce(
    (sum, cat) => sum + cat.monthlyLossManwon,
    0
  )

  const totalAnnualManwon = totalMonthlyManwon * 12
  const leakageRatio =
    baseMonthlyRevenue > 0
      ? (totalMonthlyManwon * MANWON) / baseMonthlyRevenue
      : 0

  const otherRatio = insights.length > 0 ? otherCount / insights.length : 0

  return {
    byCategory: sortedByAmount,
    totalMonthlyManwon,
    totalAnnualManwon,
    baseMonthlyRevenue,
    leakageRatio,
    note: NOTE_TEXT,
    otherRatio,
  }
}

// ─── 중복 통합 (Task 3) ───

/**
 * insights를 영향 카테고리별로 dedupe하여 대표 insight만 반환
 * 사용처: AIInsightsSection, PdfInsights의 카드 리스트
 *
 * - 각 카테고리에서 최대 3개 대표 (severity 우선)
 * - 결과 배열의 insight 순서는 카테고리 금액 내림차순 → 카테고리 내 severity 순
 */
export function dedupeInsightsByImpactCategory(
  insights: readonly AIInsight[]
): AIInsight[] {
  if (insights.length === 0) return []
  const distribution = distributeRevenueLeakage(insights)
  return distribution.byCategory.flatMap((cat) => cat.representatives)
}

// ─── 내부 헬퍼 ───

const SEVERITY_RANK: Record<AIInsight['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

function severityRank(severity: AIInsight['severity']): number {
  return SEVERITY_RANK[severity] ?? 3
}

const VALID_CATEGORY_IDS: readonly CategoryId[] = [
  'technical',
  'content',
  'social-ai',
  'performance',
  'security',
  'mobile',
  'geo',
] as const

function isCategoryId(value: unknown): value is CategoryId {
  return (
    typeof value === 'string' &&
    (VALID_CATEGORY_IDS as readonly string[]).includes(value)
  )
}

/** 지시문 Task 1-4: 중복 영향 보정 안내 문구 */
const NOTE_TEXT =
  '각 항목의 추정 영향은 독립적으로 합산되지 않습니다. 여러 문제가 동일한 사용자 이탈에 기여하므로, 총 누수 추정치는 개별 합산이 아닌 보정된 총합입니다.'

// ─── 외부 재노출 (편의) ───

export {
  BASE_MONTHLY_REVENUE,
  LEAKAGE_CAP,
  LEAKAGE_CAP_RATIO,
  IMPACT_CATEGORY_WEIGHTS,
  IMPACT_CATEGORY_LABELS,
  type ImpactCategoryId,
}
