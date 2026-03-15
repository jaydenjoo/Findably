// ─── Public API ───

export { evaluate } from './engine'
export { calculateAICitationPossibility } from './rules/ai-citation-helpers'
export { runDiagnosis } from './services/run-diagnosis'
export { ALL_RULES } from './rules'
export { CATEGORY_CONFIG, SEO_THRESHOLDS, SKIPPED_MESSAGE } from './constants'

// ─── Types ───

export type {
  AICitationPossibilityScore,
  CategoryId,
  CategoryScore,
  OverallScore,
  QuickWin,
  RuleDefinition,
  RuleEvaluation,
  RuleResult,
  RuleSeverity,
} from './types'
