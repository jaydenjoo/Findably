// ─── Public API ───

export { evaluate } from './engine'
export { calculateAICitationPossibility } from './rules/ai-citation-helpers'
export { runDiagnosis } from './services/run-diagnosis'
export { aggregateScores } from './services/score-aggregator'
export { ALL_RULES } from './rules'
export { CATEGORY_CONFIG, SEO_THRESHOLDS, SKIPPED_MESSAGE } from './constants'

// ─── Types ───

export type {
  AggregatedScores,
  AICitationPossibilityScore,
  AICitationSignals,
  AIPlatform,
  CategoryId,
  CategoryScore,
  MacroScore,
  OverallScore,
  PlatformCitationScore,
  QuickWin,
  QuickWinDifficulty,
  ReportReliability,
  RuleDefinition,
  RuleEvaluation,
  RuleResult,
  RuleSeverity,
} from './types'
