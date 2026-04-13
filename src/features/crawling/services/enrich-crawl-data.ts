import { createAdminClient } from '@/lib/supabase/admin'
import { fetchPageSpeed } from '../fetchers/pagespeed'
import { fetchSslLabs } from '../fetchers/ssl-labs'
import { fetchObservatory } from '../fetchers/observatory'
import { fetchSafeBrowsing } from '../fetchers/safe-browsing'
import { fetchHeadMetadata } from '../fetchers/head-metadata'
import type { Json } from '@/types/database'
import type {
  CrawlData,
  Layer1Data,
  Layer2Data,
  Layer3Data,
  MobileData,
} from '../types'

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

  // 2. 누락된 데이터 식별 (값의 유효성도 체크)
  const needsPageSpeed = !existingLayer2?.pagespeed?.performance_score
  const needsSafeBrowsing =
    existingLayer2?.safe_browsing?.is_safe === undefined ||
    existingLayer2?.safe_browsing?.is_safe === null
  const needsSsl = !existingLayer3?.ssl?.grade
  const needsObservatory =
    !existingLayer3?.observatory?.score &&
    existingLayer3?.observatory?.score !== 0

  const needsMobile = !crawlData.mobile

  // Layer1 메타데이터 누락 여부 (Firecrawl onlyMainContent: true가 <head> 제거)
  const layer1 = crawlData.layer1
  const needsHeadMetadata =
    layer1 !== null &&
    (!layer1.meta.canonical ||
      layer1.schema_markup.length === 0 ||
      !layer1.meta.og['title'] ||
      (typeof layer1.links.internal === 'number' &&
        layer1.links.internal === 0))

  if (
    !needsPageSpeed &&
    !needsSafeBrowsing &&
    !needsSsl &&
    !needsObservatory &&
    !needsMobile &&
    !needsHeadMetadata
  ) {
    console.log('[enrichCrawlData] 모든 데이터 존재, 스킵')
    return
  }

  console.log('[enrichCrawlData] 보강 시작:', {
    diagnosisId,
    url,
    needsPageSpeed,
    needsSafeBrowsing,
    needsSsl,
    needsObservatory,
    needsHeadMetadata,
  })

  // 3. 누락된 fetcher 병렬 실행
  const [
    pagespeedResult,
    safeBrowsingResult,
    sslResult,
    observatoryResult,
    headMetadataResult,
  ] = await Promise.all([
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
    needsHeadMetadata
      ? fetchHeadMetadata(url).catch((err: unknown) => {
          console.error('[enrichCrawlData] HeadMetadata 실패:', err)
          return null
        })
      : null,
  ])

  // 4. 새 데이터가 하나도 없으면 업데이트 불필요
  if (
    !pagespeedResult &&
    !safeBrowsingResult &&
    !sslResult &&
    !observatoryResult &&
    !headMetadataResult
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

  // 모바일 데이터 보강: viewport + PageSpeed 기반으로 생성
  let mobileData: MobileData | null = crawlData.mobile
  if (needsMobile) {
    const viewport = crawlData.layer1?.meta?.viewport
    const viewportConfigured = !!viewport && viewport.includes('width=')
    const pagespeedData = pagespeedResult ?? existingLayer2?.pagespeed
    const hasTouchIssues = pagespeedData
      ? pagespeedData.cls > 0.25 || pagespeedData.lcp_ms > 4000
      : false

    const issues: string[] = []
    if (!viewportConfigured)
      issues.push('viewport 메타 태그가 설정되지 않았습니다')
    if (pagespeedData && pagespeedData.lcp_ms > 4000) {
      issues.push(
        `모바일 LCP가 ${(pagespeedData.lcp_ms / 1000).toFixed(1)}초로 느립니다 (권장: 2.5초 이하)`
      )
    }
    if (pagespeedData && pagespeedData.cls > 0.25) {
      issues.push(
        `CLS가 ${pagespeedData.cls}로 레이아웃 흔들림이 큽니다 (권장: 0.1 이하)`
      )
    }

    mobileData = {
      viewport_configured: viewportConfigured,
      touch_friendly: !hasTouchIssues,
      issues,
    }
  }

  // Layer1 메타데이터 보강 (Firecrawl onlyMainContent: true 보완)
  let enrichedLayer1: Layer1Data | null = crawlData.layer1
  if (headMetadataResult && enrichedLayer1) {
    const meta = { ...enrichedLayer1.meta }
    const og = { ...meta.og }

    // canonical 폴백
    if (!meta.canonical && headMetadataResult.canonical) {
      meta.canonical = headMetadataResult.canonical
    }

    // OG 태그 폴백
    if (!og['title'] && headMetadataResult.ogTags['title']) {
      og['title'] = headMetadataResult.ogTags['title']
    }
    if (!og['description'] && headMetadataResult.ogTags['description']) {
      og['description'] = headMetadataResult.ogTags['description']
    }
    if (!og['image'] && headMetadataResult.ogTags['image']) {
      og['image'] = headMetadataResult.ogTags['image']
    }

    meta.og = og

    // JSON-LD 폴백
    const schemaMarkup =
      enrichedLayer1.schema_markup.length === 0 &&
      headMetadataResult.jsonLd.length > 0
        ? headMetadataResult.jsonLd
        : enrichedLayer1.schema_markup

    // 내부 링크 폴백
    const links =
      enrichedLayer1.links.internal === 0 &&
      headMetadataResult.internalLinkCount > 0
        ? {
            ...enrichedLayer1.links,
            internal: headMetadataResult.internalLinkCount,
            external:
              headMetadataResult.externalLinkCount ||
              enrichedLayer1.links.external,
          }
        : enrichedLayer1.links

    enrichedLayer1 = {
      ...enrichedLayer1,
      meta,
      schema_markup: schemaMarkup,
      links,
    }

    console.log('[enrichCrawlData] Layer1 보강:', {
      canonical: meta.canonical,
      ogTitle: og['title'] ?? null,
      ogImage: og['image'] ?? null,
      schemaCount: schemaMarkup.length,
      internalLinks: links.internal,
    })
  }

  const enrichedCrawlData: CrawlData = {
    ...crawlData,
    layer1: enrichedLayer1,
    layer2: newLayer2,
    layer3: newLayer3,
    mobile: mobileData,
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
    headMetadata: !!headMetadataResult,
  })
}
