import type { CrawlData, Layer1Data, Layer2Data, Layer3Data } from '../types'
import { parseRobotsTxt } from '../parsers/robots-txt'
import { parseSitemap } from '../parsers/sitemap'
import { parseLlmsTxt } from '../parsers/llms-txt'

// ─── n8n v2 raw crawlResult → CrawlData 정규화 ───

/** parseCrawlV2Result 입력 파라미터 */
interface ParseCrawlV2Params {
  url: string
  crawlResult: Record<string, unknown>
  dataCompleteness: number
  failedSources: string[]
}

/** unknown → Record<string, unknown> 안전 변환 */
function asRecord(val: unknown): Record<string, unknown> | null {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return val as Record<string, unknown>
  }
  return null
}

/** unknown → number (NaN이면 fallback) */
function toNumber(val: unknown, fallback: number): number {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

/** unknown → string | null */
function toStringOrNull(val: unknown): string | null {
  return typeof val === 'string' && val.length > 0 ? val : null
}

// ─── Firecrawl Scrape → Layer1Data + markdownContent ───

function parseFirecrawlScrape(raw: unknown): {
  layer1: Layer1Data | null
  markdownContent: string | null
} {
  const obj = asRecord(raw)
  if (!obj) return { layer1: null, markdownContent: null }

  // Firecrawl v1 응답: { success, data: { markdown, html, metadata, ... } }
  const data = asRecord(obj.data) ?? obj
  const metadata = asRecord(data.metadata)

  const markdownContent = toStringOrNull(data.markdown)

  if (!metadata) {
    return { layer1: null, markdownContent }
  }

  // og 태그 추출
  const og: Record<string, string> = {}
  if (metadata.ogTitle) og.title = String(metadata.ogTitle)
  if (metadata.ogDescription) og.description = String(metadata.ogDescription)
  if (metadata.ogImage) og.image = String(metadata.ogImage)
  if (metadata.ogUrl) og.url = String(metadata.ogUrl)

  const layer1: Layer1Data = {
    meta: {
      title: toStringOrNull(metadata.title),
      description: toStringOrNull(metadata.description),
      canonical: toStringOrNull(metadata.canonical),
      charset: toStringOrNull(metadata.charset) ?? 'utf-8',
      viewport: toStringOrNull(metadata.viewport),
      og,
      robots_meta: toStringOrNull(metadata.robots),
    },
    headings: {
      h1: toStringArray(metadata.h1),
      h2: toStringArray(metadata.h2),
      h3: toStringArray(metadata.h3),
      h4: [],
      h5: [],
      h6: [],
    },
    schema_markup: Array.isArray(metadata.jsonLd) ? metadata.jsonLd : [],
    links: {
      internal: toNumber(metadata.internalLinks, 0),
      external: toNumber(metadata.externalLinks, 0),
      broken: [],
    },
    images: {
      total: toNumber(metadata.imageCount, 0),
      without_alt: toNumber(metadata.imagesWithoutAlt, 0),
      large_images: [],
    },
    page_size_bytes: toNumber(metadata.pageSize, 0),
    load_time_ms: toNumber(metadata.loadTime, 0),
    html_lang: toStringOrNull(metadata.language),
  }

  return { layer1, markdownContent }
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.filter((item): item is string => typeof item === 'string')
  }
  if (typeof val === 'string' && val.length > 0) return [val]
  return []
}

// ─── Firecrawl Map → siteUrls ───

function parseFirecrawlMap(raw: unknown): string[] | null {
  const obj = asRecord(raw)
  if (!obj) return null

  // Firecrawl map 응답: { success, links: string[] }
  const links = obj.links ?? obj.urls
  if (Array.isArray(links)) {
    return links.filter((u): u is string => typeof u === 'string')
  }
  return null
}

// ─── PageSpeed Insights → Layer2Data.pagespeed ───

