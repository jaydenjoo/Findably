import { describe, it, expect } from 'vitest'
import { calculateGeoScore } from '../geo-scorer'
import type { CrawlData, Layer1Data } from '@/features/crawling/types'

// ─── 헬퍼 ───

function makeLayer1(overrides: Partial<Layer1Data> = {}): Layer1Data {
  return {
    meta: {
      title: 'Test Page',
      description: 'Test description',
      canonical: 'https://example.com',
      charset: 'utf-8',
      viewport: 'width=device-width',
      og: {},
      robots_meta: null,
    },
    headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
    schema_markup: [],
    links: { internal: 0, external: 0, broken: [] },
    images: { total: 0, without_alt: 0, large_images: [] },
    page_size_bytes: 10000,
    load_time_ms: 500,
    html_lang: 'ko',
    ...overrides,
  }
}

function makeCrawlData(overrides: Partial<CrawlData> = {}): CrawlData {
  return {
    crawled_at: new Date().toISOString(),
    duration_ms: 1000,
    is_partial: false,
    layer1: makeLayer1(),
    robots_txt: null,
    sitemap: null,
    llms_txt: null,
    cms: null,
    mobile: null,
    layer2: null,
    layer3: null,
    markdownContent: null,
    siteUrls: null,
    firecrawlUsed: false,
    ...overrides,
  }
}

/** 만점 데이터 */
const fullScoreCrawlData: CrawlData = makeCrawlData({
  layer1: makeLayer1({
    schema_markup: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test',
      },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] },
      { '@context': 'https://schema.org', '@type': 'WebPage' },
    ],
    meta: {
      title: 'Test',
      description: 'A meta description for E-E-A-T',
      canonical: 'https://example.com',
      charset: 'utf-8',
      viewport: 'width=device-width',
      og: {
        title: 'Test',
        description: 'Desc',
        image: 'https://example.com/img.png',
        url: 'https://example.com',
        type: 'website',
      },
      robots_meta: null,
    },
    images: { total: 5, without_alt: 0, large_images: [] },
    hreflang: ['ko', 'en'],
  }),
  markdownContent: '# Heading\n' + 'a'.repeat(1200),
  llms_txt: {
    exists: true,
    content: '# llms.txt content',
    hasFullVersion: true,
  },
})

// ─── null / none 처리 ───

describe('calculateGeoScore — null 처리', () => {
  it('should return 0 score with none source when crawlData is null', () => {
    const result = calculateGeoScore(null)

    expect(result.overall).toBe(0)
    expect(result.dataSource).toBe('none')
    expect(result.breakdown.schemaOrg.score).toBe(0)
    expect(result.breakdown.llmsTxt.score).toBe(0)
  })

  it('should return 0 score when layer1 is null', () => {
    const result = calculateGeoScore(makeCrawlData({ layer1: null }))

    expect(result.overall).toBe(0)
    expect(result.dataSource).toBe('none')
  })
})

// ─── dataSource 판별 ───

describe('calculateGeoScore — dataSource', () => {
  it('should return full when schema + meta + content all exist', () => {
    const result = calculateGeoScore(fullScoreCrawlData)
    expect(result.dataSource).toBe('full')
  })

  it('should return partial when only meta exists (no schema, no content)', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({ schema_markup: [] }),
      markdownContent: null,
    })
    const result = calculateGeoScore(data)
    expect(result.dataSource).toBe('partial')
  })

  it('should return partial when only content exists', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        schema_markup: [],
        meta: {
          title: null,
          description: null,
          canonical: null,
          charset: null,
          viewport: null,
          og: {},
          robots_meta: null,
        },
      }),
      markdownContent: 'Some content',
    })
    const result = calculateGeoScore(data)
    expect(result.dataSource).toBe('partial')
  })
})

// ─── Schema.org (20점) ───

