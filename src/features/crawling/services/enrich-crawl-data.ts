import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPageSpeed } from '../fetchers/pagespeed'
import { fetchSslLabs } from '../fetchers/ssl-labs'
import { fetchObservatory } from '../fetchers/observatory'
import { fetchSafeBrowsing } from '../fetchers/safe-browsing'
import type { Json } from '@/types/database'
import type { CrawlData, Layer2Data, Layer3Data } from '../types'

/**
 * 크롤링 데이터 보강 (Layer 2/3 fallback)
 *
 * n8n이 보내지 않은 PageSpeed, SSL Labs, Observatory, Safe Browsing 데이터를
 * 서버에서 직접 수집하여 기존 crawl_data에 merge한다.
 *
 * - 각 fetcher는 독립 실행 (하나 실패해도 나머지 계속)
 * - 이미 데이터가 있는 항목은 건너뜀
 * - 에러 시 기존 데이터 유지 (부분 성공 허용)
 */
export async function enrichCrawlData(
  diagnosisId: string,
  url: string
): Promise<void> {
  const supabase = createAdminClient()

  // 1. 현재 crawl_data 조회
  const { data: diagnosis, error: fetchError } = await supabase
    .from('diagnoses')
    .select('crawl_data')
    .eq('id', diagnosisId)
    .single()

  if (fetchError || !diagnosis?.crawl_data) {
    console.error('[enrichCrawlData] 진단 조회 실패:', fetchError?.message)
    return
  }

  const crawlData = diagnosis.crawl_data as unknown as CrawlData
  const existingLayer2 = crawlData.layer2
  const existingLayer3 = crawlData.layer3

  // 2. 누락된 데이터 식별
  const needsPageSpeed = !existingLayer2?.pagespeed
  const needsSafeBrowsing = !existingLayer2?.safe_browsing
  const needsSsl = !existingLayer3?.ssl
  const needsObservatory = !existingLayer3?.observatory

  if (!needsPageSpeed && !needsSafeBrowsing && !needsSsl && !needsObservatory) {
    console.log('[enrichCrawlData] 모든 Layer 2/3 데이터 존재, 스킵')
    return
  }

  console.log('[enrichCrawlData] 보강 시작:', {
    diagnosisId,
    url,
    needsPageSpeed,
    needsSafeBrowsing,
    needsSsl,
    needsObservatory,
  })

  // 3. 누락된 fetcher 병렬 실행
  const [pagespeedResult, safeBrowsingResult, sslResult, observatoryResult] =
    await Promise.all([
      needsPageSpeed
        ? fetchPageSpeed(url).catch((err: unknown) => {
            console.error('[enrichCrawlData] PageSpeed 실패:', err)
            return null
          })
        : null,
      needsSafeBrowsing
        ? fetchSafeBrowsing(url).catch((err: unknown) => {
            console.error('[enrichCrawlData] SafeBrowsing 실패:', err)
            return null
          })
        : null,
      needsSsl
        ? fetchSslLabs(url).catch((err: unknown) => {
            console.error('[enrichCrawlData] SSL Labs 실패:', err)
            return null
          })
        : null,
      needsObservatory
        ? fetchObservatory(url).catch((err: unknown) => {
            console.error('[enrichCrawlData] Observatory 실패:', err)
            return null
          })
        : null,
    ])

  // 4. 새 데이터가 하나도 없으면 업데이트 불필요
  if (
    !pagespeedResult &&
    !safeBrowsingResult &&
    !sslResult &&
    !observatoryResult
  ) {
    console.log('[enrichCrawlData] 수집된 데이터 없음, 스킵')
    return
  }

  // 5. 기존 데이터와 merge (immutable)
  const newLayer2: Layer2Data = {
    pagespeed: pagespeedResult ?? existingLayer2?.pagespeed ?? null,
    crux: existingLayer2?.crux ?? null,
    safe_browsing: safeBrowsingResult ?? existingLayer2?.safe_browsing ?? null,
  }

  const newLayer3: Layer3Data = {
    ssl: sslResult ?? existingLayer3?.ssl ?? null,
    observatory: observatoryResult ?? existingLayer3?.observatory ?? null,
  }

  const enrichedCrawlData: CrawlData = {
    ...crawlData,
    layer2: newLayer2,
    layer3: newLayer3,
  }

  // 6. DB 업데이트
  const { error: updateError } = await supabase
    .from('diagnoses')
    .update({ crawl_data: enrichedCrawlData as unknown as Json })
    .eq('id', diagnosisId)

  if (updateError) {
    console.error('[enrichCrawlData] DB 업데이트 실패:', updateError.message)
    return
  }

  console.log('[enrichCrawlData] 보강 완료:', {
    diagnosisId,
    pagespeed: !!pagespeedResult,
    safeBrowsing: !!safeBrowsingResult,
    ssl: !!sslResult,
    observatory: !!observatoryResult,
  })
}
