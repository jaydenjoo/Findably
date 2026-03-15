import type {
  OverallScore,
  AICitationPossibilityScore,
} from '@/features/diagnosis-free/types'

/** analysis_data JSON 구조 */
export interface AnalysisData {
  overallScore: OverallScore
  aiCitation: AICitationPossibilityScore
}

/** crawl_data → partial 정보 */
export interface PartialInfo {
  isPartial: boolean
  blockedReason?: string
}

/** analysis_data JSON → 타입 안전 파싱 */
export function parseAnalysisData(raw: unknown): AnalysisData | null {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('overallScore' in raw) ||
    !('aiCitation' in raw)
  ) {
    return null
  }
  return raw as AnalysisData
}

/** crawl_data → partial 정보 추출 */
export function parsePartialInfo(raw: unknown): PartialInfo {
  if (typeof raw === 'object' && raw !== null && 'is_partial' in raw) {
    const data = raw as Record<string, unknown>
    return {
      isPartial: data.is_partial === true,
      blockedReason:
        typeof data.blocked_reason === 'string'
          ? data.blocked_reason
          : undefined,
    }
  }
  return { isPartial: false }
}
