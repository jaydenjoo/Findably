import type {
  AIPlatform,
  CategoryId,
  CategoryScore,
  OverallScore,
  QuickWin,
  AICitationPossibilityScore,
} from '@/features/diagnosis-free'
import type { AgentId } from '@/config/diagnosis-paid'

// ─── 에이전트 ───

/** 5개 AI 에이전트 ID — config/diagnosis-paid에서 정의 */
export type { AgentId } from '@/config/diagnosis-paid'

/** 에이전트 실행 상태 */
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed'

/** 진단 레코드 상태 (DB status 컬럼) */
export type DiagnosisStatus = 'analyzing' | 'completed' | 'failed'

// ─── AI 인사이트 ───

/** AI가 생성한 인사이트 항목 */
export interface AIInsight {
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  /** CategoryId 또는 에이전트가 반환하는 확장 카테고리 */
  category: CategoryId | 'seo'
  actionable: boolean
  suggestedFix?: string
}

// ─── 경쟁사 / SWOT / 로드맵 ───

/** 경쟁사 비교 결과 */
export interface CompetitorAnalysis {
  url: string
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  gaps: string[]
}

/** SWOT 분석 */
export interface SwotAnalysis {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

/** 90일 로드맵 항목 */
export interface RoadmapItem {
  week: number
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  estimatedImpact: number
}

// ─── AI 인용 실제 추적 (Task 5.3) ───

/** AI 인용 상태 — Y(mentioned) / △(similar) / N(not_mentioned) */
export type CitationStatus = 'mentioned' | 'similar' | 'not_mentioned'

/** 키워드 × 플랫폼 단위 추적 결과 */
export interface CitationKeywordResult {
  keyword: string
  platform: AIPlatform
  platformLabel: string
  status: CitationStatus
  /** 인용된 경우 해당 URL */
  mentionedUrl?: string
  /** AI 응답 발췌 (최대 300자) */
  snippet: string
  tokenUsage: { input: number; output: number }
  durationMs: number
}

/** 플랫폼별 인용 요약 */
export interface CitationPlatformSummary {
  platform: AIPlatform
  platformLabel: string
  mentionedCount: number
  totalKeywords: number
}

/** AI 인용 실제 추적 전체 결과 */
export interface AICitationTrackingResult {
  keywords: string[]
  results: CitationKeywordResult[]
  platformSummary: CitationPlatformSummary[]
  /** 전체 인용률 (0~1) */
  overallMentionRate: number
  totalCostKrw: number
  totalDurationMs: number
}

// ─── CMO 검증 ───

/** CMO 검증 에이전트 응답 (Phase 3) */
export interface CmoVerificationResponse {
  executive_summary: string
  quality_score: number
  issues_found: Array<{
    type: 'contradiction' | 'unsupported' | 'duplicate'
    description: string
    related_insights: string[]
  }>
}

// ─── 에이전트 결과 ───

/** 개별 에이전트 실행 결과 */
export interface AIAgentResult {
  agentId: AgentId
  status: AgentStatus
  insights: AIInsight[]
  rawResponse?: string
  tokenUsage: {
    input: number
    output: number
  }
  durationMs: number
  error?: string
}

// ─── 유료 분석 전체 ───

/** 유료 분석 전체 데이터 (DB analysis_data에 저장) */
export interface PaidAnalysisData {
  /** 무료 분석 기반 */
  overallScore: OverallScore
  categoryScores: CategoryScore[]
  quickWins: QuickWin[]
  aiCitation: AICitationPossibilityScore

  /** 유료 전용 — AI 인사이트 */
  aiInsights: AIInsight[]

  /** 유료 전용 — SWOT */
  swot: SwotAnalysis

  /** 유료 전용 — 90일 로드맵 */
  roadmap: RoadmapItem[]

  /** 유료 전용 — 경쟁사 분석 */
  competitors: CompetitorAnalysis[]

  /** 유료 전용 — AI 인용 실제 추적 (Task 5.3) */
  aiCitationTracking: AICitationTrackingResult

  /** 유료 전용 — CMO 검증 요약 */
  cmoSummary: string

  /** 에이전트 실행 메타데이터 */
  agentResults: AIAgentResult[]
  totalCostKrw: number
  totalDurationMs: number
}

// ─── 실행 결과 ───

/** 유료 분석 실행 결과 */
export interface RunDiagnosisPaidResult {
  success: boolean
  error?: string
  failedAgents?: AgentId[]
}
