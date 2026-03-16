import type { CompetitorAnalysis } from '@/features/diagnosis-paid'

// ─── 6.1: URL 추출 ───

/** URL 출처 */
export type CompetitorUrlSource = 'ai_agent' | 'user_input'

/** URL 추출 결과 */
export interface ExtractResult {
  urls: string[]
  sources: CompetitorUrlSource[]
}

// ─── 6.2: PageSpeed 크롤링 ───

/** 경쟁사 PageSpeed 크롤링 결과 */
export interface CompetitorCrawlResult {
  url: string
  performance: number | null
  accessibility: number | null
  seo: number | null
  bestPractices: number | null
  coreWebVitals: {
    lcp: number | null
    fid: number | null
    cls: number | null
    ttfb: number | null
  }
  mobile: boolean
  crawledAt: string
  error: string | null
}

// ─── 6.3: 비교 매트릭스 ───

/** 매트릭스 카테고리 ID */
export type MatrixCategoryId =
  | 'performance'
  | 'seo'
  | 'accessibility'
  | 'content'
  | 'geo'

/** 매트릭스 카테고리별 점수 비교 */
export interface MatrixCategory {
  id: MatrixCategoryId
  label: string
  originalScore: number
  competitorScores: CompetitorScore[]
  winner: string // URL of winner ('original' or competitor URL)
}

/** 경쟁사 카테고리 점수 */
export interface CompetitorScore {
  url: string
  score: number
}

/** 매트릭스 내 경쟁사 요약 */
export interface MatrixCompetitor {
  url: string
  overallScore: number
  categoryScores: Partial<Record<MatrixCategoryId, number>>
}

/** 비교 매트릭스 전체 */
export interface ComparisonMatrix {
  categories: MatrixCategory[]
  originalUrl: string
  originalOverallScore: number
  competitors: MatrixCompetitor[]
}

// ─── 6.4: 갭 분석 ───

/** 갭 심각도 */
export type GapSeverity = 'critical' | 'warning' | 'info'

/** 예상 영향도 */
export type EstimatedImpact = 'high' | 'medium' | 'low'

/** 경쟁 포지션 */
export type CompetitivePosition = 'leading' | 'competitive' | 'lagging'

/** 갭 항목 */
export interface GapItem {
  category: MatrixCategoryId
  categoryLabel: string
  gap: number
  severity: GapSeverity
  description: string
  suggestedAction: string
  estimatedImpact: EstimatedImpact
}

/** 갭 분석 결과 */
export interface GapAnalysisResult {
  gaps: GapItem[]
  competitivePosition: CompetitivePosition
  summary: string
}

// ─── 오케스트레이션 ───

/** enrichWithCompetitorData 입력 */
export interface EnrichCompetitorParams {
  originalUrl: string
  originalPerformanceScore: number | null
  originalSeoScore: number | null
  originalAccessibilityScore: number | null
  originalContentScore: number | null
  originalGeoScore: number | null
  originalOverallScore: number
  aiCompetitors: CompetitorAnalysis[]
  userCompetitorUrls?: string[]
}

/** enrichWithCompetitorData 출력 */
export interface EnrichedCompetitorResult {
  extractResult: ExtractResult
  crawlResults: CompetitorCrawlResult[]
  matrix: ComparisonMatrix
  gapAnalysis: GapAnalysisResult
}
