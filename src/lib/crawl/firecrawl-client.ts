import FirecrawlApp from '@mendable/firecrawl-js'
import { crawlingConfig } from '@/config/crawling'

/** Firecrawl /scrape 응답에서 필요한 필드만 추출 */
export interface FirecrawlScrapeResult {
  html: string
  markdown: string
  metadata: Record<string, unknown>
}

/** Firecrawl API 타임아웃 (ms) — config/crawling에서 관리 */
const FIRECRAWL_TIMEOUT_MS = crawlingConfig.firecrawlTimeoutMs

/**
 * Firecrawl 클라이언트 인스턴스 생성.
 * API 키 미설정 시 null 반환.
 */
function createClient(): FirecrawlApp | null {
  const apiKey = crawlingConfig.firecrawlApiKey
  if (!apiKey) {
    return null
  }
  return new FirecrawlApp({ apiKey })
}

/**
 * Firecrawl /scrape 엔드포인트 호출.
 * JS 렌더링된 HTML + 마크다운 + 메타데이터를 반환.
 *
 * SDK v4는 성공 시 Document 객체를 직접 반환하고, 실패 시 throw.
 *
 * @param url - 크롤링 대상 URL
 * @returns FirecrawlScrapeResult | null (API 키 미설정, 에러, 타임아웃 시 null)
 */
export async function scrapeUrl(
  url: string
): Promise<FirecrawlScrapeResult | null> {
  const client = createClient()
  if (!client) {
    return null
  }

  try {
    const result = await Promise.race([
      client.scrape(url, { formats: ['html', 'markdown'] }),
      rejectAfterTimeout(FIRECRAWL_TIMEOUT_MS),
    ])

    return {
      html: result.html ?? '',
      markdown: result.markdown ?? '',
      metadata: (result.metadata as Record<string, unknown>) ?? {},
    }
  } catch (error) {
    console.error('[firecrawl:scrapeUrl]', error)
    return null
  }
}

/**
 * Firecrawl /map 엔드포인트 호출.
 * 사이트의 URL 목록을 반환.
 *
 * SDK v4는 성공 시 MapData { links: SearchResultWeb[] }를 반환하고, 실패 시 throw.
 *
 * @param url - 사이트 루트 URL
 * @returns URL 배열 | null (API 키 미설정, 에러, 타임아웃 시 null)
 */
export async function mapUrl(url: string): Promise<string[] | null> {
  const client = createClient()
  if (!client) {
    return null
  }

  try {
    const result = await Promise.race([
      client.map(url),
      rejectAfterTimeout(FIRECRAWL_TIMEOUT_MS),
    ])

    return (result.links ?? []).map((link) =>
      typeof link === 'string' ? link : link.url
    )
  } catch (error) {
    console.error('[firecrawl:mapUrl]', error)
    return null
  }
}

/** 타임아웃 후 reject하는 Promise */
function rejectAfterTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Firecrawl timeout after ${ms}ms`)), ms)
  })
}
