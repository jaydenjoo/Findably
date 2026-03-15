import { describe, it, expect } from 'vitest'
import {
  parseAgentResponse,
  isValidInsight,
  normalizeInsight,
  parseCompetitorsResult,
  generateCmoSummaryFallback,
  parseCmoResponse,
  buildCrawlSummary,
} from '../run-diagnosis-paid'
import type { AIAgentResult, AIInsight } from '../../types'
import type { CrawlData } from '@/features/crawling'

// ─── isValidInsight ───

describe('isValidInsight', () => {
  it('should return true for valid insight', () => {
    expect(
      isValidInsight({
        title: 'Test',
        description: 'Desc',
        severity: 'critical',
      })
    ).toBe(true)
  })

  it('should return true for all valid severity levels', () => {
    for (const severity of ['critical', 'warning', 'info']) {
      expect(isValidInsight({ title: 'T', description: 'D', severity })).toBe(
        true
      )
    }
  })

  it('should return false when title is missing', () => {
    expect(isValidInsight({ description: 'Desc', severity: 'critical' })).toBe(
      false
    )
  })

  it('should return false when description is missing', () => {
    expect(isValidInsight({ title: 'T', severity: 'critical' })).toBe(false)
  })

  it('should return false for invalid severity', () => {
    expect(
      isValidInsight({ title: 'T', description: 'D', severity: 'high' })
    ).toBe(false)
  })

  it('should return false when severity is non-string', () => {
    expect(isValidInsight({ title: 'T', description: 'D', severity: 3 })).toBe(
      false
    )
  })
})

// ─── normalizeInsight ───

describe('normalizeInsight', () => {
  it('should normalize a complete insight', () => {
    const result = normalizeInsight({
      title: 'Title',
      description: 'Desc',
      severity: 'warning',
      category: 'seo',
      actionable: true,
      suggestedFix: 'Fix it',
    })

    expect(result).toEqual({
      title: 'Title',
      description: 'Desc',
      severity: 'warning',
      category: 'seo',
      actionable: true,
      suggestedFix: 'Fix it',
    })
  })

  it('should default category to technical when missing', () => {
    const result = normalizeInsight({
      title: 'T',
      description: 'D',
      severity: 'info',
    })

    expect(result.category).toBe('technical')
  })

  it('should default actionable to false when not true', () => {
    const result = normalizeInsight({
      title: 'T',
      description: 'D',
      severity: 'info',
      actionable: 'yes',
    })

    expect(result.actionable).toBe(false)
  })

  it('should omit suggestedFix when not a string', () => {
    const result = normalizeInsight({
      title: 'T',
      description: 'D',
      severity: 'info',
      suggestedFix: 123,
    })

    expect(result.suggestedFix).toBeUndefined()
  })
})

// ─── parseAgentResponse ───

describe('parseAgentResponse', () => {
  it('should parse valid JSON with insights array', () => {
    const content = JSON.stringify({
      insights: [
        {
          title: 'Issue 1',
          description: 'Desc 1',
          severity: 'critical',
          category: 'seo',
          actionable: true,
        },
      ],
      summary: 'Test summary',
    })

    const result = parseAgentResponse('seo', content)
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Issue 1')
  })

  it('should parse JSON wrapped in code block', () => {
    const content =
      '```json\n{"insights":[{"title":"T","description":"D","severity":"warning"}]}\n```'

    const result = parseAgentResponse('technical', content)
    expect(result).toHaveLength(1)
    expect(result[0]?.severity).toBe('warning')
  })

  it('should filter out invalid insights', () => {
    const content = JSON.stringify({
      insights: [
        { title: 'Valid', description: 'D', severity: 'info' },
        { title: 'Invalid' },
        { noTitle: true, description: 'D', severity: 'info' },
      ],
    })

    const result = parseAgentResponse('content', content)
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Valid')
  })

  it('should return empty array for non-JSON content', () => {
    const result = parseAgentResponse('seo', 'This is not JSON at all')
    expect(result).toEqual([])
  })

  it('should return empty array for JSON without insights key', () => {
    const result = parseAgentResponse('geo', JSON.stringify({ data: [] }))
    expect(result).toEqual([])
  })

  it('should return empty array for malformed JSON', () => {
    const result = parseAgentResponse('technical', '{invalid json}}}')
    expect(result).toEqual([])
  })
})

// ─── parseCompetitorsResult ───

