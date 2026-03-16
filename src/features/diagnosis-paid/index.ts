// ─── Public API ───

export { runDiagnosisPaid } from './services/run-diagnosis-paid'
export { trackAICitation } from './services/track-ai-citation'
export { generateSwotAnalysis } from './services/generate-swot'
export { generateRoadmap } from './services/generate-roadmap'

// ─── Validation ───

import type { PaidAnalysisData } from './types'

/** DB JSONB → PaidAnalysisData 런타임 타입 가드 */
export function isPaidAnalysisData(data: unknown): data is PaidAnalysisData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.cmoSummary === 'string' &&
    Array.isArray(d.aiInsights) &&
    Array.isArray(d.roadmap) &&
    Array.isArray(d.competitors) &&
    d.swot != null &&
    typeof d.swot === 'object' &&
    d.aiCitationTracking != null &&
    typeof d.aiCitationTracking === 'object'
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