describe('calculateGeoScore — Schema.org scoring', () => {
  it.each([
    [0, 0],
    [1, 10],
    [2, 15],
    [3, 20],
    [5, 20],
  ])('should score %d schema items as %d', (count, expected) => {
    const schema_markup = Array.from({ length: count }, () => ({
      '@type': 'Thing',
    }))
    const data = makeCrawlData({
      layer1: makeLayer1({ schema_markup }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.schemaOrg.score).toBe(expected)
    expect(result.breakdown.schemaOrg.maxScore).toBe(20)
    expect(result.breakdown.schemaOrg.count).toBe(count)
  })
})

// ─── Structured Data / JSON-LD (15점) ───

describe('calculateGeoScore — Structured Data scoring', () => {
  it('should score 15 when @context exists in schema', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        schema_markup: [
          { '@context': 'https://schema.org', '@type': 'Organization' },
        ],
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.structuredData.score).toBe(15)
    expect(result.breakdown.structuredData.hasJsonLd).toBe(true)
  })

  it('should score 0 when no @context in schema', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        schema_markup: [{ '@type': 'Organization' }],
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.structuredData.score).toBe(0)
    expect(result.breakdown.structuredData.hasJsonLd).toBe(false)
  })

  it('should score 0 when schema is empty', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({ schema_markup: [] }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.structuredData.score).toBe(0)
  })
})

// ─── FAQ Schema (10점) ───

describe('calculateGeoScore — FAQ Schema scoring', () => {
  it('should score 10 when FAQPage exists', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        schema_markup: [{ '@type': 'FAQPage' }],
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.faqSchema.score).toBe(10)
    expect(result.breakdown.faqSchema.count).toBe(1)
  })

  it('should score 10 when Question type exists', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        schema_markup: [{ '@type': 'Question' }, { '@type': 'Question' }],
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.faqSchema.score).toBe(10)
    expect(result.breakdown.faqSchema.count).toBe(2)
  })

  it('should score 0 when no FAQ schema', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        schema_markup: [{ '@type': 'Organization' }],
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.faqSchema.score).toBe(0)
    expect(result.breakdown.faqSchema.count).toBe(0)
  })
})

// ─── Content Length (10점) ───

describe('calculateGeoScore — Content Length scoring', () => {
  it('should score 10 when body text >= 1000 chars', () => {
    const data = makeCrawlData({
      markdownContent: '# Title\n' + 'a'.repeat(1000),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.contentLength.score).toBe(10)
  })

  it('should score 5 when body text >= 500 and < 1000 chars', () => {
    const data = makeCrawlData({
      markdownContent: '# Title\n' + 'a'.repeat(600),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.contentLength.score).toBe(5)
  })

  it('should score 0 when body text < 500 chars', () => {
    const data = makeCrawlData({
      markdownContent: '# Title\nShort text',
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.contentLength.score).toBe(0)
  })

  it('should score 0 when markdownContent is null', () => {
    const data = makeCrawlData({ markdownContent: null })
    const result = calculateGeoScore(data)

    expect(result.breakdown.contentLength.score).toBe(0)
    expect(result.breakdown.contentLength.charCount).toBe(0)
  })

  it('should exclude heading lines from char count', () => {
    // 500 chars of headings + 300 chars of body = should be < 500 threshold
    const headings = Array.from(
      { length: 10 },
      () => `# ${'H'.repeat(47)}`
    ).join('\n')
    const body = 'a'.repeat(300)
    const data = makeCrawlData({
      markdownContent: headings + '\n' + body,
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.contentLength.score).toBe(0)
    expect(result.breakdown.contentLength.charCount).toBeLessThan(500)
  })
})

// ─── Image Alt (10점) ───

describe('calculateGeoScore — Image Alt scoring', () => {
  it('should score 10 when all images have alt', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        images: { total: 10, without_alt: 0, large_images: [] },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.imageAlt.score).toBe(10)
    expect(result.breakdown.imageAlt.ratio).toBe(1)
  })

  it('should score 10 when no images exist (no penalty)', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        images: { total: 0, without_alt: 0, large_images: [] },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.imageAlt.score).toBe(10)
  })

  it('should score 7 when 80%+ images have alt', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        images: { total: 10, without_alt: 1, large_images: [] },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.imageAlt.score).toBe(7)
  })

  it('should score 4 when 50%+ images have alt', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        images: { total: 10, without_alt: 4, large_images: [] },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.imageAlt.score).toBe(4)
  })

  it('should score 0 when < 50% images have alt', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        images: { total: 10, without_alt: 8, large_images: [] },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.imageAlt.score).toBe(0)
  })
})

