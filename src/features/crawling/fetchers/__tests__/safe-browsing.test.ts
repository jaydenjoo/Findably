import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchSafeBrowsing } from '../safe-browsing'

// ─── config mock ───
const mockConfig = { googleApiKey: 'test-api-key' }
vi.mock('@/config/crawling', () => ({
  crawlingConfig: new Proxy(
    {},
    {
      get: (_target, prop) =>
        (mockConfig as Record<string, unknown>)[prop as string],
    }
  ),
}))

// ─── fetch mock ───
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('fetchSafeBrowsing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfig.googleApiKey = 'test-api-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── API 키 없음 ───

  it('should return null when API key is not set', async () => {
    mockConfig.googleApiKey = ''
    const result = await fetchSafeBrowsing('https://example.com')
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // ─── 안전한 사이트 (빈 응답) ───

  it('should return is_safe: true when response is empty object', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const result = await fetchSafeBrowsing('https://safe-site.com')

    expect(result).toEqual({ is_safe: true, threats: [] })
  })

  it('should return is_safe: true when matches is empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ matches: [] }),
    })

    const result = await fetchSafeBrowsing('https://safe-site.com')

    expect(result).toEqual({ is_safe: true, threats: [] })
  })

  // ─── 위험한 사이트 ───

  it('should return is_safe: false with threats when matches exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          {
            threatType: 'MALWARE',
            platformType: 'ANY_PLATFORM',
            threat: { url: 'https://malware-site.com' },
          },
        ],
      }),
    })

    const result = await fetchSafeBrowsing('https://malware-site.com')

    expect(result).toEqual({
      is_safe: false,
      threats: ['MALWARE'],
    })
  })

  it('should deduplicate threat types', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          { threatType: 'MALWARE' },
          { threatType: 'MALWARE' },
          { threatType: 'SOCIAL_ENGINEERING' },
        ],
      }),
    })

    const result = await fetchSafeBrowsing('https://bad-site.com')

    expect(result).toEqual({
      is_safe: false,
      threats: ['MALWARE', 'SOCIAL_ENGINEERING'],
    })
  })

  it('should handle multiple different threat types', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          { threatType: 'MALWARE' },
          { threatType: 'SOCIAL_ENGINEERING' },
          { threatType: 'UNWANTED_SOFTWARE' },
          { threatType: 'POTENTIALLY_HARMFUL_APPLICATION' },
        ],
      }),
    })

    const result = await fetchSafeBrowsing('https://very-bad-site.com')

    expect(result).not.toBeNull()
    expect(result!.is_safe).toBe(false)
    expect(result!.threats).toHaveLength(4)
    expect(result!.threats).toContain('MALWARE')
    expect(result!.threats).toContain('SOCIAL_ENGINEERING')
    expect(result!.threats).toContain('UNWANTED_SOFTWARE')
    expect(result!.threats).toContain('POTENTIALLY_HARMFUL_APPLICATION')
  })

  // ─── 방어적 파싱 ───

  it('should treat null response body as safe', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    })

    const result = await fetchSafeBrowsing('https://example.com')

    expect(result).toEqual({ is_safe: true, threats: [] })
  })

  it('should ignore matches with non-string threatType', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          { threatType: 123 },
          { threatType: 'MALWARE' },
          { noThreatType: true },
        ],
      }),
    })

    const result = await fetchSafeBrowsing('https://example.com')

    expect(result).toEqual({
      is_safe: false,
      threats: ['MALWARE'],
    })
  })

  it('should treat matches with only invalid entries as unsafe with empty threats', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [{ invalid: true }, null, 42],
      }),
    })

    const result = await fetchSafeBrowsing('https://example.com')

    // matches 배열이 비어있지 않으므로 is_safe: false, 하지만 추출 가능한 위협 없음
    expect(result).toEqual({ is_safe: false, threats: [] })
  })

  // ─── HTTP 에러 ───

  it('should return null on HTTP error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
    })

    const result = await fetchSafeBrowsing('https://example.com')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[fetchSafeBrowsing] HTTP 403 for https://example.com'
    )
  })

  it('should return null on HTTP 500 error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const result = await fetchSafeBrowsing('https://example.com')

    expect(result).toBeNull()
  })

  // ─── 타임아웃 ───

  it('should return null on timeout (AbortError)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const abortError = new DOMException('Aborted', 'AbortError')
    mockFetch.mockRejectedValueOnce(abortError)

    const result = await fetchSafeBrowsing('https://slow-site.com')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[fetchSafeBrowsing] Timeout after 10000ms for https://slow-site.com'
    )
  })

  // ─── 네트워크 에러 ───

  it('should return null on network error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const result = await fetchSafeBrowsing('https://example.com')

    expect(result).toBeNull()
  })

  // ─── 요청 형식 검증 ───

  it('should send correct request body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    await fetchSafeBrowsing('https://example.com/page')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [requestUrl, requestOptions] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ]

    // URL에 API 키 포함
    expect(requestUrl).toContain('safebrowsing.googleapis.com')
    expect(requestUrl).toContain('key=test-api-key')

    // POST 메서드
    expect(requestOptions.method).toBe('POST')

    // 올바른 Content-Type
    expect(requestOptions.headers).toEqual({
      'Content-Type': 'application/json',
    })

    // 요청 본문 검증
    const body = JSON.parse(requestOptions.body as string) as Record<
      string,
      unknown
    >
    expect(body).toEqual({
      client: {
        clientId: 'findably',
        clientVersion: '1.0',
      },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION',
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url: 'https://example.com/page' }],
      },
    })
  })

  it('should include AbortController signal', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    await fetchSafeBrowsing('https://example.com')

    const [, requestOptions] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(requestOptions.signal).toBeInstanceOf(AbortSignal)
  })
})
