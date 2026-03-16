import { describe, it, expect } from 'vitest'
import { generateSwotAnalysis, deduplicateAndLimit } from '../generate-swot'
import type { GenerateSwotParams } from '../generate-swot'
import type {
  AIAgentResult,
  SwotAnalysis,
  CompetitorAnalysis,
} from '../../types'
import type { CategoryScore, OverallScore } from '@/features/diagnosis-free'

// ─── 헬퍼: 최소 데이터 팩토리 ───

function makeAgentResult(
  overrides: Partial<AIAgentResult> & Pick<AIAgentResult, 'agentId'>
): AIAgentResult {
  return {
    status: 'completed',
    insights: [],
    tokenUsage: { input: 100, output: 200 },
    durationMs: 1000,
    ...overrides,
  }
}

function makeCategoryScore(
  overrides: Partial<CategoryScore> & Pick<CategoryScore, 'id' | 'score'>
): CategoryScore {
  return {
    name: overrides.id,
    weight: 1,
    rules: [],
    passedCount: 5,
    totalCount: 10,
    skippedCount: 0,
    ...overrides,
  }
}

function makeOverallScore(score: number): OverallScore {
  return {
    score,
    grade: score >= 70 ? 'good' : score >= 40 ? 'warning' : 'critical',
    gradeLabel: score >= 70 ? '양호' : score >= 40 ? '주의' : '심각',
    categories: [],
    quickWins: [],
    totalRules: 50,
    passedRules: 25,
    failedRules: 20,
    skippedRules: 5,
    evaluatedAt: '2026-03-15T00:00:00Z',
  }
}

function makeBaseParams(
  overrides?: Partial<GenerateSwotParams>
): GenerateSwotParams {
  return {
    agentResults: [],
    categoryScores: [],
    overallScore: makeOverallScore(55),
    competitorSwot: null,
    ...overrides,
  }
}

// ─── deduplicateAndLimit ───

describe('deduplicateAndLimit', () => {
  it('should remove exact duplicates', () => {
    const result = deduplicateAndLimit(['a', 'b', 'a', 'c'])
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should remove substring duplicates (keep longer)', () => {
    const result = deduplicateAndLimit([
      'SEO 영역 우수',
      'SEO 영역 우수 (85점)',
    ])
    expect(result).toEqual(['SEO 영역 우수'])
  })

  it('should limit to 5 items', () => {
    const items = Array.from({ length: 10 }, (_, i) => `항목 ${i}`)
    const result = deduplicateAndLimit(items)
    expect(result).toHaveLength(5)
  })

  it('should skip empty strings', () => {
    const result = deduplicateAndLimit(['a', '', '  ', 'b'])
    expect(result).toEqual(['a', 'b'])
  })

  it('should return empty array for empty input', () => {
    expect(deduplicateAndLimit([])).toEqual([])
  })
})

// ─── generateSwotAnalysis ───

