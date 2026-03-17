import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── fetcher mocks ───
vi.mock('../../fetchers/pagespeed', () => ({
  fetchPageSpeed: vi.fn(),
}))
vi.mock('../../fetchers/crux', () => ({
  fetchCrux: vi.fn(),
}))
vi.mock('../../fetchers/safe-browsing', () => ({
  fetchSafeBrowsing: vi.fn(),
}))
vi.mock('../../fetchers/ssl-labs', () => ({
  fetchSslLabs: vi.fn(),
}))
vi.mock('../../fetchers/observatory', () => ({
  fetchObservatory: vi.fn(),
}))

import { runLayers } from '../run-layers'
import { fetchPageSpeed } from '../../fetchers/pagespeed'
import { fetchCrux } from '../../fetchers/crux'
import { fetchSafeBrowsing } from '../../fetchers/safe-browsing'
import { fetchSslLabs } from '../../fetchers/ssl-labs'
import { fetchObservatory } from '../../fetchers/observatory'

const mockPageSpeed = vi.mocked(fetchPageSpeed)
const mockCrux = vi.mocked(fetchCrux)
const mockSafeBrowsing = vi.mocked(fetchSafeBrowsing)
const mockSslLabs = vi.mocked(fetchSslLabs)
const mockObservatory = vi.mocked(fetchObservatory)

const TEST_URL = 'https://example.com'

