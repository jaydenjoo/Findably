// ─── Public API ───

export { runDiagnosisPaid } from './services/run-diagnosis-paid'
export { trackAICitation } from './services/track-ai-citation'
export { generateSwotAnalysis } from './services/generate-swot'
export { generateRoadmap } from './services/generate-roadmap'

// ─── Validation ───

import type { PaidAnalysisData } from './types'

/** DB JSONB → PaidAnalysisData 런타임 타입 가드 (부분 데이터도 허용) */
export function isPaidAnalysisData(data: unknown): data is PaidAnalysisData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  // 최소 조건: cmoSummary(문자열) 또는 aiInsights(배열) 중 하나만 있으면 유료 데이터로 간주
  // 나머지 필드는 각 섹션 컴포넌트에서 null 방어 처리됨
  return (
    typeof d.cmoSummary === 'string' ||
    Array.isArray(d.aiInsights) ||
    Array.isArray(d.roadmap) ||
    (d.swot != null && typeof d.swot === 'object')
  )
}

// ─── Types ───

export type {
  AgentId,
  AgentStatus,
  AICitationTrackingResult,
  AIAgentResult,
  AIInsight,
  CitationKeywordResult,
  CitationPlatformSummary,
  CitationStatus,
  CompetitorAnalysis,
  DiagnosisStatus,
  PaidAnalysisData,
  RoadmapItem,
  RunDiagnosisPaidResult,
  SwotAnalysis,
} from './types'
