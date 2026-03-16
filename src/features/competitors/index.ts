// ─── Public API ───

export { extractCompetitorUrls } from './services/extract-competitor-urls'
export { crawlCompetitor } from './services/crawl-competitor'
export { buildMatrix } from './services/build-matrix'
export { analyzeGaps } from './services/analyze-gaps'
export { enrichWithCompetitorData } from './services/enrich-competitors'

// ─── Constants ───

export {
  MAX_COMPETITORS,
  MATRIX_CATEGORY_LABELS,
  GAP_THRESHOLDS,
  POSITION_THRESHOLDS,
} from './constants'

// ─── Types ───

export type {
  CompetitorCrawlResult,
  CompetitorScore,
  CompetitorUrlSource,
  ComparisonMatrix,
  CompetitivePosition,
  EnrichCompetitorParams,
  EnrichedCompetitorResult,
  EstimatedImpact,
  ExtractResult,
  GapAnalysisResult,
  GapItem,
  GapSeverity,
  MatrixCategory,
  MatrixCategoryId,
  MatrixCompetitor,
} from './types'
