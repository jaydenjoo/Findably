import type { CrawlData } from '@/features/crawling'
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
}

export interface RuleDefinition {
  id: string
  category: CategoryId
  name: string
  maxPoints: number
  severity: RuleSeverity
  quickWinEligible: boolean
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
  quickWinEligible: boolean
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

export interface QuickWin {
  ruleId: string
  ruleName: string
  category: CategoryId
  severity: RuleSeverity
  message: string
  impact: number
}
