import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeUrl, mapUrl } from '../firecrawl-client'

// ─── Firecrawl SDK mock ───
// SDK v4: scrape() → Document 직접 반환, map() → MapData 직접 반환, 실패 시 throw
const mockScrape = vi.fn()
const mockMap = vi.fn()

vi.mock('@mendable/firecrawl-js', () => ({
  default: vi.fn().mockImplementation(function () {
    return { scrape: mockScrape, map: mockMap }
  }),
}))

// ─── crawlingConfig mock ───
vi.mock('@/config/crawling', () => ({
  crawlingConfig: {
    firecrawlApiKey: 'test-api-key',
    webhookUrl: '',
    webhookSecret: '',
    googleApiKey: '',
    largeImageThresholdKb: 200,
    maxBrokenLinkChecks: 50,
    maxLargeImageReports: 20,
  },
}))

describe('scrapeUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return html, markdown, metadata on success', async () => {
    mockScrape.mockResolvedValue({
      html: '<html><body>Hello</body></html>',
      markdown: '# Hello',
      metadata: { title: 'Test Page' },
    })

    const result = await scrapeUrl('https://example.com')

    expect(result).toEqual({
      html: '<html><body>Hello</body></html>',
      markdown: '# Hello',
      metadata: { title: 'Test Page' },
    })
    expect(mockScrape).toHaveBeenCalledWith('https://example.com', {
      formats: ['html', 'markdown'],
    })
  })

  it('should return null when Firecrawl throws error', async () => {
    mockScrape.mockRejectedValue(new Error('Rate limited'))

    const result = await scrapeUrl('https://example.com')

    expect(result).toBeNull()
  })

  it('should handle missing html/markdown/metadata gracefully', async () => {
    mockScrape.mockResolvedValue({
      html: undefined,
      markdown: undefined,
      metadata: undefined,
    })

    const result = await scrapeUrl('https://example.com')

    expect(result).toEqual({
      html: '',
      markdown: '',
      metadata: {},
    })
  })
})

describe('mapUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return URL list on success', async () => {
    mockMap.mockResolvedValue({
      links: [
        { url: 'https://example.com/' },
        { url: 'https://example.com/about' },
        { url: 'https://example.com/blog' },
      ],
    })

    const result = await mapUrl('https://example.com')

    expect(result).toEqual([
      'https://example.com/',
      'https://example.com/about',
      'https://example.com/blog',
    ])
    expect(mockMap).toHaveBeenCalledWith('https://example.com')
  })

  it('should return null when Firecrawl throws error', async () => {
    mockMap.mockRejectedValue(new Error('API down'))

    const result = await mapUrl('https://example.com')

    expect(result).toBeNull()
  })

  it('should return empty array when links is undefined', async () => {
    mockMap.mockResolvedValue({
      links: undefined,
    })

    const result = await mapUrl('https://example.com')

    expect(result).toEqual([])
  })
})

describe('API key not configured', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null for scrapeUrl when API key is empty', async () => {
    const crawlingModule = await import('@/config/crawling')
    const original = crawlingModule.crawlingConfig.firecrawlApiKey
    Object.defineProperty(crawlingModule.crawlingConfig, 'firecrawlApiKey', {
      value: '',
      writable: true,
      configurable: true,
    })

    const result = await scrapeUrl('https://example.com')

    expect(result).toBeNull()
    expect(mockScrape).not.toHaveBeenCalled()

    Object.defineProperty(crawlingModule.crawlingConfig, 'firecrawlApiKey', {
      value: original,
      writable: true,
      configurable: true,
    })
  })

  it('should return null for mapUrl when API key is empty', async () => {
    const crawlingModule = await import('@/config/crawling')
    const original = crawlingModule.crawlingConfig.firecrawlApiKey
    Object.defineProperty(crawlingModule.crawlingConfig, 'firecrawlApiKey', {
      value: '',
      writable: true,
      configurable: true,
    })

    const result = await mapUrl('https://example.com')

    expect(result).toBeNull()
    expect(mockMap).not.toHaveBeenCalled()

    Object.defineProperty(crawlingModule.crawlingConfig, 'firecrawlApiKey', {
      value: original,
      writable: true,
      configurable: true,
    })
  })
})
