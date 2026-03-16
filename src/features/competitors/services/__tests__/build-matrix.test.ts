import { describe, it, expect } from 'vitest'
import { buildMatrix } from '../build-matrix'
import type { CompetitorCrawlResult } from '../../types'
import type { CompetitorAnalysis } from '@/features/diagnosis-paid'

const ORIGINAL_URL = 'https://example.com'

function makeCrawlResult(
  overrides: Partial<CompetitorCrawlResult> = {}
): CompetitorCrawlResult {
  return {
    url: 'https://competitor-a.com',
    performance: 80,
    accessibility: 75,
    seo: 70,
    bestPractices: 85,
    coreWebVitals: { lcp: 2000, fid: 100, cls: 0.1, ttfb: 300 },
    mobile: true,
    crawledAt: '2026-03-16T00:00:00Z',
    error: null,
    ...overrides,
  }
}

function makeAiCompetitor(
  overrides: Partial<CompetitorAnalysis> = {}
): CompetitorAnalysis {
  return {
    url: 'https://competitor-a.com',
    name: 'Competitor A',
    overallScore: 65,
    strengths: ['빠른 로딩'],
    weaknesses: ['콘텐츠 부족'],
    differentiators: ['AI 챗봇'],
    ...overrides,
  } as CompetitorAnalysis
}

