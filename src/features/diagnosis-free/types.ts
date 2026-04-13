import type { CrawlData } from '@/features/crawling'
import type { MacroScoreId } from '@/config/scoring'
import type { ScoreGrade } from '@/types/ui'

// ─── 카테고리 ───

export type CategoryId =
  | 'technical'
  | 'content'
  | 'social-ai'
  | 'performance'
  | 'security'
  | 'mobile'
  | 'geo'

// ─── 룰 정의 ───

export type RuleSeverity = 'critical' | 'warning' | 'info'

export interface RuleEvaluation {
  passed: boolean
  message: string
  /** 진단 근거 — 실제 발견된 값 (예: "https://findably.kr/", "Organization, FAQPage") */
  evidence?: string
}

export interface RuleDefinition {
  id: string
  category: CategoryId
  name: string
  maxPoints: number
  severity: RuleSeverity
  quickWinEligible: boolean
  /** 수정 난이도 (quickWinEligible: true일 때 설정, 미설정 시 'medium') */
  difficulty?: QuickWinDifficulty
  /** 평가에 필요한 데이터가 존재하는지 확인 */
  isEvaluable: (data: CrawlData) => boolean
  /** 룰 평가 (isEvaluable 통과 후 호출) */
  evaluate: (data: CrawlData) => RuleEvaluation
}

// ─── 룰 결과 ───

export interface RuleResult {
  id: string
  category: CategoryId
  name: string
  points: number
  maxPoints: number
  passed: boolean
  skipped: boolean
  severity: RuleSeverity
  message: string
  /** 진단 근거 — 실제 발견된 값 */
  evidence?: string
  quickWinEligible: boolean
  /** 수정 난이도 (quickWinEligible: true일 때 의미 있음) */
  difficulty?: QuickWinDifficulty
}

// ─── 카테고리 점수 ───

export interface CategoryScore {
  id: CategoryId
  name: string
  score: number
  weight: number
  rules: RuleResult[]
  passedCount: number
  totalCount: number
  skippedCount: number
}

// ─── 종합 점수 ───

export interface OverallScore {
  score: number
  grade: ScoreGrade
  gradeLabel: string
  categories: CategoryScore[]
  quickWins: QuickWin[]
  totalRules: number
  passedRules: number
  failedRules: number
  skippedRules: number
  evaluatedAt: string
}

// ─── Quick Win ───

/** 수정 난이도 (easy: HTML 속성 1줄, medium: 콘텐츠/구조, hard: 기술적 개선) */
export type QuickWinDifficulty = 'easy' | 'medium' | 'hard'

export interface QuickWin {
  ruleId: string
  ruleName: string
  category: CategoryId
  severity: RuleSeverity
  message: string
  impact: number
  /** 출처: 룰 기반 or AI 기반 */
  source: 'rule' | 'ai'
  /** 수정 난이도 */
  difficulty: QuickWinDifficulty
}

// ─── 매크로 점수 (5-Score 집계) ───

export type { MacroScoreId } from '@/config/scoring'

/** 개별 매크로 점수 */
export interface MacroScore {
  id: MacroScoreId
  label: string
  score: number
  grade: ScoreGrade
  gradeLabel: string
}

/** 리포트 신뢰도 */
export type ReportReliability = 'high' | 'medium' | 'low'

/** 5-Score 집계 결과 */
export interface AggregatedScores {
  /** 5개 매크로 점수 */
  macroScores: MacroScore[]
  /** 가중 합산 종합 점수 (0-100) */
  totalScore: number
  /** 종합 등급 */
  totalGrade: ScoreGrade
  /** 종합 등급 라벨 */
  totalGradeLabel: string
  /** AI 데이터 포함 여부 */
  hasAIData: boolean
  /** 데이터 완성도 (0-100) */
  dataCompleteness: number
  /** 리포트 신뢰도 */
  reportReliability: ReportReliability
}

// ─── AI 인용 가능성 (Task 4.3) ───

/** AI 플랫폼 식별자 */
export type AIPlatform = 'chatgpt' | 'claude' | 'perplexity' | 'google'

/** 3가지 신호 카테고리 점수 (0-100) */
export interface AICitationSignals {
  /** 봇 접근 허용 여부 (40%) */
  botAccess: number
  /** 콘텐츠 발견 용이성 (40%) */
  contentDiscoverability: number
  /** 신뢰 신호 (20%) */
  trustSignals: number
}

/** 플랫폼별 인용 가능성 점수 */
export interface PlatformCitationScore {
  platform: AIPlatform
  platformLabel: string
  score: number
  blocked: boolean
  signals: AICitationSignals
}

/** AI 인용 가능성 종합 결과 */
export interface AICitationPossibilityScore {
  overallScore: number
  passed: boolean
  platforms: PlatformCitationScore[]
  recommendation: string
}
