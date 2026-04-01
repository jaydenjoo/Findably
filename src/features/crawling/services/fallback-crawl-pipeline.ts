import { scrapeUrl, mapUrl } from '@/lib/crawl/firecrawl-client'
import { enrichCrawlData } from './enrich-crawl-data'
import { saveCrawlResult } from './save-crawl-result'
import { runDiagnosis } from '@/features/diagnosis-free/services/run-diagnosis'
import { parseCrawlV2Result } from './parse-crawl-v2'
import type { CrawlData } from '../types'

interface RunFallbackCrawlParams {
  diagnosisId: string
  url: string
}

interface RunFallbackCrawlResult {
  success: boolean
  error?: string
}

/**
 * n8n 실패 시 Firecrawl 직접 호출로 크롤링 완료
 *
 * 흐름:
 * 1. Firecrawl /scrape + /map 병렬 호출
 * 2. Layer 2/3 데이터 보강 (PageSpeed, SSL Labs, Observatory, Safe Browsing)
 * 3. CrawlData 정규화 및 DB 저장
 * 4. 진단 엔진 실행 (runDiagnosis)
 *
 * 모든 데이터는 기존 parse/save 파이프라인과 일치하는 형태로 변환되어 호환성 보장.
 */
export async function runFallbackCrawl(
  params: RunFallbackCrawlParams
): Promise<RunFallbackCrawlResult> {
  const { diagnosisId, url } = params

  const startMs = Date.now()

  try {
    // 1. Firecrawl 직접 호출 (Scrape + Map 병렬)
    const [scrapeResult, mapResult] = await Promise.all([
      scrapeUrl(url),
      mapUrl(url),
    ])

    // 2. Layer 1 데이터 추출 (parseCrawlV2Result의 parseFirecrawlScrape와 일치)
    const crawlResult = {
      firecrawl_scrape: scrapeResult ? { data: { ...scrapeResult } } : null,
      firecrawl_map: mapResult ? { links: mapResult } : null,
      // Layer 2/3은 null (나중에 enrichCrawlData에서 수집)
      pagespeed_mobile: null,
      ssl_labs: null,
      observatory: null,
      safe_browsing: null,
      robots_txt: null,
      sitemap_xml: null,
      llms_txt: null,
      llms_full_txt: null,
    }

    // 3. Layer 1 데이터만으로 1차 정규화
    const dataCompleteness = scrapeResult && mapResult ? 60 : 30 // 부분 데이터
    const crawlData = parseCrawlV2Result({
      url,
      crawlResult,
      dataCompleteness,
      failedSources: !scrapeResult ? ['firecrawl_scrape'] : [],
    })

    // 4. duration_ms 계산 및 crawlData 보정
    const durationMs = Date.now() - startMs
    const enrichedCrawlData: CrawlData = {
      ...crawlData,
      duration_ms: durationMs,
    }

    // 5. CrawlData 저장 (status → analyzing)
    const saveResult = await saveCrawlResult({
      diagnosisId,
      crawlData: enrichedCrawlData,
    })

    if (!saveResult.success) {
      console.error(
        `[runFallbackCrawl] saveCrawlResult 실패 (diagnosisId=${diagnosisId})`,
        saveResult.error
      )
      return { success: false, error: saveResult.error }
    }

    // 6. Layer 2/3 보강 (병렬 fetcher: PageSpeed, SSL Labs, Observatory, Safe Browsing)
    // 이미 저장된 crawl_data를 enrichCrawlData가 직접 조회하고 업데이트함
    await enrichCrawlData(diagnosisId, url)

    // 7. 진단 엔진 실행 (최신 crawl_data를 다시 조회할 필요 없음: enrichCrawlData가 이미 저장했음)
    // runDiagnosis 호출 시 최신 crawl_data가 DB에 있으므로 그것을 사용
    const diagnosisResult = await runDiagnosis({
      diagnosisId,
      crawlData: enrichedCrawlData, // enrichCrawlData 후 최신 버전 전달
      dataCompleteness,
    })

    if (!diagnosisResult.success) {
      console.error(
        `[runFallbackCrawl] runDiagnosis 실패 (diagnosisId=${diagnosisId})`,
        diagnosisResult.error
      )
      return { success: false, error: diagnosisResult.error }
    }

    console.log(
      `[runFallbackCrawl] 성공 (diagnosisId=${diagnosisId}, duration=${durationMs}ms, dataCompleteness=${dataCompleteness}%)`
    )
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error(
      `[runFallbackCrawl] 예외 발생 (diagnosisId=${diagnosisId}):`,
      message
    )
    return { success: false, error: `Fallback crawl 실패: ${message}` }
  }
}
