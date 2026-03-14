import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchObservatory } from '../observatory'

// ─── fetch mock ───
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('fetchObservatory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** analyze + getScanResults 두 호출 한 번에 mock */
  const mockAnalyzeAndResults = (
    analyze: { ok: boolean; json?: () => Promise<unknown>; status?: number },
    results?: { ok: boolean; json?: () => Promise<unknown>; status?: number }
  ): void => {
    mockFetch.mockResolvedValueOnce(analyze)
    if (results) {
      mockFetch.mockResolvedValueOnce(results)
    }
  }

  // ─── 잘못된 URL ───

  it('should return null for invalid URL', async () => {
    const result = await fetchObservatory('not-a-url')
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // ─── 정상 결과 ───

  it('should return observatory data when scan is FINISHED', async () => {
    mockAnalyzeAndResults(
      {
        ok: true,
        json: async () => ({
          state: 'FINISHED',
          grade: 'A+',
          score: 100,
          scan_id: 123,
        }),
      },
      {
        ok: true,
        json: async () => ({
          'content-security-policy': {
            pass: true,
            score_description: 'CSP implemented',
          },
          'strict-transport-security': {
            pass: false,
            score_description: 'HSTS header not implemented',
          },
          'x-frame-options': {
            pass: false,
            score_description: 'X-Frame-Options header not set',
          },
        }),
      }
    )

    const result = await fetchObservatory('https://example.com')

    expect(result).not.toBeNull()
    expect(result!.grade).toBe('A+')
    expect(result!.score).toBe(100)
    expect(result!.issues).toHaveLength(2)
    expect(result!.issues).toContain('HSTS header not implemented')
    expect(result!.issues).toContain('X-Frame-Options header not set')
  })

  // ─── 스캔 미완료 ───

  it('should return null when scan state is PENDING', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: 'PENDING', scan_id: 456 }),
    })

    const result = await fetchObservatory('https://example.com')
    expect(result).toBeNull()
  })

  it('should return null when scan state is RUNNING', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: 'RUNNING', scan_id: 789 }),
    })

    const result = await fetchObservatory('https://example.com')
    expect(result).toBeNull()
  })

  // ─── scan_id 누락 ───

  it('should return null when scan_id is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: 'FINISHED', grade: 'B', score: 65 }),
    })

    const result = await fetchObservatory('https://example.com')
    expect(result).toBeNull()
  })

  it('should return null when scan_id is not a number', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        state: 'FINISHED',
        grade: 'B',
        score: 65,
        scan_id: 'abc',
      }),
    })

    const result = await fetchObservatory('https://example.com')
    expect(result).toBeNull()
  })

  // ─── getScanResults 실패 시 issues 빈 배열 ───

  it('should return empty issues when getScanResults fails', async () => {
    mockAnalyzeAndResults(
      {
        ok: true,
        json: async () => ({
          state: 'FINISHED',
          grade: 'C',
          score: 45,
          scan_id: 100,
        }),
      },
      { ok: false, status: 500 }
    )

    const result = await fetchObservatory('https://example.com')

    expect(result).not.toBeNull()
    expect(result!.grade).toBe('C')
    expect(result!.score).toBe(45)
    expect(result!.issues).toEqual([])
  })

  // ─── grade/score 누락 ───

  it('should handle missing grade and score', async () => {
    mockAnalyzeAndResults(
      {
        ok: true,
        json: async () => ({
          state: 'FINISHED',
          scan_id: 200,
        }),
      },
      {
        ok: true,
        json: async () => ({}),
      }
    )

    const result = await fetchObservatory('https://example.com')

    expect(result).not.toBeNull()
    expect(result!.grade).toBeNull()
    expect(result!.score).toBeNull()
    expect(result!.issues).toEqual([])
  })

  // ─── 방어적 파싱 ───

  it('should return null for null analyze response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    })

    const result = await fetchObservatory('https://example.com')
    expect(result).toBeNull()
  })

  it('should ignore non-object test results', async () => {
    mockAnalyzeAndResults(
      {
        ok: true,
        json: async () => ({
          state: 'FINISHED',
          grade: 'B',
          score: 70,
          scan_id: 300,
        }),
      },
      {
        ok: true,
        json: async () => ({
          'test-1': null,
          'test-2': 'string-value',
          'test-3': { pass: false, score_description: 'Valid issue' },
        }),
      }
    )

    const result = await fetchObservatory('https://example.com')

    expect(result!.issues).toEqual(['Valid issue'])
  })

  it('should ignore failed tests without score_description', async () => {
    mockAnalyzeAndResults(
      {
        ok: true,
        json: async () => ({
          state: 'FINISHED',
          grade: 'D',
          score: 30,
          scan_id: 400,
        }),
      },
      {
        ok: true,
        json: async () => ({
          'test-1': { pass: false },
          'test-2': { pass: false, score_description: '' },
          'test-3': { pass: false, score_description: 'Missing CSP' },
        }),
      }
    )

    const result = await fetchObservatory('https://example.com')

    expect(result!.issues).toEqual(['Missing CSP'])
  })

  it('should handle null getScanResults response body', async () => {
    mockAnalyzeAndResults(
      {
        ok: true,
        json: async () => ({
          state: 'FINISHED',
          grade: 'A',
          score: 90,
          scan_id: 500,
        }),
      },
      {
        ok: true,
        json: async () => null,
      }
    )

    const result = await fetchObservatory('https://example.com')

    expect(result!.issues).toEqual([])
  })

  // ─── HTTP 에러 ───

  it('should return null on HTTP error for analyze', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const result = await fetchObservatory('https://example.com')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[fetchObservatory] HTTP 500 for example.com'
    )
  })

  // ─── 타임아웃 ───

  it('should return null on timeout (AbortError)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

    const result = await fetchObservatory('https://slow-site.com')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[fetchObservatory] Timeout after 15000ms for slow-site.com'
    )
  })

  // ─── 네트워크 에러 ───

  it('should return null on network error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const result = await fetchObservatory('https://example.com')
    expect(result).toBeNull()
  })

  // ─── 요청 형식 검증 ───

  it('should send correct analyze request', async () => {
    mockAnalyzeAndResults(
      {
        ok: true,
        json: async () => ({
          state: 'FINISHED',
          grade: 'A',
          score: 90,
          scan_id: 600,
        }),
      },
      {
        ok: true,
        json: async () => ({}),
      }
    )

    await fetchObservatory('https://www.example.com/path')

    const [analyzeUrl, analyzeOptions] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ]

    expect(analyzeUrl).toContain('http-observatory.security.mozilla.org')
    expect(analyzeUrl).toContain('host=www.example.com')
    expect(analyzeOptions.method).toBe('POST')
    expect(analyzeOptions.body).toBe('hidden=true&rescan=false')
    expect(analyzeOptions.signal).toBeInstanceOf(AbortSignal)
  })

  it('should call getScanResults with correct scan_id', async () => {
    mockAnalyzeAndResults(
      {
        ok: true,
        json: async () => ({
          state: 'FINISHED',
          grade: 'A',
          score: 90,
          scan_id: 999,
        }),
      },
      {
        ok: true,
        json: async () => ({}),
      }
    )

    await fetchObservatory('https://example.com')

    expect(mockFetch).toHaveBeenCalledTimes(2)
    const [resultsUrl] = mockFetch.mock.calls[1] as [string, RequestInit]
    expect(resultsUrl).toContain('getScanResults?scan=999')
  })
})
