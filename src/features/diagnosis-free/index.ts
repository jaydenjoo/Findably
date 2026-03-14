// ─── Public API ───

export { evaluate } from './engine'
export { ALL_RULES } from './rules'
export { CATEGORY_CONFIG, SEO_THRESHOLDS, SKIPPED_MESSAGE } from './constants'

// ─── Types ───

export type {
  CategoryId,
  CategoryScore,
  OverallScore,
  QuickWin,
  RuleDefinition,
  RuleEvaluation,
  RuleResult,
  RuleSeverity,
} from './types'