// ─── E-E-A-T (5점) ───

describe('calculateGeoScore — E-E-A-T scoring', () => {
  it('should score 2 for meta description only', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: 'Has description',
          canonical: null,
          charset: null,
          viewport: null,
          og: {},
          robots_meta: null,
        },
        schema_markup: [],
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.eeat.score).toBe(2)
  })

  it('should score 3 for Organization schema only', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: null,
          canonical: null,
          charset: null,
          viewport: null,
          og: {},
          robots_meta: null,
        },
        schema_markup: [{ '@type': 'Organization' }],
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.eeat.score).toBe(3)
  })

  it('should score 5 for both description + Person schema', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: 'Has description',
          canonical: null,
          charset: null,
          viewport: null,
          og: {},
          robots_meta: null,
        },
        schema_markup: [{ '@type': 'Person' }],
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.eeat.score).toBe(5)
    expect(result.breakdown.eeat.maxScore).toBe(5)
  })

  it('should score 0 when no description and no author schema', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: null,
          canonical: null,
          charset: null,
          viewport: null,
          og: {},
          robots_meta: null,
        },
        schema_markup: [],
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.eeat.score).toBe(0)
  })
})

// ─── llms.txt (15점) ───

describe('calculateGeoScore — llms.txt scoring', () => {
  it('should score 15 when llms.txt exists with full version', () => {
    const data = makeCrawlData({
      llms_txt: { exists: true, content: 'content', hasFullVersion: true },
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.llmsTxt.score).toBe(15)
    expect(result.breakdown.llmsTxt.exists).toBe(true)
    expect(result.breakdown.llmsTxt.hasFullVersion).toBe(true)
  })

  it('should score 10 when llms.txt exists without full version', () => {
    const data = makeCrawlData({
      llms_txt: { exists: true, content: 'content', hasFullVersion: false },
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.llmsTxt.score).toBe(10)
  })

  it('should score 0 when llms.txt does not exist', () => {
    const data = makeCrawlData({ llms_txt: null })
    const result = calculateGeoScore(data)

    expect(result.breakdown.llmsTxt.score).toBe(0)
    expect(result.breakdown.llmsTxt.exists).toBe(false)
  })

  it('should score 0 when llms_txt.exists is false', () => {
    const data = makeCrawlData({
      llms_txt: { exists: false, content: null },
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.llmsTxt.score).toBe(0)
  })
})

// ─── Canonical (5점) ───

describe('calculateGeoScore — Canonical scoring', () => {
  it('should score 5 when canonical exists', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: null,
          canonical: 'https://example.com',
          charset: null,
          viewport: null,
          og: {},
          robots_meta: null,
        },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.canonical.score).toBe(5)
    expect(result.breakdown.canonical.exists).toBe(true)
  })

  it('should score 0 when canonical is null', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: null,
          canonical: null,
          charset: null,
          viewport: null,
          og: {},
          robots_meta: null,
        },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.canonical.score).toBe(0)
    expect(result.breakdown.canonical.exists).toBe(false)
  })

  it('should score 0 when canonical is empty string', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: null,
          canonical: '   ',
          charset: null,
          viewport: null,
          og: {},
          robots_meta: null,
        },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.canonical.score).toBe(0)
  })
})

// ─── OG Completeness (5점) ───

