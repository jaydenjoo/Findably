import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchPageSpeed } from '../pagespeed'

// ─── config mock ───
const mockConfig = { googleApiKey: 'test-api-key' }
vi.mock('@/config/crawling', () => ({
  crawlingConfig: new Proxy({} as Record<string, unknown>, {
    get: (_target, prop: string) =>
      (mockConfig as Record<string, unknown>)[prop],
  }),
}))

// ─── 테스트 헬퍼: 정상 API 응답 생성 ───
function createValidResponse(overrides?: {
  score?: number
  lcp?: number
  fid?: number
  cls?: number
  ttfb?: number
}) {
  return {
    lighthouseResult: {
      categories: {
        performance: {
          score: overrides?.score ?? 0.85,
        },
      },
      audits: {
        'largest-contentful-paint': {
          numericValue: overrides?.lcp ?? 2500,
        },
        'max-potential-fid': {
          numericValue: overrides?.fid ?? 130,
        },
        'cumulative-layout-shift': {
          numericValue: overrides?.cls ?? 0.12,
        },
        'server-response-time': {
          numericValue: overrides?.ttfb ?? 450,
        },
      },
    },
  }
}

describe('fetchPageSpeed', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    mockConfig.googleApiKey = 'test-api-key'
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  // ─── 기본 동작 ───

  describe('기본 동작', () => {
    it('API 키 없음 → null 반환', async () => {
      mockConfig.googleApiKey = ''

      const result = await fetchPageSpeed('https://example.com')

      expect(result).toBeNull()
    })

    it('정상 응답 → PageSpeedData 반환', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createValidResponse()),
      })

      const result = await fetchPageSpeed('https://example.com')

      expect(result).toEqual({
        performance_score: 85,
        lcp_ms: 2500,
        fid_ms: 130,
        cls: 0.12,
        ttfb_ms: 450,
      })
    })

    it('score 0~1 → 0~100 정수 변환', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createValidResponse({ score: 0.47 })),
      })

      const result = await fetchPageSpeed('https://example.com')

      expect(result?.performance_score).toBe(47)
    })
  })

  // ─── 에러 처리 ───

  describe('에러 처리', () => {
    it('HTTP 400 → null + console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      })

      const result = await fetchPageSpeed('https://example.com')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP 400')
      )
    })

    it('HTTP 500 → null + console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })

      const result = await fetchPageSpeed('https://example.com')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP 500')
      )
    })

    it('네트워크 에러 (fetch 실패) → null', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await fetchPageSpeed('https://example.com')

      expect(result).toBeNull()
    })

    it('타임아웃 → null + console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      globalThis.fetch = vi.fn().mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(
                new DOMException('The operation was aborted.', 'AbortError')
              )
            })
          })
      )

      // 짧은 타임아웃을 위해 직접 abort 트리거
      // fetchPageSpeed 내부에서 30초 타임아웃 사용하므로, mock에서 즉시 abort
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(
          new DOMException('The operation was aborted.', 'AbortError')
        )

      const result = await fetchPageSpeed('https://example.com')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timeout')
      )
    })
  })

  // ─── 응답 파싱 ───

  describe('응답 파싱', () => {
    it('lighthouseResult 누락 → null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ someOtherField: true }),
      })

      const result = await fetchPageSpeed('https://example.com')

      expect(result).toBeNull()
    })

    it('audits 일부 누락 → null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            lighthouseResult: {
              categories: { performance: { score: 0.9 } },
              audits: {
                'largest-contentful-paint': { numericValue: 2000 },
                // max-potential-fid 누락
                'cumulative-layout-shift': { numericValue: 0.05 },
                'server-response-time': { numericValue: 300 },
              },
            },
          }),
      })

      const result = await fetchPageSpeed('https://example.com')

      expect(result).toBeNull()
    })

    it('실제 Google API 응답 구조 → 정상 파싱', async () => {
      // Google 실제 응답에는 다양한 추가 필드가 포함됨
      const realisticResponse = {
        captchaResult: 'CAPTCHA_NOT_NEEDED',
        kind: 'pagespeedonline#result',
        id: 'https://example.com',
        loadingExperience: { overall_category: 'FAST' },
        lighthouseResult: {
          requestedUrl: 'https://example.com',
          finalUrl: 'https://example.com',
          lighthouseVersion: '11.0.0',
          categories: {
            performance: {
              id: 'performance',
              title: 'Performance',
              score: 0.92,
            },
          },
          audits: {
            'largest-contentful-paint': {
              id: 'largest-contentful-paint',
              title: 'Largest Contentful Paint',
              numericValue: 1250.5,
              numericUnit: 'millisecond',
              displayValue: '1.3 s',
            },
            'max-potential-fid': {
              id: 'max-potential-fid',
              title: 'Max Potential First Input Delay',
              numericValue: 85.2,
              numericUnit: 'millisecond',
            },
            'cumulative-layout-shift': {
              id: 'cumulative-layout-shift',
              title: 'Cumulative Layout Shift',
              numericValue: 0.0043,
              numericUnit: 'unitless',
            },
            'server-response-time': {
              id: 'server-response-time',
              title: 'Initial server response time was short',
              numericValue: 189.7,
              numericUnit: 'millisecond',
            },
            // 다양한 추가 audit들...
            'first-contentful-paint': {
              numericValue: 800,
            },
            'total-blocking-time': {
              numericValue: 200,
            },
          },
        },
        analysisUTCTimestamp: '2026-03-14T10:00:00.000Z',
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(realisticResponse),
      })

      const result = await fetchPageSpeed('https://example.com')

      expect(result).toEqual({
        performance_score: 92,
        lcp_ms: 1251,
        fid_ms: 85,
        cls: 0.004,
        ttfb_ms: 190,
      })
    })
  })

  // ─── 엣지 케이스 ───

  describe('엣지 케이스', () => {
    it('score=0 → performance_score: 0 (null 아님)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createValidResponse({ score: 0 })),
      })

      const result = await fetchPageSpeed('https://example.com')

      expect(result).not.toBeNull()
      expect(result?.performance_score).toBe(0)
    })

    it('매우 큰 LCP 값 → 그대로 반환', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createValidResponse({ lcp: 45000 })),
      })

      const result = await fetchPageSpeed('https://example.com')

      expect(result?.lcp_ms).toBe(45000)
    })

    it('URL에 특수문자 포함 → 정상 인코딩', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createValidResponse()),
      })

      await fetchPageSpeed('https://example.com/path?q=한글&sort=asc')

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('url=https'),
        expect.any(Object)
      )
    })
  })
})
