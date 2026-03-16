import type { CompetitorAnalysis } from '@/features/diagnosis-paid'
import type {
  ComparisonMatrix,
  CompetitorCrawlResult,
  CompetitorScore,
  MatrixCategory,
  MatrixCategoryId,
  MatrixCompetitor,
} from '../types'
import { MATRIX_CATEGORY_LABELS } from '../constants'

interface BuildMatrixParams {
  originalUrl: string
  originalScores: {
    performance: number | null
    seo: number | null
    accessibility: number | null
    content: number | null
    geo: number | null
    overall: number
  }
  crawlResults: CompetitorCrawlResult[]
  aiCompetitors: CompetitorAnalysis[]
}

const CATEGORY_IDS: MatrixCategoryId[] = [
  'performance',
  'seo',
  'accessibility',
  'content',
  'geo',
]

/**
 * 원본 사이트 + 경쟁사 점수를 5개 카테고리 비교 매트릭스로 변환.
 * PageSpeed(정량) + AI 에이전트(정성) 데이터를 통합.
 */
export function buildMatrix(params: BuildMatrixParams): ComparisonMatrix {
  const { originalUrl, originalScores, crawlResults, aiCompetitors } = params

  const crawlMap = buildCrawlMap(crawlResults)
  const aiMap = buildAiMap(aiCompetitors)
  const competitorUrls = getUniqueCompetitorUrls(crawlResults, aiCompetitors)

  const categories: MatrixCategory[] = CATEGORY_IDS.map((id) =>
    buildCategory(
      id,
      originalUrl,
      originalScores[id],
      competitorUrls,
      crawlMap,
      aiMap
    )
  )

  const competitors: MatrixCompetitor[] = competitorUrls.map((url) =>
    buildCompetitorSummary(url, crawlMap, aiMap)
  )

  return {
    categories,
    originalUrl,
    originalOverallScore: originalScores.overall,
    competitors,
  }
}

/** 카테고리 1개 비교 데이터 생성 */
function buildCategory(
  id: MatrixCategoryId,
  originalUrl: string,
  originalScore: number | null,
  competitorUrls: string[],
  crawlMap: Map<string, CompetitorCrawlResult>,
  aiMap: Map<string, CompetitorAnalysis>
): MatrixCategory {
  const competitorScores: CompetitorScore[] = []

  for (const url of competitorUrls) {
    const host = normalizeHost(url)
    const score = getCompetitorCategoryScore(
      id,
      crawlMap.get(host),
      aiMap.get(host)
    )
    if (score != null) {
      competitorScores.push({ url, score })
    }
  }

  const effectiveOriginal = originalScore ?? 0
  let winner = originalUrl
  let maxScore = effectiveOriginal

  for (const cs of competitorScores) {
    if (cs.score > maxScore) {
      maxScore = cs.score
      winner = cs.url
    }
  }

  return {
    id,
    label: MATRIX_CATEGORY_LABELS[id],
    originalScore: effectiveOriginal,
    competitorScores,
    winner,
  }
}

/** 경쟁사 1개의 종합 요약 생성 */
function buildCompetitorSummary(
  url: string,
  crawlMap: Map<string, CompetitorCrawlResult>,
  aiMap: Map<string, CompetitorAnalysis>
): MatrixCompetitor {
  const host = normalizeHost(url)
  const crawl = crawlMap.get(host)
  const ai = aiMap.get(host)

  const categoryScores: Partial<Record<MatrixCategoryId, number>> = {}

  if (crawl?.performance != null) categoryScores.performance = crawl.performance
  if (crawl?.seo != null) categoryScores.seo = crawl.seo
  if (crawl?.accessibility != null)
    categoryScores.accessibility = crawl.accessibility
  if (ai?.overallScore != null) categoryScores.content = ai.overallScore
  // geo: 경쟁사 GEO 분석 미지원

  const scores = Object.values(categoryScores)
  const overallScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

  return { url, overallScore, categoryScores }
}

/** 카테고리별 경쟁사 점수 추출 */
function getCompetitorCategoryScore(
  categoryId: MatrixCategoryId,
  crawl: CompetitorCrawlResult | undefined,
  ai: CompetitorAnalysis | undefined
): number | null {
  switch (categoryId) {
    case 'performance':
      return crawl?.performance ?? null
    case 'seo':
      return crawl?.seo ?? null
    case 'accessibility':
      return crawl?.accessibility ?? null
    case 'content':
      return ai?.overallScore ?? null
    case 'geo':
      return null // 경쟁사 GEO 분석 미지원
  }
}

/** 크롤 결과 → hostname 기준 Map */
function buildCrawlMap(
  results: CompetitorCrawlResult[]
): Map<string, CompetitorCrawlResult> {
  const map = new Map<string, CompetitorCrawlResult>()
  for (const r of results) {
    map.set(normalizeHost(r.url), r)
  }
  return map
}

/** AI 분석 결과 → hostname 기준 Map */
function buildAiMap(
  competitors: CompetitorAnalysis[]
): Map<string, CompetitorAnalysis> {
  const map = new Map<string, CompetitorAnalysis>()
  for (const c of competitors) {
    map.set(normalizeHost(c.url), c)
  }
  return map
}

/** 크롤 + AI 결과에서 중복 없는 경쟁사 URL 목록 */
function getUniqueCompetitorUrls(
  crawlResults: CompetitorCrawlResult[],
  aiCompetitors: CompetitorAnalysis[]
): string[] {
  const seen = new Set<string>()
  const urls: string[] = []

  for (const r of crawlResults) {
    const host = normalizeHost(r.url)
    if (!seen.has(host)) {
      seen.add(host)
      urls.push(r.url)
    }
  }

  for (const c of aiCompetitors) {
    const host = normalizeHost(c.url)
    if (!seen.has(host)) {
      seen.add(host)
      urls.push(c.url)
    }
  }

  return urls
}

/** hostname 정규화 (www. 제거) */
function normalizeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
