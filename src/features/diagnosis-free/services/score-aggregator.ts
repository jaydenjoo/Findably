import { SCORING } from '@/config/scoring'
import type { MacroScoreId } from '@/config/scoring'
import type {
  OverallScore,
  AggregatedScores,
  MacroScore,
  ReportReliability,
  AICitationPossibilityScore,
  CategoryId,
} from '../types'

// ─── 5-Score 집계: 7개 카테고리 → 5개 매크로 점수 ───

/** aggregateScores 입력 파라미터 */
interface AggregateScoresParams {
  /** 67개 룰 기반 종합 점수 (7개 카테고리 포함) */
  overallScore: OverallScore
  /** AI 인용 가능성 점수 (null = AI 데이터 없음) */
  aiCitation: AICitationPossibilityScore | null
  /** 데이터 완성도 (0-100) — n8n v2 콜백에서 전달 */
  dataCompleteness: number
}

/**
 * 7개 카테고리 점수를 5개 매크로 점수로 집계
 *
 * 매핑:
 * - SEO: technical + content + mobile
 * - GEO: geo + social-ai
 * - Performance: performance
 * - Security: security
 * - AI: AI 인용 가능성 점수 (없으면 제외 + 가중치 재분배)
 *
 * 가중치:
 * - AI 있을 때: SEO(20%) + GEO(25%) + Performance(20%) + AI(25%) + Security(10%)
 * - AI 없을 때: SEO(25%) + GEO(30%) + Performance(25%) + Security(20%)
 */
export function aggregateScores(
  params: AggregateScoresParams
): AggregatedScores {
  const { overallScore, aiCitation, dataCompleteness } = params

  const hasAIData = aiCitation !== null

  // 1. 카테고리 → 매크로 점수 매핑
  const macroScoreMap = buildMacroScoreMap(overallScore, aiCitation)

  // 2. 매크로 점수 배열 생성
  const macroScores = buildMacroScoreArray(macroScoreMap, hasAIData)

  // 3. 가중 합산 종합 점수
  const totalScore = calculateWeightedTotal(macroScoreMap, hasAIData)

  // 4. 등급 산출
  const totalGrade = SCORING.getScoreGrade(totalScore)
  const totalGradeLabel = SCORING.getScoreLabel(totalScore)

  // 5. 리포트 신뢰도
  const reportReliability = deriveReportReliability(dataCompleteness)

  return {
    macroScores,
    totalScore,
    totalGrade,
    totalGradeLabel,
    hasAIData,
    dataCompleteness,
    reportReliability,
  }
}

// ─── 내부 함수 ───

/** 카테고리 점수를 매크로 점수 ID별로 그룹핑 + 평균 */
function buildMacroScoreMap(
  overallScore: OverallScore,
  aiCitation: AICitationPossibilityScore | null
): Map<MacroScoreId, number> {
  // 카테고리별 점수를 매크로 ID로 그룹핑
  const grouped = new Map<MacroScoreId, number[]>()

  for (const category of overallScore.categories) {
    const macroId = SCORING.CATEGORY_TO_MACRO_MAP[category.id as CategoryId] as
      | MacroScoreId
      | undefined
    if (!macroId) continue

    const existing = grouped.get(macroId) ?? []
    existing.push(category.score)
    grouped.set(macroId, existing)
  }

  // 그룹별 평균 계산
  const result = new Map<MacroScoreId, number>()
  for (const [macroId, scores] of grouped) {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
    result.set(macroId, Math.round(avg))
  }

  // AI 점수 추가 (있을 때만)
  if (aiCitation) {
    result.set('ai', Math.round(aiCitation.overallScore))
  }

  return result
}

/** Map → MacroScore[] 변환 */
function buildMacroScoreArray(
  macroScoreMap: Map<MacroScoreId, number>,
  hasAIData: boolean
): MacroScore[] {
  const ids: MacroScoreId[] = hasAIData
    ? ['seo', 'geo', 'performance', 'ai', 'security']
    : ['seo', 'geo', 'performance', 'security']

  return ids.map((id) => {
    const score = macroScoreMap.get(id) ?? 0
    return {
      id,
      label: SCORING.MACRO_SCORE_LABELS[id],
      score,
      grade: SCORING.getScoreGrade(score),
      gradeLabel: SCORING.getScoreLabel(score),
    }
  })
}

/** 가중 합산 종합 점수 */
function calculateWeightedTotal(
  macroScoreMap: Map<MacroScoreId, number>,
  hasAIData: boolean
): number {
  let total = 0

  if (hasAIData) {
    for (const [id, weight] of Object.entries(SCORING.MACRO_SCORE_WEIGHTS)) {
      const score = macroScoreMap.get(id as MacroScoreId) ?? 0
      total += score * weight
    }
  } else {
    for (const [id, weight] of Object.entries(
      SCORING.MACRO_SCORE_WEIGHTS_NO_AI
    )) {
      const score = macroScoreMap.get(id as MacroScoreId) ?? 0
      total += score * weight
    }
  }

  return Math.round(total)
}

/** 데이터 완성도 → 리포트 신뢰도 */
function deriveReportReliability(dataCompleteness: number): ReportReliability {
  if (dataCompleteness >= SCORING.DATA_COMPLETENESS_THRESHOLDS.high)
    return 'high'
  if (dataCompleteness >= SCORING.DATA_COMPLETENESS_THRESHOLDS.medium)
    return 'medium'
  return 'low'
}