describe('runLayers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ─── 모든 fetcher 성공 ───

  it('should return all layer data when all fetchers succeed', async () => {
    const pagespeedData = {
      performance_score: 85,
      lcp_ms: 1200,
      fid_ms: 50,
      cls: 0.05,
      ttfb_ms: 300,
    }
    const cruxData = {
      lcp_ms: 1100,
      inp_ms: 80,
      cls: 0.04,
      ttfb_ms: 250,
      fcp_ms: 900,
      form_factors: { phone: 60, desktop: 35, tablet: 5 },
      collection_period: { first_date: '2026-02-01', last_date: '2026-02-28' },
    }
    const safeBrowsingData = { is_safe: true, threats: [] }
    const sslData = {
      grade: 'A+',
      valid: true,
      expires_at: '2027-01-01T00:00:00Z',
      issuer: "Let's Encrypt",
      protocols: ['TLS 1.3', 'TLS 1.2'],
    }
    const observatoryData = {
      grade: 'A',
      score: 90,
      issues: [],
    }

    mockPageSpeed.mockResolvedValueOnce(pagespeedData)
    mockCrux.mockResolvedValueOnce(cruxData)
    mockSafeBrowsing.mockResolvedValueOnce(safeBrowsingData)
    mockSslLabs.mockResolvedValueOnce(sslData)
    mockObservatory.mockResolvedValueOnce(observatoryData)

    const { layer2, layer3 } = await runLayers(TEST_URL)

    expect(layer2.pagespeed).toEqual(pagespeedData)
    expect(layer2.crux).toEqual(cruxData)
    expect(layer2.safe_browsing).toEqual(safeBrowsingData)
    expect(layer3.ssl).toEqual(sslData)
    expect(layer3.observatory).toEqual(observatoryData)
  })

  // ─── 모든 fetcher null 반환 ───

  it('should return all null when all fetchers return null', async () => {
    mockPageSpeed.mockResolvedValueOnce(null)
    mockCrux.mockResolvedValueOnce(null)
    mockSafeBrowsing.mockResolvedValueOnce(null)
    mockSslLabs.mockResolvedValueOnce(null)
    mockObservatory.mockResolvedValueOnce(null)

    const { layer2, layer3 } = await runLayers(TEST_URL)

    expect(layer2.pagespeed).toBeNull()
    expect(layer2.crux).toBeNull()
    expect(layer2.safe_browsing).toBeNull()
    expect(layer3.ssl).toBeNull()
    expect(layer3.observatory).toBeNull()
  })

  // ─── 일부 실패 (Promise.allSettled 그레이스풀) ───

  it('should return null for rejected fetchers without crashing', async () => {
    mockPageSpeed.mockRejectedValueOnce(new Error('API limit'))
    mockCrux.mockResolvedValueOnce(null)
    mockSafeBrowsing.mockResolvedValueOnce({ is_safe: true, threats: [] })
    mockSslLabs.mockRejectedValueOnce(new Error('Timeout'))
    mockObservatory.mockResolvedValueOnce({
      grade: 'B',
      score: 65,
      issues: ['csp'],
    })

    const { layer2, layer3 } = await runLayers(TEST_URL)

    expect(layer2.pagespeed).toBeNull()
    expect(layer2.crux).toBeNull()
    expect(layer2.safe_browsing).toEqual({ is_safe: true, threats: [] })
    expect(layer3.ssl).toBeNull()
    expect(layer3.observatory).toEqual({
      grade: 'B',
      score: 65,
      issues: ['csp'],
    })
  })

  // ─── 모든 fetcher rejected ───

  it('should return all null when all fetchers reject', async () => {
    mockPageSpeed.mockRejectedValueOnce(new Error('fail'))
    mockCrux.mockRejectedValueOnce(new Error('fail'))
    mockSafeBrowsing.mockRejectedValueOnce(new Error('fail'))
    mockSslLabs.mockRejectedValueOnce(new Error('fail'))
    mockObservatory.mockRejectedValueOnce(new Error('fail'))

    const { layer2, layer3 } = await runLayers(TEST_URL)

    expect(layer2.pagespeed).toBeNull()
    expect(layer2.crux).toBeNull()
    expect(layer2.safe_browsing).toBeNull()
    expect(layer3.ssl).toBeNull()
    expect(layer3.observatory).toBeNull()
  })

  // ─── rejected 시 콘솔 로깅 ───

  it('should log rejected fetcher errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error')
    mockPageSpeed.mockRejectedValueOnce(new Error('rate limited'))
    mockCrux.mockResolvedValueOnce(null)
    mockSafeBrowsing.mockResolvedValueOnce(null)
    mockSslLabs.mockResolvedValueOnce(null)
    mockObservatory.mockResolvedValueOnce(null)

    await runLayers(TEST_URL)

    expect(consoleSpy).toHaveBeenCalledWith(
      '[runLayers] Fetcher rejected:',
      expect.any(Error)
    )
  })

  // ─── URL 전달 검증 ───

  it('should pass url to all fetchers', async () => {
    mockPageSpeed.mockResolvedValueOnce(null)
    mockCrux.mockResolvedValueOnce(null)
    mockSafeBrowsing.mockResolvedValueOnce(null)
    mockSslLabs.mockResolvedValueOnce(null)
    mockObservatory.mockResolvedValueOnce(null)

    await runLayers(TEST_URL)

    expect(mockPageSpeed).toHaveBeenCalledWith(TEST_URL)
    expect(mockCrux).toHaveBeenCalledWith(TEST_URL)
    expect(mockSafeBrowsing).toHaveBeenCalledWith(TEST_URL)
    expect(mockSslLabs).toHaveBeenCalledWith(TEST_URL)
    expect(mockObservatory).toHaveBeenCalledWith(TEST_URL)
  })

  // ─── 반환 구조 검증 ───

  it('should always return { layer2, layer3 } structure', async () => {
    mockPageSpeed.mockResolvedValueOnce(null)
    mockCrux.mockResolvedValueOnce(null)
    mockSafeBrowsing.mockResolvedValueOnce(null)
    mockSslLabs.mockResolvedValueOnce(null)
    mockObservatory.mockResolvedValueOnce(null)

    const result = await runLayers(TEST_URL)

    expect(result).toHaveProperty('layer2')
    expect(result).toHaveProperty('layer3')
    expect(result.layer2).toHaveProperty('pagespeed')
    expect(result.layer2).toHaveProperty('crux')
    expect(result.layer2).toHaveProperty('safe_browsing')
    expect(result.layer3).toHaveProperty('ssl')
    expect(result.layer3).toHaveProperty('observatory')
  })
})
