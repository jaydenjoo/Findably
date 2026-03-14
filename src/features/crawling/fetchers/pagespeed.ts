import { crawlingConfig } from '@/config/crawling'
import type { Layer2Data } from '../types'

type PageSpeedData = NonNullable<Layer2Data['pagespeed']>

/** PageSpeed Insights API 타임아웃 (ms) — 분석 특성상 느림 */
const PAGESPEED_TIMEOUT_MS = 30_000

/** PageSpeed Insights API v5 베이스 URL */
const PAGESPEED_API_URL =
  'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

/**
 * Google PageSpeed Insights API를 호출하여 성능 지표를 수집.
 *
 * @param url - 분석할 페이지 URL
 * @returns PageSpeedData | null (API 키 미설정, 에러, 타임아웃 시 null)
 */
export async function fetchPageSpeed(
  url: string
): Promise<PageSpeedData | null> {
  const apiKey = crawlingConfig.googleApiKey
  if (!apiKey) {
    return null
  }

  const params = new URLSearchParams({
    url,
    key: apiKey,
    category: 'performance',
    strategy: 'mobile',
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PAGESPEED_TIMEOUT_MS)

  try {
    const response = await fetch(`${PAGESPEED_API_URL}?${params.toString()}`, {
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(`[fetchPageSpeed] HTTP ${response.status} for ${url}`)
      return null
    }

    const json: unknown = await response.json()
    return parsePageSpeedResponse(json)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(
        `[fetchPageSpeed] Timeout after ${PAGESPEED_TIMEOUT_MS}ms for ${url}`
      )
    } else {
      console.error('[fetchPageSpeed]', error)
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * PageSpeed API 응답 JSON에서 필요한 필드를 추출.
 * 필드 하나라도 누락 시 null 반환.
 */
function parsePageSpeedResponse(json: unknown): PageSpeedData | null {
  if (typeof json !== 'object' || json === null) {
    return null
  }

  const root = json as Record<string, unknown>
  const lighthouse = root['lighthouseResult']
  if (typeof lighthouse !== 'object' || lighthouse === null) {
    return null
  }

  const lh = lighthouse as Record<string, unknown>

  // ─── performance score ───
  const categories = lh['categories']
  if (typeof categories !== 'object' || categories === null) {
    return null
  }
  const perf = (categories as Record<string, unknown>)['performance']
  if (typeof perf !== 'object' || perf === null) {
    return null
  }
  const rawScore = (perf as Record<string, unknown>)['score']
  if (typeof rawScore !== 'number') {
    return null
  }

  // ─── audits ───
  const audits = lh['audits']
  if (typeof audits !== 'object' || audits === null) {
    return null
  }
  const auditsMap = audits as Record<string, unknown>

  const lcp = extractAuditNumericValue(auditsMap, 'largest-contentful-paint')
  const fid = extractAuditNumericValue(auditsMap, 'max-potential-fid')
  const cls = extractAuditNumericValue(auditsMap, 'cumulative-layout-shift')
  const ttfb = extractAuditNumericValue(auditsMap, 'server-response-time')

  if (lcp === null || fid === null || cls === null || ttfb === null) {
    return null
  }

  return {
    performance_score: Math.round(rawScore * 100),
    lcp_ms: Math.round(lcp),
    fid_ms: Math.round(fid),
    cls: Number(cls.toFixed(3)),
    ttfb_ms: Math.round(ttfb),
  }
}

/** audit 항목에서 numericValue 추출 */
function extractAuditNumericValue(
  audits: Record<string, unknown>,
  auditId: string
): number | null {
  const audit = audits[auditId]
  if (typeof audit !== 'object' || audit === null) {
    return null
  }
  const value = (audit as Record<string, unknown>)['numericValue']
  if (typeof value !== 'number') {
    return null
  }
  return value
}
