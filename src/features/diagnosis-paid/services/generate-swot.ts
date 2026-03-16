import type { CategoryScore, OverallScore } from '@/features/diagnosis-free'
import type {
  AIAgentResult,
  AIInsight,
  CompetitorAnalysis,
  SwotAnalysis,
} from '../types'

/** SWOT 각 항목 최대 개수 */
const MAX_ITEMS_PER_CATEGORY = 5

/** 높은 점수 기준 (Strengths에 반영) */
const HIGH_SCORE_THRESHOLD = 70

/** 낮은 점수 기준 (Weaknesses에 반영) */
const LOW_SCORE_THRESHOLD = 40

/** SWOT 생성 입력 파라미터 */
export interface GenerateSwotParams {
  agentResults: AIAgentResult[]
  categoryScores: CategoryScore[]
  overallScore: OverallScore
  /** competitors 에이전트에서 파싱한 SWOT (없으면 null) */
  competitorSwot: SwotAnalysis | null
  /** competitors 에이전트에서 파싱한 경쟁사 분석 결과 */
  competitorAnalyses?: CompetitorAnalysis[]
}

/**
 * 5개 에이전트 결과 + 무료 진단 점수를 종합하여 풍부한 SWOT 분석 생성.
 * Rule-based — 추가 AI API 호출 없음 (비용 0원).
 *
 * 전략:
 * 1. competitors SWOT이 있으면 베이스로 사용
 * 2. 다른 4개 에이전트 인사이트로 보강
 * 3. 카테고리 점수 기반 Strengths/Weaknesses 추가
 * 4. 중복 제거 + 항목 수 제한
 */
export function generateSwotAnalysis(params: GenerateSwotParams): SwotAnalysis {
  const {
    agentResults,
    categoryScores,
    overallScore,
    competitorSwot,
    competitorAnalyses,
  } = params

  const completedResults = agentResults.filter(
    (r) => r.status === 'completed' && r.insights.length > 0
  )

  // 베이스: competitors SWOT이 있으면 사용, 없으면 빈 배열
  const base: SwotAnalysis = competitorSwot
    ? {
        strengths: [...competitorSwot.strengths],
        weaknesses: [...competitorSwot.weaknesses],
        opportunities: [...competitorSwot.opportunities],
        threats: [...competitorSwot.threats],
      }
    : { strengths: [], weaknesses: [], opportunities: [], threats: [] }

  // 보강 1: 카테고리 점수 기반
  enrichFromCategoryScores(base, categoryScores, overallScore)

  // 보강 2: 에이전트 인사이트 기반
  enrichFromInsights(base, completedResults)

  // 보강 3: 경쟁사 갭 분석 기반
  if (competitorAnalyses && competitorAnalyses.length > 0) {
    enrichFromCompetitorGaps(base, competitorAnalyses)
  }

  // 중복 제거 + 항목 수 제한
  return {
    strengths: deduplicateAndLimit(base.strengths),
    weaknesses: deduplicateAndLimit(base.weaknesses),
    opportunities: deduplicateAndLimit(base.opportunities),
    threats: deduplicateAndLimit(base.threats),
  }
}

/**
 * 카테고리 점수 기반 Strengths/Weaknesses 보강
 */
function enrichFromCategoryScores(
  swot: SwotAnalysis,
  categoryScores: CategoryScore[],
  overallScore: OverallScore
): void {
  for (const cat of categoryScores) {
    if (cat.score >= HIGH_SCORE_THRESHOLD) {
      swot.strengths.push(`${cat.name} 영역 우수 (${cat.score}점)`)
    } else if (cat.score < LOW_SCORE_THRESHOLD) {
      swot.weaknesses.push(`${cat.name} 영역 취약 (${cat.score}점)`)
    }
  }

  if (overallScore.score >= HIGH_SCORE_THRESHOLD) {
    swot.strengths.push(
      `종합 마케팅 점수 ${overallScore.score}점 — ${overallScore.gradeLabel} 등급`
    )
  }
}

/**
 * 에이전트 인사이트 기반 SWOT 보강
 */
function enrichFromInsights(
  swot: SwotAnalysis,
  completedResults: AIAgentResult[]
): void {
  for (const result of completedResults) {
    // competitors 에이전트는 이미 competitorSwot으로 반영됨 → 스킵
    if (result.agentId === 'competitors') continue

    for (const insight of result.insights) {
      classifyInsightToSwot(swot, insight, result.agentId)
    }
  }
}

/**
 * 개별 인사이트를 SWOT 항목으로 분류
 */
function classifyInsightToSwot(
  swot: SwotAnalysis,
  insight: AIInsight,
  agentId: string
): void {
  const label = `[${agentId}] ${insight.title}`

  switch (insight.severity) {
    case 'critical':
      // 보안/성능 critical → Threats (즉시 대응 필요)
      // 그 외 critical → Weaknesses
      if (
        insight.category === 'security' ||
        insight.category === 'performance'
      ) {
        swot.threats.push(`${insight.title} — 즉시 대응 필요`)
      } else {
        swot.weaknesses.push(label)
      }
      break

    case 'warning':
      if (insight.actionable) {
        // 실행 가능한 경고 → Opportunities
        swot.opportunities.push(label)
      } else {
        // 실행 어려운 경고 → Weaknesses
        swot.weaknesses.push(label)
      }
      break

    case 'info':
      if (insight.actionable) {
        // 실행 가능한 정보 → Opportunities
        swot.opportunities.push(label)
      } else {
        // 긍정 신호 → Strengths
        swot.strengths.push(label)
      }
      break
  }
}

/**
 * 경쟁사 갭 분석 기반 Threats/Opportunities 보강
 */
function enrichFromCompetitorGaps(
  swot: SwotAnalysis,
  competitorAnalyses: CompetitorAnalysis[]
): void {
  for (const comp of competitorAnalyses) {
    // 경쟁사 강점 → Threats
    for (const strength of comp.strengths) {
      swot.threats.push(`경쟁사(${comp.url}) 강점: ${strength}`)
    }

    // 경쟁사 약점 → Opportunities
    for (const gap of comp.gaps) {
      swot.opportunities.push(`경쟁사 대비 기회: ${gap}`)
    }
  }
}

/**
 * 중복 제거 + 최대 항목 수 제한
 * 유사 문자열: 한쪽이 다른 쪽을 포함하면 긴 쪽만 유지
 */
export function deduplicateAndLimit(items: string[]): string[] {
  const unique: string[] = []

  for (const item of items) {
    const trimmed = item.trim()
    if (!trimmed) continue

    const isDuplicate = unique.some(
      (existing) =>
        existing === trimmed ||
        existing.includes(trimmed) ||
        trimmed.includes(existing)
    )

    if (!isDuplicate) {
      unique.push(trimmed)
    }
  }

  return unique.slice(0, MAX_ITEMS_PER_CATEGORY)
}