describe('generateSwotAnalysis', () => {
  it('should return empty SWOT when no data available', () => {
    const result = generateSwotAnalysis(makeBaseParams())

    expect(result.strengths).toEqual([])
    expect(result.weaknesses).toEqual([])
    expect(result.opportunities).toEqual([])
    expect(result.threats).toEqual([])
  })

  it('should use competitors SWOT as base when available', () => {
    const competitorSwot: SwotAnalysis = {
      strengths: ['경쟁사 SWOT 강점'],
      weaknesses: ['경쟁사 SWOT 약점'],
      opportunities: ['경쟁사 SWOT 기회'],
      threats: ['경쟁사 SWOT 위협'],
    }

    const result = generateSwotAnalysis(makeBaseParams({ competitorSwot }))

    expect(result.strengths).toContain('경쟁사 SWOT 강점')
    expect(result.weaknesses).toContain('경쟁사 SWOT 약점')
    expect(result.opportunities).toContain('경쟁사 SWOT 기회')
    expect(result.threats).toContain('경쟁사 SWOT 위협')
  })

  it('should add high-score categories to Strengths', () => {
    const categoryScores = [
      makeCategoryScore({ id: 'technical', score: 85, name: '기술' }),
      makeCategoryScore({ id: 'content', score: 30, name: '콘텐츠' }),
    ]

    const result = generateSwotAnalysis(makeBaseParams({ categoryScores }))

    expect(
      result.strengths.some((s) => s.includes('기술') && s.includes('85'))
    ).toBe(true)
  })

  it('should add low-score categories to Weaknesses', () => {
    const categoryScores = [
      makeCategoryScore({ id: 'security', score: 25, name: '보안' }),
    ]

    const result = generateSwotAnalysis(makeBaseParams({ categoryScores }))

    expect(
      result.weaknesses.some((w) => w.includes('보안') && w.includes('25'))
    ).toBe(true)
  })

  it('should add overall high score to Strengths', () => {
    const result = generateSwotAnalysis(
      makeBaseParams({ overallScore: makeOverallScore(78) })
    )

    expect(result.strengths.some((s) => s.includes('78점'))).toBe(true)
  })

  it('should classify critical insights as Weaknesses', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'technical',
        insights: [
          {
            title: 'HTTPS 미적용',
            description: '보안 위험',
            severity: 'critical',
            category: 'technical',
            actionable: true,
          },
        ],
      }),
    ]

    const result = generateSwotAnalysis(makeBaseParams({ agentResults }))

    expect(result.weaknesses.some((w) => w.includes('HTTPS 미적용'))).toBe(true)
  })

  it('should classify critical security/performance insights as Threats', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'technical',
        insights: [
          {
            title: 'SQL Injection 취약점',
            description: '보안 이슈',
            severity: 'critical',
            category: 'security',
            actionable: true,
          },
        ],
      }),
    ]

    const result = generateSwotAnalysis(makeBaseParams({ agentResults }))

    expect(result.threats.some((t) => t.includes('SQL Injection'))).toBe(true)
  })

  it('should classify actionable warnings as Opportunities', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'seo',
        insights: [
          {
            title: '메타 태그 개선 가능',
            description: '최적화 여지',
            severity: 'warning',
            category: 'seo',
            actionable: true,
          },
        ],
      }),
    ]

    const result = generateSwotAnalysis(makeBaseParams({ agentResults }))

    expect(result.opportunities.some((o) => o.includes('메타 태그 개선'))).toBe(
      true
    )
  })

  it('should classify non-actionable info as Strengths', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'geo',
        insights: [
          {
            title: 'Schema Markup 잘 적용됨',
            description: '양호',
            severity: 'info',
            category: 'geo',
            actionable: false,
          },
        ],
      }),
    ]

    const result = generateSwotAnalysis(makeBaseParams({ agentResults }))

    expect(result.strengths.some((s) => s.includes('Schema Markup'))).toBe(true)
  })

  it('should skip competitors agent insights (already in competitorSwot)', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'competitors',
        insights: [
          {
            title: '경쟁사 인사이트',
            description: '이미 SWOT에 반영됨',
            severity: 'info',
            category: 'seo',
            actionable: false,
          },
        ],
      }),
    ]

    const result = generateSwotAnalysis(makeBaseParams({ agentResults }))

    expect(result.strengths.some((s) => s.includes('경쟁사 인사이트'))).toBe(
      false
    )
  })

  it('should skip failed agent results', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'seo',
        status: 'failed',
        insights: [
          {
            title: '실패한 에이전트 인사이트',
            description: '무시되어야 함',
            severity: 'critical',
            category: 'seo',
            actionable: true,
          },
        ],
      }),
    ]

    const result = generateSwotAnalysis(makeBaseParams({ agentResults }))

    expect(result.weaknesses).toEqual([])
  })

  it('should enrich Threats from competitor strengths', () => {
    const competitorAnalyses: CompetitorAnalysis[] = [
      {
        url: 'https://rival.com',
        overallScore: 80,
        strengths: ['빠른 페이지 속도'],
        weaknesses: [],
        gaps: ['콘텐츠 부족'],
      },
    ]

    const result = generateSwotAnalysis(makeBaseParams({ competitorAnalyses }))

    expect(result.threats.some((t) => t.includes('빠른 페이지 속도'))).toBe(
      true
    )
  })

  it('should enrich Opportunities from competitor gaps', () => {
    const competitorAnalyses: CompetitorAnalysis[] = [
      {
        url: 'https://rival.com',
        overallScore: 60,
        strengths: [],
        weaknesses: [],
        gaps: ['모바일 최적화 미흡'],
      },
    ]

    const result = generateSwotAnalysis(makeBaseParams({ competitorAnalyses }))

    expect(result.opportunities.some((o) => o.includes('모바일 최적화'))).toBe(
      true
    )
  })

  it('should limit each SWOT category to 5 items max', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'technical',
        insights: Array.from({ length: 10 }, (_, i) => ({
          title: `심각 이슈 ${i}`,
          description: `설명 ${i}`,
          severity: 'critical' as const,
          category: 'technical' as const,
          actionable: true,
        })),
      }),
    ]

    const result = generateSwotAnalysis(makeBaseParams({ agentResults }))

    expect(result.weaknesses.length).toBeLessThanOrEqual(5)
  })

  it('should generate basic SWOT from 4 agents when competitors fails', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'technical',
        insights: [
          {
            title: '빠른 응답 속도',
            description: '양호',
            severity: 'info',
            category: 'technical',
            actionable: false,
          },
        ],
      }),
      makeAgentResult({
        agentId: 'seo',
        insights: [
          {
            title: '메타 태그 누락',
            description: '개선 필요',
            severity: 'warning',
            category: 'seo',
            actionable: true,
          },
        ],
      }),
      makeAgentResult({
        agentId: 'competitors',
        status: 'failed',
        insights: [],
      }),
    ]

    const categoryScores = [
      makeCategoryScore({ id: 'technical', score: 80, name: '기술' }),
    ]

    const result = generateSwotAnalysis(
      makeBaseParams({
        agentResults,
        categoryScores,
        competitorSwot: null,
      })
    )

    // 기술 에이전트 info → Strengths
    expect(result.strengths.some((s) => s.includes('빠른 응답'))).toBe(true)
    // 카테고리 80점 → Strengths
    expect(result.strengths.some((s) => s.includes('기술'))).toBe(true)
    // SEO warning actionable → Opportunities
    expect(result.opportunities.some((o) => o.includes('메타 태그'))).toBe(true)
  })

  it('should not mutate input competitorSwot', () => {
    const competitorSwot: SwotAnalysis = {
      strengths: ['원본 강점'],
      weaknesses: [],
      opportunities: [],
      threats: [],
    }
    const original = JSON.parse(JSON.stringify(competitorSwot))

    generateSwotAnalysis(
      makeBaseParams({
        competitorSwot,
        categoryScores: [
          makeCategoryScore({ id: 'technical', score: 90, name: '기술' }),
        ],
      })
    )

    expect(competitorSwot).toEqual(original)
  })
})