describe('parseCompetitorsResult', () => {
  const makeResult = (rawResponse: string): AIAgentResult => ({
    agentId: 'competitors',
    status: 'completed',
    insights: [],
    rawResponse,
    tokenUsage: { input: 100, output: 200 },
    durationMs: 1000,
  })

  it('should return empty defaults when result is undefined', () => {
    const { swot, roadmap, competitors } = parseCompetitorsResult(undefined)

    expect(swot.strengths).toEqual([])
    expect(swot.weaknesses).toEqual([])
    expect(roadmap).toEqual([])
    expect(competitors).toEqual([])
  })

  it('should parse valid SWOT from rawResponse', () => {
    const raw = JSON.stringify({
      swot: {
        strengths: ['Good SEO'],
        weaknesses: ['Slow site'],
        opportunities: ['AI search'],
        threats: ['Competitors'],
      },
      roadmap: [],
      competitors: [],
    })

    const { swot } = parseCompetitorsResult(makeResult(raw))
    expect(swot.strengths).toEqual(['Good SEO'])
    expect(swot.threats).toEqual(['Competitors'])
  })

  it('should parse roadmap items', () => {
    const raw = JSON.stringify({
      swot: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      },
      roadmap: [
        {
          week: 1,
          title: 'Fix meta tags',
          description: 'Update all meta',
          category: 'seo',
          priority: 'high',
          estimatedImpact: 8,
        },
      ],
      competitors: [],
    })

    const { roadmap } = parseCompetitorsResult(makeResult(raw))
    expect(roadmap).toHaveLength(1)
    expect(roadmap[0]?.week).toBe(1)
  })

  it('should return empty SWOT for invalid swot structure', () => {
    const raw = JSON.stringify({
      swot: { only: 'partial' },
      roadmap: [],
      competitors: [],
    })

    const { swot } = parseCompetitorsResult(makeResult(raw))
    expect(swot.strengths).toEqual([])
  })

  it('should handle code-block wrapped JSON', () => {
    const raw =
      '```json\n{"swot":{"strengths":["A"],"weaknesses":[],"opportunities":[],"threats":[]},"roadmap":[],"competitors":[]}\n```'

    const { swot } = parseCompetitorsResult(makeResult(raw))
    expect(swot.strengths).toEqual(['A'])
  })

  it('should return empty defaults for malformed rawResponse', () => {
    const { swot, roadmap, competitors } = parseCompetitorsResult(
      makeResult('not json')
    )

    expect(swot.strengths).toEqual([])
    expect(roadmap).toEqual([])
    expect(competitors).toEqual([])
  })
})

// ─── generateCmoSummaryFallback ───

describe('generateCmoSummaryFallback', () => {
  const makeInsight = (severity: AIInsight['severity']): AIInsight => ({
    title: 'T',
    description: 'D',
    severity,
    category: 'technical',
    actionable: false,
  })

  it('should count severity levels correctly', () => {
    const insights: AIInsight[] = [
      makeInsight('critical'),
      makeInsight('critical'),
      makeInsight('warning'),
      makeInsight('info'),
      makeInsight('info'),
      makeInsight('info'),
    ]

    const summary = generateCmoSummaryFallback(insights)
    expect(summary).toBe('총 6개 인사이트 발견: 심각 2개, 주의 1개, 참고 3개')
  })

  it('should handle empty insights', () => {
    const summary = generateCmoSummaryFallback([])
    expect(summary).toBe('총 0개 인사이트 발견: 심각 0개, 주의 0개, 참고 0개')
  })

  it('should handle single severity type', () => {
    const insights: AIInsight[] = [
      makeInsight('warning'),
      makeInsight('warning'),
    ]

    const summary = generateCmoSummaryFallback(insights)
    expect(summary).toContain('주의 2개')
    expect(summary).toContain('심각 0개')
  })
})

// ─── buildCrawlSummary ───

