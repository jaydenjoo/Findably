import type {
  CompetitorCrawlResult,
  EnrichCompetitorParams,
  EnrichedCompetitorResult,
} from '../types'
import { extractCompetitorUrls } from './extract-competitor-urls'
import { crawlCompetitor } from './crawl-competitor'
import { buildMatrix } from './build-matrix'
import { analyzeGaps } from './analyze-gaps'

/**
 * 경쟁사 분석 오케스트레이션 (Epic 6 전체 파이프라인).
 *
 * 1. URL 추출 (AI + 사용자 입력)
 * 2. PageSpeed 병렬 크롤링
 * 3. 비교 매트릭스 생성
 * 4. 갭 분석
 */
export async function enrichWithCompetitorData(
  params: EnrichCompetitorParams
): Promise<EnrichedCompetitorResult> {
  // Step 1: URL 추출
  const extractResult = extractCompetitorUrls({
    aiCompetitors: params.aiCompetitors,
    userCompetitorUrls: params.userCompetitorUrls,
    originalUrl: params.originalUrl,
  })

  // Step 2: 병렬 크롤링 (하나 실패해도 나머지 계속)
  const settled = await Promise.allSettled(
    extractResult.urls.map((url) => crawlCompetitor(url))
  )

  const crawlResults: CompetitorCrawlResult[] = settled
    .filter(
      (r): r is PromiseFulfilledResult<CompetitorCrawlResult> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value)

  // G3: PageSpeed 크롤링 실패 건 로깅 — AI 분석 결과는 buildMatrix에서 독립 보존됨
  const failedCrawls = crawlResults.filter((r) => r.error !== null)
  if (failedCrawls.length > 0) {
    console.warn(
      `[enrichWithCompetitorData] PageSpeed 크롤링 실패 ${failedCrawls.length}건:`,
      failedCrawls.map((r) => `${r.url} (${r.error})`).join(', ')
    )
  }

  const successfulCrawls = crawlResults.filter((r) => r.error === null)

  // Step 3: 비교 매트릭스
  const matrix = buildMatrix({
    originalUrl: params.originalUrl,
    originalScores: {
      performance: params.originalPerformanceScore,
      seo: params.originalSeoScore,
      accessibility: params.originalAccessibilityScore,
      content: params.originalContentScore,
      geo: params.originalGeoScore,
      overall: params.originalOverallScore,
    },
    crawlResults: successfulCrawls,
    aiCompetitors: params.aiCompetitors,
  })

  // Step 4: 갭 분석
  const gapAnalysis = analyzeGaps(matrix)

  return {
    extractResult,
    crawlResults,
    matrix,
    gapAnalysis,
  }
}
