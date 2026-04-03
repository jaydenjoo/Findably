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
export type AgentStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'empty'

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
  /** v2: 비즈니스 임팩트 (e.g. "매출 15% 감소 가능성") */
  impact?: string
  /** v2: 근거 — 크롤링 데이터에서 발견한 수치 기반 증거 */
  evidence?: string
  /** v2: 우선순위 (1=최우선 ~ 10=낮음, Impact×Effort 매트릭스 기반) */
  priority?: number
}

// ─── v2: 강화된 Quick Win + 전략 권고 ───

/** v2: 구체적 실행안이 포함된 Quick Win */
export interface EnhancedQuickWin {
  action: string
  effect: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: string
  category: CategoryId
}

/** v2: 컨설팅급 전략 권고 항목 */
export interface StrategicRecommendation {
  title: string
  description: string
  timeframe: 'immediate' | 'short-term' | 'mid-term'
  expectedImpact: 'high' | 'medium' | 'low'
  category: CategoryId
  dependencies?: string[]
}

/** v2: AI 인용 가능성 심층 평가 */
export interface AICitabilityAssessment {
  /** 인용 가능성 점수 (0-100) */
  score: number
  /** 점수 산정 근거 */
  reasoning: string
  /** 개선 필요 영역 목록 */
  improvementAreas: string[]
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
  /** 실행 단계 (Phase 1: 즉시 실행 / Phase 2: 단기 개선 / Phase 3: 중장기) */
  phase?: string
  /** 구체적 실행 가이드 — AI insight의 suggestedFix에서 매핑 */
  howTo?: string
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
  /** API 키 미설정 등으로 플랫폼 사용 불가 시 true — 리포트에서 안내 표시용 */
  platformsUnavailable?: boolean
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
  /** G2: Impact×Effort 매트릭스 기반 우선순위 보정 */
  priority_adjustments?: Array<{
    insight_title: string
    current_priority: number
    suggested_priority: number
    reason: string
  }>
  /** G2: 구체성 부족 인사이트 플래그 */
  specificity_flags?: Array<{
    insight_title: string
    issue: string
    suggestion: string
  }>
  /** G2: 한국 시장 맥락 보충 의견 (네이버/카카오/한국 소비자) */
  korean_market_notes?: string
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

  /** v2: 컨설팅급 전략 권고 (optional — 하위호환) */
  strategicRecommendations?: StrategicRecommendation[]

  /** v2: 강화된 Quick Win (optional — 하위호환) */
  enhancedQuickWins?: EnhancedQuickWin[]

  /** v2: AI 인용 가능성 심층 평가 (optional — 하위호환) */
  aiCitability?: AICitabilityAssessment

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
