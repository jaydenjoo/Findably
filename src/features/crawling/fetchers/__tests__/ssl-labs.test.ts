import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchSslLabs } from '../ssl-labs'

// ─── fetch mock ───
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('fetchSslLabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── 잘못된 URL ───

  it('should return null for invalid URL', async () => {
    const result = await fetchSslLabs('not-a-url')
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // ─── 정상 결과 (READY) ───

  it('should return SSL data when status is READY', async () => {
    const futureDate = Date.now() + 365 * 24 * 60 * 60 * 1000
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'READY',
        endpoints: [{ grade: 'A+' }],
        certs: [
          {
            notAfter: futureDate,
            issuerLabel: "Let's Encrypt Authority X3",
          },
        ],
      }),
    })

    const result = await fetchSslLabs('https://example.com')

    expect(result).not.toBeNull()
    expect(result!.grade).toBe('A+')
    expect(result!.valid).toBe(true)
    expect(result!.expires_at).not.toBeNull()
    expect(result!.issuer).toBe("Let's Encrypt Authority X3")
  })

  // ─── 미완료 상태 ───

  it('should return null when status is DNS', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'DNS' }),
    })

    const result = await fetchSslLabs('https://example.com')
    expect(result).toBeNull()
  })

  it('should return null when status is IN_PROGRESS', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'IN_PROGRESS' }),
    })

    const result = await fetchSslLabs('https://example.com')
    expect(result).toBeNull()
  })

  it('should return null when status is ERROR', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ERROR' }),
    })

    const result = await fetchSslLabs('https://example.com')
    expect(result).toBeNull()
  })

  // ─── 인증서 만료 ───

  it('should return valid: false when certificate is expired', async () => {
    const pastDate = Date.now() - 24 * 60 * 60 * 1000
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'READY',
        endpoints: [{ grade: 'T' }],
        certs: [{ notAfter: pastDate, issuerLabel: 'DigiCert' }],
      }),
    })

    const result = await fetchSslLabs('https://expired.com')

    expect(result).not.toBeNull()
    expect(result!.valid).toBe(false)
    expect(result!.grade).toBe('T')
  })

  // ─── issuerSubject 폴백 ───

  it('should use issuerSubject when issuerLabel is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'READY',
        endpoints: [{ grade: 'A' }],
        certs: [
          {
            notAfter: Date.now() + 365 * 24 * 60 * 60 * 1000,
            issuerSubject: 'CN=DigiCert SHA2, O=DigiCert Inc, C=US',
          },
        ],
      }),
    })

    const result = await fetchSslLabs('https://example.com')

    expect(result!.issuer).toBe('CN=DigiCert SHA2, O=DigiCert Inc, C=US')
  })

  // ─── endpoints/certs 누락 ───

  it('should return null grade when endpoints is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'READY',
        endpoints: [],
        certs: [{ notAfter: Date.now() + 86400000, issuerLabel: 'Test' }],
      }),
    })

    const result = await fetchSslLabs('https://example.com')

    expect(result).not.toBeNull()
    expect(result!.grade).toBeNull()
  })

  it('should handle missing certs array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'READY',
        endpoints: [{ grade: 'B' }],
      }),
    })

    const result = await fetchSslLabs('https://example.com')

    expect(result).not.toBeNull()
    expect(result!.grade).toBe('B')
    expect(result!.valid).toBe(false)
    expect(result!.expires_at).toBeNull()
    expect(result!.issuer).toBeNull()
  })

  it('should handle invalid endpoint object', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'READY',
        endpoints: [null],
        certs: [],
      }),
    })

    const result = await fetchSslLabs('https://example.com')

    expect(result).not.toBeNull()
    expect(result!.grade).toBeNull()
  })

  it('should handle non-string grade in endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'READY',
        endpoints: [{ grade: 123 }],
        certs: [],
      }),
    })

    const result = await fetchSslLabs('https://example.com')

    expect(result!.grade).toBeNull()
  })

  // ─── 방어적 파싱 ───

  it('should return null for null response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    })

    const result = await fetchSslLabs('https://example.com')
    expect(result).toBeNull()
  })

  it('should return null for non-object response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => 'string-response',
    })

    const result = await fetchSslLabs('https://example.com')
    expect(result).toBeNull()
  })

  // ─── HTTP 에러 ───

  it('should return null on HTTP error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })

    const result = await fetchSslLabs('https://example.com')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[fetchSslLabs] HTTP 429 for example.com'
    )
  })

  // ─── 타임아웃 ───

  it('should return null on timeout (AbortError)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))

    const result = await fetchSslLabs('https://slow-site.com')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[fetchSslLabs] Timeout after 15000ms for slow-site.com'
    )
  })

  // ─── 네트워크 에러 ───

  it('should return null on network error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const result = await fetchSslLabs('https://example.com')
    expect(result).toBeNull()
  })

  // ─── 요청 URL 검증 ───

  it('should send correct request with host and cache params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'READY', endpoints: [], certs: [] }),
    })

    await fetchSslLabs('https://www.example.com/path?q=1')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [requestUrl, requestOptions] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ]

    expect(requestUrl).toContain('api.ssllabs.com/api/v3/analyze')
    expect(requestUrl).toContain('host=www.example.com')
    expect(requestUrl).toContain('fromCache=on')
    expect(requestUrl).toContain('maxAge=72')
    expect(requestOptions.method).toBe('GET')
    expect(requestOptions.signal).toBeInstanceOf(AbortSignal)
  })

  it('should include AbortController signal', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'READY', endpoints: [], certs: [] }),
    })

    await fetchSslLabs('https://example.com')

    const [, requestOptions] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(requestOptions.signal).toBeInstanceOf(AbortSignal)
  })
})
