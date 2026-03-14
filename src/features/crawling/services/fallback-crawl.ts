import type { CrawlData } from '../types'
import { runLayers } from './run-layers'

interface FallbackCrawlParams {
  url: string
  blockedReason: string
}

/**
 * robots.txt 차단 시 부분 크롤 데이터 조립
 *
 * Layer 1(직접 크롤링)은 스킵하고 Layer 2(Google API) + Layer 3(오픈소스)만 실행.
 * 전체 데이터의 ~60%를 확보할 수 있다.
 *
 * n8n 웹훅 경유와 별도로, 직접 호출이 필요한 경우를 위한 헬퍼.
 *
 * @returns is_partial: true + blocked_reason이 포함된 CrawlData
 */
export async function buildFallbackCrawlData(
  params: FallbackCrawlParams
): Promise<CrawlData> {
  const { url, blockedReason } = params
  const startTime = Date.now()

  const { layer2, layer3 } = await runLayers(url)

  return {
    crawled_at: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
    is_partial: true,
    blocked_reason: blockedReason,
    layer1: null,
    robots_txt: null,
    sitemap: null,
    llms_txt: null,
    cms: null,
    mobile: null,
    layer2,
    layer3,
  }
}
