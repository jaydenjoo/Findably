import type {
  AIAgentResult,
  EnhancedQuickWin,
  StrategicRecommendation,
  AICitabilityAssessment,
} from '../types'
import { extractJsonFromContent } from './extract-json'

// ─── v2: 에이전트 응답에서 확장 데이터 추출 ───

/** v2 확장 데이터 (에이전트별 추출 결과) */
export interface V2EnhancedData {
  enhancedQuickWins: EnhancedQuickWin[]
  strategicRecommendations: StrategicRecommendation[]
  aiCitability: AICitabilityAssessment | null
}

/** EnhancedQuickWin 유효성 검사 */
export function isValidEnhancedQuickWin(
  item: unknown
): item is Record<string, unknown> {
  if (!item || typeof item !== 'object') return false
  const obj = item as Record<string, unknown>
  return (
    typeof obj.action === 'string' &&
    typeof obj.effect === 'string' &&
    typeof obj.difficulty === 'string' &&
    ['easy', 'medium', 'hard'].includes(obj.difficulty as string)
  )
}

/** StrategicRecommendation 유효성 검사 */
export function isValidStrategicRec(
  item: unknown
): item is Record<string, unknown> {
  if (!item || typeof item !== 'object') return false
  const obj = item as Record<string, unknown>
  return (
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.timeframe === 'string' &&
    ['immediate', 'short-term', 'mid-term'].includes(obj.timeframe as string)
  )
}

/** AICitabilityAssessment 유효성 검사 */
export function isValidAICitability(
  data: unknown
): data is Record<string, unknown> {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.score === 'number' &&
    obj.score >= 0 &&
    obj.score <= 100 &&
    typeof obj.reasoning === 'string' &&
    Array.isArray(obj.improvementAreas)
  )
}

/**
 * 전체 에이전트 결과에서 v2 확장 데이터 추출
 *
 * 각 에이전트의 rawResponse를 재파싱하여 quickWins, strategicRecommendations,
 * aiCitability를 추출한다. 기존 parseAgentResponse의 반환 타입을 변경하지 않고
 * 하위호환성을 유지한다.
 */
export function parseV2EnhancedData(
  agentResults: AIAgentResult[]
): V2EnhancedData {
  const allQuickWins: EnhancedQuickWin[] = []
  const allStrategicRecs: StrategicRecommendation[] = []
  let aiCitability: AICitabilityAssessment | null = null

  for (const result of agentResults) {
    if (!result.rawResponse || result.status !== 'completed') continue

    const parsed = extractJsonFromContent(result.rawResponse)
    if (!parsed) continue

    try {
      // quickWins 추출
      if (Array.isArray(parsed.quickWins)) {
        for (const item of parsed.quickWins) {
          if (isValidEnhancedQuickWin(item)) {
            const obj = item as Record<string, unknown>
            allQuickWins.push({
              action: obj.action as string,
              effect: obj.effect as string,
              difficulty: obj.difficulty as EnhancedQuickWin['difficulty'],
              estimatedTime:
                typeof obj.estimatedTime === 'string'
                  ? obj.estimatedTime
                  : '미정',
              category:
                (obj.category as EnhancedQuickWin['category']) ?? 'technical',
            })
          }
        }
      }

      // strategicRecommendations 추출
      if (Array.isArray(parsed.strategicRecommendations)) {
        for (const item of parsed.strategicRecommendations) {
          if (isValidStrategicRec(item)) {
            const obj = item as Record<string, unknown>
            allStrategicRecs.push({
              title: obj.title as string,
              description: obj.description as string,
              timeframe: obj.timeframe as StrategicRecommendation['timeframe'],
              expectedImpact:
                (obj.expectedImpact as StrategicRecommendation['expectedImpact']) ??
                'medium',
              category:
                (obj.category as StrategicRecommendation['category']) ??
                'technical',
              dependencies: Array.isArray(obj.dependencies)
                ? (obj.dependencies as string[]).filter(
                    (d) => typeof d === 'string'
                  )
                : undefined,
            })
          }
        }
      }

      // aiCitability 추출 (GEO 에이전트에서만 기대)
      if (
        result.agentId === 'geo' &&
        isValidAICitability(parsed.aiCitability)
      ) {
        const obj = parsed.aiCitability as Record<string, unknown>
        aiCitability = {
          score: obj.score as number,
          reasoning: obj.reasoning as string,
          improvementAreas: (obj.improvementAreas as unknown[]).filter(
            (a): a is string => typeof a === 'string'
          ),
        }
      }
    } catch {
      // 파싱 실패 시 해당 에이전트의 v2 데이터 무시 — 기존 insights는 영향 없음
      continue
    }
  }

  return {
    enhancedQuickWins: allQuickWins,
    strategicRecommendations: allStrategicRecs,
    aiCitability,
  }
}
