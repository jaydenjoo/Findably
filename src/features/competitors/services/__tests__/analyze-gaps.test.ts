import { describe, it, expect } from 'vitest'
import { analyzeGaps } from '../analyze-gaps'
import type { ComparisonMatrix, MatrixCategory } from '../../types'

function makeCategory(overrides: Partial<MatrixCategory> = {}): MatrixCategory {
  return {
    id: 'performance',
    label: '성능',
    originalScore: 50,
    competitorScores: [{ url: 'https://competitor.com', score: 80 }],
    winner: 'https://competitor.com',
    ...overrides,
  }
}

function makeMatrix(
  overrides: Partial<ComparisonMatrix> = {}
): ComparisonMatrix {
  return {
    originalUrl: 'https://example.com',
    originalOverallScore: 60,
    categories: [
      makeCategory({ id: 'performance', label: '성능', originalScore: 50 }),
      makeCategory({ id: 'seo', label: 'SEO', originalScore: 40 }),
      makeCategory({
        id: 'accessibility',
        label: '접근성',
        originalScore: 90,
        competitorScores: [{ url: 'https://competitor.com', score: 70 }],
        winner: 'https://example.com',
      }),
      makeCategory({
        id: 'content',
        label: '콘텐츠',
        originalScore: 60,
        competitorScores: [{ url: 'https://competitor.com', score: 65 }],
        winner: 'https://competitor.com',
      }),
      makeCategory({
        id: 'geo',
        label: 'GEO/AI',
        originalScore: 55,
        competitorScores: [],
        winner: 'https://example.com',
      }),
    ],
    competitors: [
      { url: 'https://competitor.com', overallScore: 70, categoryScores: {} },
    ],
    ...overrides,
  }
}