describe('buildMatrix', () => {
  it('should build 5 categories', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 90,
        seo: 85,
        accessibility: 80,
        content: 70,
        geo: 60,
        overall: 77,
      },
      crawlResults: [makeCrawlResult()],
      aiCompetitors: [makeAiCompetitor()],
    })

    expect(matrix.categories).toHaveLength(5)
    expect(matrix.categories.map((c) => c.id)).toEqual([
      'performance',
      'seo',
      'accessibility',
      'content',
      'geo',
    ])
  })

  it('should set original scores correctly', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 90,
        seo: 85,
        accessibility: 80,
        content: 70,
        geo: 60,
        overall: 77,
      },
      crawlResults: [],
      aiCompetitors: [],
    })

    expect(matrix.categories[0]!.originalScore).toBe(90)
    expect(matrix.categories[1]!.originalScore).toBe(85)
    expect(matrix.categories[2]!.originalScore).toBe(80)
    expect(matrix.categories[3]!.originalScore).toBe(70)
    expect(matrix.categories[4]!.originalScore).toBe(60)
  })

  it('should treat null original scores as 0', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: null,
        seo: null,
        accessibility: null,
        content: null,
        geo: null,
        overall: 0,
      },
      crawlResults: [],
      aiCompetitors: [],
    })

    for (const cat of matrix.categories) {
      expect(cat.originalScore).toBe(0)
    }
  })

  it('should map crawl results to performance/seo/accessibility', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 50,
        seo: 50,
        accessibility: 50,
        content: 50,
        geo: 50,
        overall: 50,
      },
      crawlResults: [
        makeCrawlResult({
          url: 'https://competitor-a.com',
          performance: 80,
          seo: 70,
          accessibility: 75,
        }),
      ],
      aiCompetitors: [],
    })

    const perfCat = matrix.categories.find((c) => c.id === 'performance')!
    expect(perfCat.competitorScores[0]!.score).toBe(80)

    const seoCat = matrix.categories.find((c) => c.id === 'seo')!
    expect(seoCat.competitorScores[0]!.score).toBe(70)

    const a11yCat = matrix.categories.find((c) => c.id === 'accessibility')!
    expect(a11yCat.competitorScores[0]!.score).toBe(75)
  })

  it('should map AI competitor overallScore to content category', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 50,
        seo: 50,
        accessibility: 50,
        content: 50,
        geo: 50,
        overall: 50,
      },
      crawlResults: [],
      aiCompetitors: [
        makeAiCompetitor({
          url: 'https://competitor-a.com',
          overallScore: 88,
        }),
      ],
    })

    const contentCat = matrix.categories.find((c) => c.id === 'content')!
    expect(contentCat.competitorScores[0]!.score).toBe(88)
  })

  it('should return empty competitor scores for geo (not supported)', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 50,
        seo: 50,
        accessibility: 50,
        content: 50,
        geo: 50,
        overall: 50,
      },
      crawlResults: [makeCrawlResult()],
      aiCompetitors: [makeAiCompetitor()],
    })

    const geoCat = matrix.categories.find((c) => c.id === 'geo')!
    expect(geoCat.competitorScores).toHaveLength(0)
  })

  it('should determine winner per category', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 50,
        seo: 90,
        accessibility: 50,
        content: 50,
        geo: 50,
        overall: 58,
      },
      crawlResults: [
        makeCrawlResult({
          url: 'https://competitor-a.com',
          performance: 80,
          seo: 70,
          accessibility: 50,
        }),
      ],
      aiCompetitors: [],
    })

    // competitor wins performance (80 > 50)
    const perfCat = matrix.categories.find((c) => c.id === 'performance')!
    expect(perfCat.winner).toBe('https://competitor-a.com')

    // original wins seo (90 > 70)
    const seoCat = matrix.categories.find((c) => c.id === 'seo')!
    expect(seoCat.winner).toBe(ORIGINAL_URL)

    // tie → original wins (original = default)
    const a11yCat = matrix.categories.find((c) => c.id === 'accessibility')!
    expect(a11yCat.winner).toBe(ORIGINAL_URL)
  })

  it('should build competitor summaries with overall average', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 50,
        seo: 50,
        accessibility: 50,
        content: 50,
        geo: 50,
        overall: 50,
      },
      crawlResults: [
        makeCrawlResult({
          url: 'https://competitor-a.com',
          performance: 80,
          seo: 70,
          accessibility: 60,
        }),
      ],
      aiCompetitors: [
        makeAiCompetitor({
          url: 'https://competitor-a.com',
          overallScore: 90,
        }),
      ],
    })

    expect(matrix.competitors).toHaveLength(1)
    const comp = matrix.competitors[0]!
    expect(comp.url).toBe('https://competitor-a.com')
    // avg of (80 + 70 + 60 + 90) / 4 = 75
    expect(comp.overallScore).toBe(75)
    expect(comp.categoryScores.performance).toBe(80)
    expect(comp.categoryScores.seo).toBe(70)
    expect(comp.categoryScores.accessibility).toBe(60)
    expect(comp.categoryScores.content).toBe(90)
  })

  it('should deduplicate competitors by hostname (www. stripped)', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 50,
        seo: 50,
        accessibility: 50,
        content: 50,
        geo: 50,
        overall: 50,
      },
      crawlResults: [makeCrawlResult({ url: 'https://www.competitor-a.com' })],
      aiCompetitors: [makeAiCompetitor({ url: 'https://competitor-a.com' })],
    })

    // Should be 1 competitor, not 2
    expect(matrix.competitors).toHaveLength(1)
  })

  it('should handle empty crawl + AI results', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 90,
        seo: 85,
        accessibility: 80,
        content: 70,
        geo: 60,
        overall: 77,
      },
      crawlResults: [],
      aiCompetitors: [],
    })

    expect(matrix.competitors).toHaveLength(0)
    for (const cat of matrix.categories) {
      expect(cat.competitorScores).toHaveLength(0)
      expect(cat.winner).toBe(ORIGINAL_URL)
    }
  })

  it('should skip competitor category score when crawl data is null', () => {
    const matrix = buildMatrix({
      originalUrl: ORIGINAL_URL,
      originalScores: {
        performance: 50,
        seo: 50,
        accessibility: 50,
        content: 50,
        geo: 50,
        overall: 50,
      },
      crawlResults: [
        makeCrawlResult({
          url: 'https://broken.com',
          performance: null,
          seo: null,
          accessibility: null,
        }),
      ],
      aiCompetitors: [],
    })

    const perfCat = matrix.categories.find((c) => c.id === 'performance')!
    expect(perfCat.competitorScores).toHaveLength(0)
  })
})
