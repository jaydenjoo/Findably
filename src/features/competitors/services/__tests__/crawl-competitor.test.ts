import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { crawlCompetitor } from '../crawl-competitor'

// crawlingConfig mock
vi.mock('@/config/crawling', () => ({
  crawlingConfig: { googleApiKey: 'test-api-key' },
}))

const MOCK_PAGESPEED_RESPONSE = {
  lighthouseResult: {
    categories: {
      performance: { score: 0.85 },
      accessibility: { score: 0.92 },
      seo: { score: 0.78 },
      'best-practices': { score: 0.88 },
    },
    audits: {
      'largest-contentful-paint': { numericValue: 2500 },
      'max-potential-fid': { numericValue: 120 },
      'cumulative-layout-shift': { numericValue: 0.05 },
      'server-response-time': { numericValue: 380 },
    },
  },
}

describe('crawlCompetitor', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(MOCK_PAGESPEED_RESPONSE), { status: 200 })
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return parsed PageSpeed results', async () => {
    const result = await crawlCompetitor('https://competitor.com')

    expect(result.url).toBe('https://competitor.com')
    expect(result.performance).toBe(85)
    expect(result.accessibility).toBe(92)
    expect(result.seo).toBe(78)
    expect(result.bestPractices).toBe(88)
    expect(result.coreWebVitals.lcp).toBe(2500)
    expect(result.coreWebVitals.cls).toBe(0.05)
    expect(result.mobile).toBe(true)
    expect(result.error).toBeNull()
  })

  it('should return error result on HTTP failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 })
    )

    const result = await crawlCompetitor('https://broken.com')

    expect(result.error).toBe('HTTP 404')
    expect(result.performance).toBeNull()
  })

  it('should return error result on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const result = await crawlCompetitor('https://offline.com')

    expect(result.error).toBe('Network error')
    expect(result.performance).toBeNull()
  })

  it('should handle missing categories gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          lighthouseResult: {
            categories: { performance: { score: 0.7 } },
            audits: {},
          },
        }),
        { status: 200 }
      )
    )

    const result = await crawlCompetitor('https://partial.com')

    expect(result.performance).toBe(70)
    expect(result.accessibility).toBeNull()
    expect(result.seo).toBeNull()
    expect(result.error).toBeNull()
  })

  it('should handle missing API key', async () => {
    // crawlingConfig는 이미 vi.mock으로 모킹됨 — 직접 프로퍼티 변경
    const { crawlingConfig } = await import('@/config/crawling')
    const original = crawlingConfig.googleApiKey
    Object.defineProperty(crawlingConfig, 'googleApiKey', {
      value: '',
      writable: true,
    })

    const result = await crawlCompetitor('https://example.com')

    expect(result.error).toBe('GOOGLE_API_KEY 환경변수 미설정')

    // 복원
    Object.defineProperty(crawlingConfig, 'googleApiKey', {
      value: original,
      writable: true,
    })
  })
})