describe('analyzeGaps', () => {
  it('should only report negative gaps (original behind)', () => {
    const result = analyzeGaps(makeMatrix())

    // performance: 50 vs 80 → gap -30 ✓
    // seo: 40 vs 80 → gap -40 ✓
    // accessibility: 90 vs 70 → original ahead, no gap
    // content: 60 vs 65 → gap -5 ✓
    // geo: no competitor scores → no gap
    expect(result.gaps).toHaveLength(3)
    // Both seo(-40) and performance(-30) are critical → same severity, order by iteration
    const categories = result.gaps.map((g) => g.category)
    expect(categories).toContain('performance')
    expect(categories).toContain('seo')
    expect(categories).toContain('content')
    // info-level content gap should be last
    expect(categories[2]).toBe('content')
  })

  it('should classify critical severity (gap >= 20)', () => {
    const result = analyzeGaps(makeMatrix())

    const seoGap = result.gaps.find((g) => g.category === 'seo')!
    expect(seoGap.severity).toBe('critical') // gap = -40
    expect(seoGap.gap).toBe(-40)

    const perfGap = result.gaps.find((g) => g.category === 'performance')!
    expect(perfGap.severity).toBe('critical') // gap = -30
  })

  it('should classify info severity (gap < 10)', () => {
    const result = analyzeGaps(makeMatrix())

    const contentGap = result.gaps.find((g) => g.category === 'content')!
    expect(contentGap.severity).toBe('info') // gap = -5
  })

  it('should classify warning severity (10 <= gap < 20)', () => {
    const matrix = makeMatrix({
      categories: [
        makeCategory({
          id: 'performance',
          label: '성능',
          originalScore: 65,
          competitorScores: [{ url: 'https://competitor.com', score: 80 }],
        }),
      ],
    })

    const result = analyzeGaps(matrix)
    expect(result.gaps[0]!.severity).toBe('warning') // gap = -15
  })

  it('should sort gaps by severity: critical → warning → info', () => {
    const result = analyzeGaps(makeMatrix())

    const severities = result.gaps.map((g) => g.severity)
    const order = { critical: 0, warning: 1, info: 2 }
    for (let i = 1; i < severities.length; i++) {
      expect(order[severities[i]!]).toBeGreaterThanOrEqual(
        order[severities[i - 1]!]
      )
    }
  })

  it('should return empty gaps when original leads all categories', () => {
    const matrix = makeMatrix({
      categories: [
        makeCategory({
          id: 'performance',
          originalScore: 95,
          competitorScores: [{ url: 'https://competitor.com', score: 70 }],
        }),
      ],
      competitors: [
        { url: 'https://competitor.com', overallScore: 70, categoryScores: {} },
      ],
    })

    const result = analyzeGaps(matrix)
    expect(result.gaps).toHaveLength(0)
    expect(result.summary).toContain('모든 카테고리에서 우위')
  })

  it('should skip categories with no competitor scores', () => {
    const matrix = makeMatrix({
      categories: [
        makeCategory({
          id: 'geo',
          label: 'GEO/AI',
          originalScore: 30,
          competitorScores: [],
        }),
      ],
    })

    const result = analyzeGaps(matrix)
    expect(result.gaps).toHaveLength(0)
  })

  it('should assess leading position when original is far ahead', () => {
    const matrix = makeMatrix({
      originalOverallScore: 85,
      competitors: [
        { url: 'https://competitor.com', overallScore: 60, categoryScores: {} },
      ],
    })

    const result = analyzeGaps(matrix)
    expect(result.competitivePosition).toBe('leading')
  })

  it('should assess lagging position when original is far behind', () => {
    const matrix = makeMatrix({
      originalOverallScore: 40,
      competitors: [
        { url: 'https://competitor.com', overallScore: 80, categoryScores: {} },
      ],
    })

    const result = analyzeGaps(matrix)
    expect(result.competitivePosition).toBe('lagging')
  })

  it('should assess competitive position when scores are close', () => {
    const matrix = makeMatrix({
      originalOverallScore: 72,
      competitors: [
        { url: 'https://competitor.com', overallScore: 75, categoryScores: {} },
      ],
    })

    const result = analyzeGaps(matrix)
    expect(result.competitivePosition).toBe('competitive')
  })

  it('should return leading when no competitors exist', () => {
    const matrix = makeMatrix({
      competitors: [],
    })

    const result = analyzeGaps(matrix)
    expect(result.competitivePosition).toBe('leading')
  })

  it('should include description and suggestedAction for each gap', () => {
    const result = analyzeGaps(makeMatrix())

    for (const gap of result.gaps) {
      expect(gap.description).toBeTruthy()
      expect(gap.suggestedAction).toBeTruthy()
    }
  })

  it('should assign high impact for critical gaps in high-impact categories', () => {
    const matrix = makeMatrix({
      categories: [
        makeCategory({
          id: 'performance',
          label: '성능',
          originalScore: 30,
          competitorScores: [{ url: 'https://c.com', score: 80 }],
          winner: 'https://c.com',
        }),
      ],
    })

    const result = analyzeGaps(matrix)
    // performance is high impact + gap 50 >= critical threshold
    expect(result.gaps[0]!.estimatedImpact).toBe('high')
  })

  it('should assign medium impact for warning-level gaps', () => {
    const matrix = makeMatrix({
      categories: [
        makeCategory({
          id: 'content',
          label: '콘텐츠',
          originalScore: 55,
          competitorScores: [{ url: 'https://c.com', score: 70 }],
          winner: 'https://c.com',
        }),
      ],
    })

    const result = analyzeGaps(matrix)
    // content is NOT high impact, gap 15 >= warning threshold
    expect(result.gaps[0]!.estimatedImpact).toBe('medium')
  })

  it('should build summary with gap counts', () => {
    const result = analyzeGaps(makeMatrix())

    expect(result.summary).toContain('심각한 격차 2개') // seo + performance = critical
    expect(result.summary).toContain('경쟁 포지션')
  })
})
