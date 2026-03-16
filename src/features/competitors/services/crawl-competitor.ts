import { crawlingConfig } from '@/config/crawling'
import type { CompetitorCrawlResult } from '../types'
import { PAGESPEED_TIMEOUT_MS } from '../constants'

/** PageSpeed Insights API v5 베이스 URL */
const PAGESPEED_API_URL =
  'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

/** Lighthouse 카테고리 ID */
const LIGHTHOUSE_CATEGORIES = [
  'performance',
  'accessibility',
  'seo',
  'best-practices',
] as const

/**
 * 경쟁사 1개에 대해 PageSpeed API로 정량 메트릭 수집.
 * 실패 시에도 error 필드에 기록하고 결과 반환 (전체 중단 안 함).
 */
export async function crawlCompetitor(
  url: string
): Promise<CompetitorCrawlResult> {
  const apiKey = crawlingConfig.googleApiKey
  if (!apiKey) {
    return makeErrorResult(url, 'GOOGLE_API_KEY 환경변수 미설정')
  }

  const params = new URLSearchParams({
    url,
    key: apiKey,
    strategy: 'mobile',
  })

  // 4개 카테고리 전부 요청
  for (const cat of LIGHTHOUSE_CATEGORIES) {
    params.append('category', cat)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PAGESPEED_TIMEOUT_MS)

  try {
    const response = await fetch(`${PAGESPEED_API_URL}?${params.toString()}`, {
      signal: controller.signal,
    })

    if (!response.ok) {
      return makeErrorResult(url, `HTTP ${response.status}`)
    }

    const json: unknown = await response.json()
    return parseResponse(url, json)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return makeErrorResult(url, `타임아웃 (${PAGESPEED_TIMEOUT_MS}ms)`)
    }
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return makeErrorResult(url, message)
  } finally {
    clearTimeout(timeout)
  }
}

/** API 응답 파싱 → CompetitorCrawlResult */
function parseResponse(url: string, json: unknown): CompetitorCrawlResult {
  if (typeof json !== 'object' || json === null) {
    return makeErrorResult(url, '응답 파싱 실패')
  }

  const root = json as Record<string, unknown>
  const lighthouse = root['lighthouseResult']
  if (typeof lighthouse !== 'object' || lighthouse === null) {
    return makeErrorResult(url, 'lighthouseResult 누락')
  }

  const lh = lighthouse as Record<string, unknown>
  const categories = lh['categories']
  if (typeof categories !== 'object' || categories === null) {
    return makeErrorResult(url, 'categories 누락')
  }

  const cats = categories as Record<string, unknown>

  // 카테고리별 점수 추출
  const performance = extractCategoryScore(cats, 'performance')
  const accessibility = extractCategoryScore(cats, 'accessibility')
  const seo = extractCategoryScore(cats, 'seo')
  const bestPractices = extractCategoryScore(cats, 'best-practices')

  // Core Web Vitals
  const audits = lh['audits']
  const auditsMap =
    typeof audits === 'object' && audits !== null
      ? (audits as Record<string, unknown>)
      : null

  return {
    url,
    performance,
    accessibility,
    seo,
    bestPractices,
    coreWebVitals: {
      lcp: auditsMap
        ? extractAuditValue(auditsMap, 'largest-contentful-paint')
        : null,
      fid: auditsMap ? extractAuditValue(auditsMap, 'max-potential-fid') : null,
      cls: auditsMap
        ? extractAuditValue(auditsMap, 'cumulative-layout-shift')
        : null,
      ttfb: auditsMap
        ? extractAuditValue(auditsMap, 'server-response-time')
        : null,
    },
    mobile: true,
    crawledAt: new Date().toISOString(),
    error: null,
  }
}

/** 카테고리 점수 추출 (0-100) */
function extractCategoryScore(
  categories: Record<string, unknown>,
  categoryId: string
): number | null {
  const cat = categories[categoryId]
  if (typeof cat !== 'object' || cat === null) return null

  const score = (cat as Record<string, unknown>)['score']
  if (typeof score !== 'number') return null

  return Math.round(score * 100)
}

/** audit numericValue 추출 */
function extractAuditValue(
  audits: Record<string, unknown>,
  auditId: string
): number | null {
  const audit = audits[auditId]
  if (typeof audit !== 'object' || audit === null) return null

  const value = (audit as Record<string, unknown>)['numericValue']
  if (typeof value !== 'number') return null

  return Number(value.toFixed(3))
}

/** 에러 결과 생성 헬퍼 */
function makeErrorResult(url: string, error: string): CompetitorCrawlResult {
  return {
    url,
    performance: null,
    accessibility: null,
    seo: null,
    bestPractices: null,
    coreWebVitals: { lcp: null, fid: null, cls: null, ttfb: null },
    mobile: true,
    crawledAt: new Date().toISOString(),
    error,
  }
}