describe('calculateGeoScore — OG Completeness scoring', () => {
  it('should score 5 when all 5 OG fields present', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: null,
          canonical: null,
          charset: null,
          viewport: null,
          og: {
            title: 'T',
            description: 'D',
            image: 'img.png',
            url: 'https://example.com',
            type: 'website',
          },
          robots_meta: null,
        },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.ogCompleteness.score).toBe(5)
    expect(result.breakdown.ogCompleteness.presentFields).toHaveLength(5)
  })

  it('should score proportionally for partial OG fields', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: null,
          canonical: null,
          charset: null,
          viewport: null,
          og: { title: 'T', description: 'D' },
          robots_meta: null,
        },
      }),
    })
    const result = calculateGeoScore(data)

    // 2/5 * 5 = 2
    expect(result.breakdown.ogCompleteness.score).toBe(2)
    expect(result.breakdown.ogCompleteness.presentFields).toHaveLength(2)
  })

  it('should score 0 when no OG fields', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({
        meta: {
          title: 'T',
          description: null,
          canonical: null,
          charset: null,
          viewport: null,
          og: {},
          robots_meta: null,
        },
      }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.ogCompleteness.score).toBe(0)
    expect(result.breakdown.ogCompleteness.presentFields).toHaveLength(0)
  })
})

// ─── Hreflang (5점) ───

describe('calculateGeoScore — Hreflang scoring', () => {
  it('should score 5 when hreflang has languages', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({ hreflang: ['ko', 'en'] }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.hreflang.score).toBe(5)
    expect(result.breakdown.hreflang.languages).toEqual(['ko', 'en'])
  })

  it('should score 0 when hreflang is empty', () => {
    const data = makeCrawlData({
      layer1: makeLayer1({ hreflang: [] }),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.hreflang.score).toBe(0)
  })

  it('should score 0 when hreflang is undefined', () => {
    const data = makeCrawlData({
      layer1: makeLayer1(),
    })
    const result = calculateGeoScore(data)

    expect(result.breakdown.hreflang.score).toBe(0)
  })
})

// ─── 종합 점수 정합성 ───

describe('calculateGeoScore — overall consistency', () => {
  it('should sum all category scores', () => {
    const result = calculateGeoScore(fullScoreCrawlData)

    const sum =
      result.breakdown.schemaOrg.score +
      result.breakdown.structuredData.score +
      result.breakdown.faqSchema.score +
      result.breakdown.contentLength.score +
      result.breakdown.imageAlt.score +
      result.breakdown.eeat.score +
      result.breakdown.llmsTxt.score +
      result.breakdown.canonical.score +
      result.breakdown.ogCompleteness.score +
      result.breakdown.hreflang.score

    expect(result.overall).toBe(sum)
  })

  it('should have maxScore sum to 100', () => {
    const result = calculateGeoScore(fullScoreCrawlData)

    const maxSum =
      result.breakdown.schemaOrg.maxScore +
      result.breakdown.structuredData.maxScore +
      result.breakdown.faqSchema.maxScore +
      result.breakdown.contentLength.maxScore +
      result.breakdown.imageAlt.maxScore +
      result.breakdown.eeat.maxScore +
      result.breakdown.llmsTxt.maxScore +
      result.breakdown.canonical.maxScore +
      result.breakdown.ogCompleteness.maxScore +
      result.breakdown.hreflang.maxScore

    expect(maxSum).toBe(100)
  })

  it('should produce overall between 0 and 100', () => {
    const scenarios = [
      fullScoreCrawlData,
      makeCrawlData(),
      makeCrawlData({ layer1: null }),
      null,
    ]

    for (const data of scenarios) {
      const result = calculateGeoScore(data)
      expect(result.overall).toBeGreaterThanOrEqual(0)
      expect(result.overall).toBeLessThanOrEqual(100)
    }
  })

  it('should reach 100 with perfect data', () => {
    const result = calculateGeoScore(fullScoreCrawlData)
    expect(result.overall).toBe(100)
  })
})