function parsePageSpeed(raw: unknown): Layer2Data['pagespeed'] {
  const obj = asRecord(raw)
  if (!obj) return null

  const lighthouse = asRecord(obj.lighthouseResult)
  if (!lighthouse) return null

  const categories = asRecord(lighthouse.categories)
  const perf = asRecord(categories?.performance)
  const audits = asRecord(lighthouse.audits)

  if (!perf || !audits) return null

  const getAuditNumericValue = (key: string): number => {
    const audit = asRecord((audits as Record<string, unknown>)[key])
    return toNumber(audit?.numericValue, 0)
  }

  return {
    performance_score: Math.round(toNumber(perf.score, 0) * 100),
    lcp_ms: Math.round(getAuditNumericValue('largest-contentful-paint')),
    fid_ms: Math.round(getAuditNumericValue('max-potential-fid')),
    cls: Number(getAuditNumericValue('cumulative-layout-shift').toFixed(3)),
    ttfb_ms: Math.round(getAuditNumericValue('server-response-time')),
  }
}

// ─── SSL Labs → Layer3Data.ssl ───

function parseSslLabs(raw: unknown): Layer3Data['ssl'] {
  const obj = asRecord(raw)
  if (!obj) return null

  // status가 READY가 아니면 유효하지 않음
  if (obj.status !== 'READY') return null

  const endpoints = Array.isArray(obj.endpoints) ? obj.endpoints : []
  const firstEndpoint = asRecord(endpoints[0])

  const certs = Array.isArray(obj.certs) ? obj.certs : []
  const firstCert = asRecord(certs[0])

  // 프로토콜 추출
  const protocols: string[] = []
  const details = asRecord(firstEndpoint?.details)
  const protoList = Array.isArray(details?.protocols) ? details.protocols : []
  for (const p of protoList) {
    const proto = asRecord(p)
    if (proto?.name && proto?.version) {
      protocols.push(`${proto.name} ${proto.version}`)
    }
  }

  // 인증서 만료일 (SSL Labs는 밀리초 타임스탬프)
  let expiresAt: string | null = null
  let valid = false
  if (firstCert) {
    const notAfter = toNumber(firstCert.notAfter, 0)
    if (notAfter > 0) {
      expiresAt = new Date(notAfter).toISOString()
      valid = notAfter > Date.now()
    }
  }

  // 발급기관
  const issuer =
    toStringOrNull(firstCert?.issuerLabel) ??
    toStringOrNull(firstCert?.issuerSubject) ??
    null

  return {
    grade: toStringOrNull(firstEndpoint?.grade),
    valid,
    expires_at: expiresAt,
    issuer,
    protocols,
  }
}

// ─── Mozilla Observatory → Layer3Data.observatory ───

function parseObservatory(raw: unknown): Layer3Data['observatory'] {
  const obj = asRecord(raw)
  if (!obj) return null

  // v2 API 응답 구조: { scan: { grade, score, state }, tests: { ... } }
  // v1 API 응답 구조: { state, grade, score, tests_passed, ... }
  const scan = asRecord(obj.scan) ?? obj

  const grade = toStringOrNull(scan.grade)
  const score = typeof scan.score === 'number' ? scan.score : null

  // v2: tests 객체에서 fail 항목 추출
  const issues: string[] = []
  const tests = asRecord(obj.tests) ?? asRecord(scan.tests)
  if (tests) {
    for (const [key, val] of Object.entries(tests)) {
      const test = asRecord(val)
      if (test && (test.pass === false || test.result === 'fail')) {
        issues.push(typeof test.name === 'string' ? test.name : key)
      }
    }
  }

  if (grade === null && score === null) return null

  return { grade, score, issues }
}

// ─── Basic fetch (robots, sitemap, llms) → raw body 추출 ───

function extractRawBody(raw: unknown): string | null {
  const obj = asRecord(raw)
  if (!obj) return typeof raw === 'string' ? raw : null

  // n8n fullResponse: { body, statusCode, headers }
  if (typeof obj.body === 'string') {
    const status = toNumber(obj.statusCode, 200)
    return status < 400 ? obj.body : null
  }

  // 직접 데이터가 문자열인 경우
  if (typeof obj.data === 'string') return obj.data

  return null
}

// ─── 메인: parseCrawlV2Result ───

