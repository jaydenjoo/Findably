import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── runLayers mock ───
const mockRunLayers = vi.fn()

vi.mock('../run-layers', () => ({
  runLayers: (...args: unknown[]) => mockRunLayers(...args),
}))

import { buildFallbackCrawlData } from '../fallback-crawl'

describe('buildFallbackCrawlData', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockRunLayers.mockResolvedValue({
      layer2: {
        pagespeed: {
          performance_score: 85,
          lcp_ms: 1200,
          fid_ms: 50,
          cls: 0.05,
          ttfb_ms: 300,
        },
        crux: null,
        safe_browsing: { is_safe: true, threats: [] },
      },
      layer3: {
        ssl: {
          grade: 'A',
          valid: true,
          expires_at: '2027-01-01',
          issuer: "Let's Encrypt",
        },
        observatory: null,
      },
    })
  })

  it('should return CrawlData with is_partial=true and null Layer 1 fields', async () => {
    const result = await buildFallbackCrawlData({
      url: 'https://example.com',
      blockedReason: 'robots.txt denied',
    })

    expect(result.is_partial).toBe(true)
    expect(result.blocked_reason).toBe('robots.txt denied')
    expect(result.layer1).toBeNull()
    expect(result.robots_txt).toBeNull()
    expect(result.sitemap).toBeNull()
    expect(result.llms_txt).toBeNull()
    expect(result.cms).toBeNull()
    expect(result.mobile).toBeNull()
  })

  it('should include Layer 2+3 data from runLayers', async () => {
    const result = await buildFallbackCrawlData({
      url: 'https://example.com',
      blockedReason: 'blocked',
    })

    expect(result.layer2).not.toBeNull()
    expect(result.layer2?.pagespeed?.performance_score).toBe(85)
    expect(result.layer3?.ssl?.grade).toBe('A')
  })

  it('should call runLayers with the provided URL', async () => {
    await buildFallbackCrawlData({
      url: 'https://test.kr',
      blockedReason: 'denied',
    })

    expect(mockRunLayers).toHaveBeenCalledWith('https://test.kr')
    expect(mockRunLayers).toHaveBeenCalledTimes(1)
  })

  it('should populate crawled_at and duration_ms', async () => {
    const result = await buildFallbackCrawlData({
      url: 'https://example.com',
      blockedReason: 'blocked',
    })

    expect(result.crawled_at).toBeDefined()
    expect(typeof result.duration_ms).toBe('number')
    expect(result.duration_ms).toBeGreaterThanOrEqual(0)
  })

  it('should propagate runLayers error', async () => {
    mockRunLayers.mockRejectedValueOnce(new Error('Network failure'))

    await expect(
      buildFallbackCrawlData({
        url: 'https://fail.com',
        blockedReason: 'blocked',
      })
    ).rejects.toThrow('Network failure')
  })
})
