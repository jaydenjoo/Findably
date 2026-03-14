import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchCrux } from '../crux'

// ─── config mock ───
const mockConfig = { googleApiKey: 'test-api-key' }
vi.mock('@/config/crawling', () => ({
  crawlingConfig: new Proxy({} as Record<string, unknown>, {
    get: (_target, prop: string) =>
      (mockConfig as Record<string, unknown>)[prop],
  }),
}))

// ─── 테스트 헬퍼: 정상 CrUX API 응답 생성 ───
function createValidResponse(overrides?: {
  lcp?: number
  inp?: number
  cls?: string
  ttfb?: number
  fcp?: number
  firstDate?: { year: number; month: number; day: number }
  lastDate?: { year: number; month: number; day: number }
}) {
  return {
    record: {
      key: { origin: 'https://example.com' },
      metrics: {
        largest_contentful_paint: {
          histogram: [
            { start: 0, end: 2500, density: 0.85 },
            { start: 2500, end: 4000, density: 0.1 },
            { start: 4000, density: 0.05 },
          ],
          percentiles: { p75: overrides?.lcp ?? 2500 },
        },
        interaction_to_next_paint: {
          histogram: [
            { start: 0, end: 200, density: 0.9 },
            { start: 200, end: 500, density: 0.08 },
            { start: 500, density: 0.02 },
          ],
          percentiles: { p75: overrides?.inp ?? 180 },
        },
        cumulative_layout_shift: {
          histogram: [
            { start: '0.00', end: '0.10', density: 0.88 },
            { start: '0.10', end: '0.25', density: 0.09 },
            { start: '0.25', density: 0.03 },
          ],
          percentiles: { p75: overrides?.cls ?? '0.12' },
        },
        experimental_time_to_first_byte: {
          histogram: [
            { start: 0, end: 800, density: 0.7 },
            { start: 800, end: 1800, density: 0.2 },
            { start: 1800, density: 0.1 },
          ],
          percentiles: { p75: overrides?.ttfb ?? 650 },
        },
        first_contentful_paint: {
          histogram: [
            { start: 0, end: 1800, density: 0.8 },
            { start: 1800, end: 3000, density: 0.15 },
            { start: 3000, density: 0.05 },
          ],
          percentiles: { p75: overrides?.fcp ?? 1200 },
        },
      },
      collectionPeriod: {
        firstDate: overrides?.firstDate ?? { year: 2026, month: 2, day: 14 },
        lastDate: overrides?.lastDate ?? { year: 2026, month: 3, day: 13 },
      },
    },
  }
}