describe('buildCrawlSummary', () => {
  const makeLayer1 = (
    overrides: Record<string, unknown> = {}
  ): CrawlData['layer1'] => ({
    meta: {
      title: 'Test Page',
      description: 'A test page',
      canonical: 'https://example.com',
      charset: 'utf-8',
      viewport: 'width=device-width',
      og: {},
      robots_meta: null,
    },
    headings: {
      h1: ['메인 제목'],
      h2: ['섹션 1', '섹션 2'],
      h3: ['하위 항목 A', '하위 항목 B'],
      h4: [],
      h5: [],
      h6: [],
    },
    schema_markup: [],
    links: { internal: 15, external: 5, broken: [] },
    images: { total: 10, without_alt: 2, large_images: [] },
    page_size_bytes: 51200,
    load_time_ms: 1200,
    html_lang: 'ko',
    ...overrides,
  })

  const makeBaseCrawlData = (
    layer1Override: Record<string, unknown> = {}
  ): CrawlData => ({
    crawled_at: '2026-03-15T00:00:00Z',
    duration_ms: 3000,
    is_partial: false,
    layer1: makeLayer1(layer1Override),
    robots_txt: null,
    sitemap: null,
    llms_txt: null,
    cms: null,
    mobile: null,
    layer2: null,
    layer3: null,
  })

  it('should extract full heading text, not just counts', () => {
    const result = buildCrawlSummary(makeBaseCrawlData())

    expect(result).toContain('H1: "메인 제목"')
    expect(result).toContain('- 섹션 1')
    expect(result).toContain('- 섹션 2')
    expect(result).toContain('- 하위 항목 A')
    expect(result).toContain('- 하위 항목 B')
    expect(result).toContain('H2 (2개)')
    expect(result).toContain('H3 (2개)')
  })

  it('should detect Schema Markup types', () => {
    const result = buildCrawlSummary(
      makeBaseCrawlData({
        schema_markup: [
          { '@type': 'Article', name: 'Test' },
          { '@type': 'FAQPage', name: 'FAQ' },
        ],
      })
    )

    expect(result).toContain('있음 (2개)')
    expect(result).toContain('Types: Article, FAQPage')
  })

  it('should truncate OG tag values longer than 60 characters', () => {
    const longDescription = 'A'.repeat(80)
    const result = buildCrawlSummary(
      makeBaseCrawlData({
        meta: {
          title: 'Test',
          description: 'Desc',
          canonical: null,
          charset: 'utf-8',
          viewport: null,
          og: { description: longDescription, title: 'Short' },
          robots_meta: null,
        },
      })
    )

    expect(result).toContain('og:description: ' + 'A'.repeat(60) + '...')
    expect(result).toContain('og:title: Short')
    expect(result).not.toContain('A'.repeat(80))
  })

  it('should include image details with alt and size info', () => {
    const result = buildCrawlSummary(
      makeBaseCrawlData({
        images: {
          total: 10,
          without_alt: 2,
          large_images: [
            { src: 'big1.jpg', size_kb: 500 },
            { src: 'big2.jpg', size_kb: 600 },
            { src: 'big3.jpg', size_kb: 700 },
          ],
        },
      })
    )

    expect(result).toContain('총 10개 (alt 미설정: 2개, 용량 초과: 3개)')
  })

  it('should include link analysis with broken link count', () => {
    const result = buildCrawlSummary(
      makeBaseCrawlData({
        links: {
          internal: 15,
          external: 5,
          broken: [
            { url: '/dead1', status: 404 },
            { url: '/dead2', status: 500 },
          ],
        },
      })
    )

    expect(result).toContain('내부링크: 15개, 외부링크: 5개, 깨진링크: 2개')
  })

  it('should handle missing headings/schema/OG gracefully', () => {
    const result = buildCrawlSummary(
      makeBaseCrawlData({
        headings: {
          h1: [],
          h2: [],
          h3: [],
          h4: [],
          h5: [],
          h6: [],
        },
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
        html_lang: null,
      })
    )

    expect(result).toContain('H1 없음')
    expect(result).not.toContain('H2 (')
    expect(result).toContain('없음')
    expect(result).not.toContain('OG 태그')
    expect(result).toContain('언어: 미설정')
  })
})

// ─── parseCmoResponse ───

describe('parseCmoResponse', () => {
  it('should parse valid CMO JSON response', () => {
    const content = JSON.stringify({
      executive_summary: '전반적으로 양호한 마케팅 상태입니다.',
      quality_score: 85,
      issues_found: [
        {
          type: 'duplicate',
          description: '중복 인사이트',
          related_insights: ['인사이트 A', '인사이트 B'],
        },
      ],
    })

    const result = parseCmoResponse(content)
    expect(result).not.toBeNull()
    expect(result?.executive_summary).toBe(
      '전반적으로 양호한 마케팅 상태입니다.'
    )
    expect(result?.quality_score).toBe(85)
    expect(result?.issues_found).toHaveLength(1)
    expect(result?.issues_found[0]?.type).toBe('duplicate')
  })

  it('should parse JSON wrapped in code block', () => {
    const content =
      '```json\n{"executive_summary":"요약","quality_score":70,"issues_found":[]}\n```'

    const result = parseCmoResponse(content)
    expect(result).not.toBeNull()
    expect(result?.executive_summary).toBe('요약')
    expect(result?.quality_score).toBe(70)
    expect(result?.issues_found).toEqual([])
  })

  it('should return null for missing executive_summary', () => {
    const content = JSON.stringify({
      quality_score: 50,
      issues_found: [],
    })

    expect(parseCmoResponse(content)).toBeNull()
  })

  it('should return null for missing quality_score', () => {
    const content = JSON.stringify({
      executive_summary: '요약',
      issues_found: [],
    })

    expect(parseCmoResponse(content)).toBeNull()
  })

  it('should return null for non-JSON content', () => {
    expect(parseCmoResponse('이것은 JSON이 아닙니다')).toBeNull()
  })

  it('should return null for malformed JSON', () => {
    expect(parseCmoResponse('{invalid json}}}')).toBeNull()
  })

  it('should default issues_found to empty array when not provided', () => {
    const content = JSON.stringify({
      executive_summary: '요약 텍스트',
      quality_score: 60,
    })

    const result = parseCmoResponse(content)
    expect(result?.issues_found).toEqual([])
  })

  it('should default issues_found to empty array when not an array', () => {
    const content = JSON.stringify({
      executive_summary: '요약',
      quality_score: 60,
      issues_found: 'not an array',
    })

    const result = parseCmoResponse(content)
    expect(result?.issues_found).toEqual([])
  })
})