/**
 * n8n v2 워크플로우의 raw crawlResult를 CrawlData 구조로 정규화
 *
 * 10개 소스의 결과를 CrawlData 인터페이스에 매핑:
 * - firecrawl_scrape → layer1 + markdownContent
 * - firecrawl_map → siteUrls
 * - pagespeed_mobile → layer2.pagespeed
 * - ssl_labs → layer3.ssl
 * - observatory → layer3.observatory
 * - robots_txt → robots_txt (기존 parseRobotsTxt 재사용)
 * - sitemap_xml → sitemap (기존 parseSitemap 재사용)
 * - llms_txt + llms_full_txt → llms_txt (기존 parseLlmsTxt 재사용)
 *
 * v2에서 null 처리되는 필드:
 * - layer2.crux, layer2.safe_browsing (n8n에서 미수집)
 * - cms, mobile (Playwright 전용 — n8n 워크플로우에서 미실행)
 */
export function parseCrawlV2Result(params: ParseCrawlV2Params): CrawlData {
  const { crawlResult, dataCompleteness, failedSources } = params

  // 각 소스 추출
  const firecrawlScrapeRaw = crawlResult.firecrawl_scrape
  const firecrawlMapRaw = crawlResult.firecrawl_map
  const pagespeedMobileRaw = crawlResult.pagespeed_mobile
  const sslLabsRaw = crawlResult.ssl_labs
  const observatoryRaw = crawlResult.observatory
  const robotsTxtRaw = crawlResult.robots_txt
  const sitemapXmlRaw = crawlResult.sitemap_xml
  const llmsTxtRaw = crawlResult.llms_txt
  const llmsFullTxtRaw = crawlResult.llms_full_txt

  // Firecrawl
  const { layer1, markdownContent } = parseFirecrawlScrape(firecrawlScrapeRaw)
  const siteUrls = parseFirecrawlMap(firecrawlMapRaw)
  const firecrawlUsed = layer1 !== null || markdownContent !== null

  // Layer 2: PageSpeed (모바일 기준)
  const pagespeed = parsePageSpeed(pagespeedMobileRaw)
  const layer2: Layer2Data = {
    pagespeed,
    crux: null,
    safe_browsing: null,
  }

  // Layer 3: SSL + Observatory
  const ssl = parseSslLabs(sslLabsRaw)
  const observatory = parseObservatory(observatoryRaw)
  const layer3: Layer3Data = { ssl, observatory }

  // Basic fetch: 기존 파서 재사용
  const robotsRawBody = extractRawBody(robotsTxtRaw)
  const robotsTxt = parseRobotsTxt(robotsRawBody)

  const sitemapRawBody = extractRawBody(sitemapXmlRaw)
  const sitemap = parseSitemap(sitemapRawBody)

  const llmsRawBody = extractRawBody(llmsTxtRaw)
  const llmsTxt = parseLlmsTxt(llmsRawBody)

  // llms-full.txt 존재 여부 확인
  const llmsFullObj = asRecord(llmsFullTxtRaw)
  const llmsFullStatus = toNumber(llmsFullObj?.statusCode, 404)
  if (llmsTxt) {
    llmsTxt.hasFullVersion = llmsFullStatus < 400
  }

  // is_partial: dataCompleteness 30% 미만
  const isPartial = dataCompleteness < 30

  // blocked_reason: Firecrawl + PageSpeed 둘 다 실패 시
  let blockedReason: string | undefined
  if (
    failedSources.includes('firecrawl_scrape') &&
    failedSources.includes('pagespeed_mobile')
  ) {
    blockedReason = 'robots.txt 또는 방화벽에 의해 크롤링이 제한되었습니다'
  }

  return {
    crawled_at: new Date().toISOString(),
    duration_ms: 0, // n8n에서 별도 측정하지 않음 — 콜백 라우트에서 계산
    is_partial: isPartial,
    blocked_reason: blockedReason,
    layer1,
    robots_txt: robotsTxt,
    sitemap,
    llms_txt: llmsTxt,
    cms: null,
    mobile: null,
    layer2: layer2.pagespeed ? layer2 : null,
    layer3: layer3.ssl || layer3.observatory ? layer3 : null,
    markdownContent,
    siteUrls,
    firecrawlUsed,
  }
}