describe('fetchCrux', () => {
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

      const result = await fetchCrux('https://example.com')

      expect(result).toBeNull()
    })

    it('정상 응답 → CruxData 반환', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createValidResponse()),
      })

      const result = await fetchCrux('https://example.com')

      expect(result).toEqual({
        lcp_ms: 2500,
        inp_ms: 180,
        cls: 0.12,
        ttfb_ms: 650,
        fcp_ms: 1200,
        form_factors: null,
        collection_period: {
          first_date: '2026-02-14',
          last_date: '2026-03-13',
        },
      })
    })

    it('URL에서 origin만 추출하여 요청', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createValidResponse()),
      })

      await fetchCrux('https://example.com/deep/path?q=search')

      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      const body = JSON.parse(call[1].body as string) as Record<string, unknown>
      expect(body['origin']).toBe('https://example.com')
    })
  })

  // ─── 에러 처리 ───

  describe('에러 처리', () => {
    it('HTTP 404 (데이터 없음) → null (console.error 없음)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      const result = await fetchCrux('https://example.com')

      expect(result).toBeNull()
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('HTTP 400 → null + console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      })

      const result = await fetchCrux('https://example.com')

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

      const result = await fetchCrux('https://example.com')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP 500')
      )
    })

    it('네트워크 에러 → null', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await fetchCrux('https://example.com')

      expect(result).toBeNull()
    })
  })

  // ─── 응답 파싱 ───

  describe('응답 파싱', () => {
    it('record.metrics 누락 → null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ record: { key: {} } }),
      })

      const result = await fetchCrux('https://example.com')

      expect(result).toBeNull()
    })

    it('일부 메트릭 누락 → null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            record: {
              key: { origin: 'https://example.com' },
              metrics: {
                largest_contentful_paint: {
                  percentiles: { p75: 2500 },
                },
                // interaction_to_next_paint 누락
                cumulative_layout_shift: {
                  percentiles: { p75: '0.05' },
                },
                experimental_time_to_first_byte: {
                  percentiles: { p75: 400 },
                },
                first_contentful_paint: {
                  percentiles: { p75: 1000 },
                },
              },
              collectionPeriod: {
                firstDate: { year: 2026, month: 2, day: 14 },
                lastDate: { year: 2026, month: 3, day: 13 },
              },
            },
          }),
      })

      const result = await fetchCrux('https://example.com')

      expect(result).toBeNull()
    })

    it('CLS 문자열 → 숫자 변환 확인', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createValidResponse({ cls: '0.0043' })),
      })

      const result = await fetchCrux('https://example.com')

      expect(result?.cls).toBe(0.004)
    })

    it('실제 CrUX API 응답 구조 → 정상 파싱', async () => {
      const realisticResponse = {
        record: {
          key: {
            origin: 'https://example.com',
          },
          metrics: {
            largest_contentful_paint: {
              histogram: [
                { start: 0, end: 2500, density: 0.8721 },
                { start: 2500, end: 4000, density: 0.0834 },
                { start: 4000, density: 0.0445 },
              ],
              percentiles: { p75: 1893 },
            },
            interaction_to_next_paint: {
              histogram: [
                { start: 0, end: 200, density: 0.9234 },
                { start: 200, end: 500, density: 0.0521 },
                { start: 500, density: 0.0245 },
              ],
              percentiles: { p75: 92 },
            },
            cumulative_layout_shift: {
              histogram: [
                { start: '0.00', end: '0.10', density: 0.9012 },
                { start: '0.10', end: '0.25', density: 0.0678 },
                { start: '0.25', density: 0.031 },
              ],
              percentiles: { p75: '0.04' },
            },
            experimental_time_to_first_byte: {
              histogram: [
                { start: 0, end: 800, density: 0.7891 },
                { start: 800, end: 1800, density: 0.1567 },
                { start: 1800, density: 0.0542 },
              ],
              percentiles: { p75: 589 },
            },
            first_contentful_paint: {
              histogram: [
                { start: 0, end: 1800, density: 0.8456 },
                { start: 1800, end: 3000, density: 0.1123 },
                { start: 3000, density: 0.0421 },
              ],
              percentiles: { p75: 1234 },
            },
          },
          collectionPeriod: {
            firstDate: { year: 2026, month: 2, day: 14 },
            lastDate: { year: 2026, month: 3, day: 13 },
          },
        },
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(realisticResponse),
      })

      const result = await fetchCrux('https://example.com')

      expect(result).toEqual({
        lcp_ms: 1893,
        inp_ms: 92,
        cls: 0.04,
        ttfb_ms: 589,
        fcp_ms: 1234,
        form_factors: null,
        collection_period: {
          first_date: '2026-02-14',
          last_date: '2026-03-13',
        },
      })
    })
  })

  // ─── 엣지 케이스 ───

  describe('엣지 케이스', () => {
    it('form_factors 미포함 → form_factors: null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createValidResponse()),
      })

      const result = await fetchCrux('https://example.com')

      expect(result).not.toBeNull()
      expect(result?.form_factors).toBeNull()
    })

    it('매우 큰 INP 값 → 그대로 반환', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createValidResponse({ inp: 8500 })),
      })

      const result = await fetchCrux('https://example.com')

      expect(result?.inp_ms).toBe(8500)
    })

    it('URL에 path 포함 → origin만 추출하여 요청', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createValidResponse()),
      })

      await fetchCrux('https://shop.example.com/products/123?ref=main')

      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      const body = JSON.parse(call[1].body as string) as Record<string, unknown>
      expect(body['origin']).toBe('https://shop.example.com')
    })
  })

  // ─── 타임아웃 ───

  describe('타임아웃', () => {
    it('AbortError → null + console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(
          new DOMException('The operation was aborted.', 'AbortError')
        )

      const result = await fetchCrux('https://example.com')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timeout')
      )
    })
  })

  // ─── POST 요청 확인 ───

  describe('요청 형식', () => {
    it('POST 메서드로 요청', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createValidResponse()),
      })

      await fetchCrux('https://example.com')

      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
      expect(call[1].method).toBe('POST')
      expect(call[1].headers).toEqual({ 'Content-Type': 'application/json' })
    })
  })
})
