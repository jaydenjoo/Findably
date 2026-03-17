import { describe, it, expect } from 'vitest'
import { generateRoadmap } from '../generate-roadmap'
import type { GenerateRoadmapParams } from '../generate-roadmap'
import type {
  AIAgentResult,
  RoadmapItem,
  CompetitorAnalysis,
} from '../../types'
import type {
  CategoryScore,
  OverallScore,
  QuickWin,
} from '@/features/diagnosis-free'

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
    evaluatedAt: '2026-03-16T00:00:00Z',
  }
}

function makeQuickWin(
  overrides: Partial<QuickWin> & Pick<QuickWin, 'ruleName'>
): QuickWin {
  return {
    ruleId: 'rule-1',
    category: 'technical',
    severity: 'warning',
    message: '개선이 필요합니다',
    impact: 5,
    source: 'rule',
    ...overrides,
  }
}

function makeRoadmapItem(
  overrides: Partial<RoadmapItem> & Pick<RoadmapItem, 'title'>
): RoadmapItem {
  return {
    week: 1,
    description: '설명',
    category: 'seo',
    priority: 'medium',
    estimatedImpact: 5,
    ...overrides,
  }
}

function makeBaseParams(
  overrides?: Partial<GenerateRoadmapParams>
): GenerateRoadmapParams {
  return {
    agentResults: [],
    categoryScores: [],
    overallScore: makeOverallScore(55),
    quickWins: [],
    competitorRoadmap: [],
    ...overrides,
  }
}

// ─── 기본 동작 ───

describe('generateRoadmap', () => {
  it('should return at least overall summary when no data available', () => {
    const result = generateRoadmap(makeBaseParams())

    // 최소 총평 항목 1개
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result.some((r) => r.week === 12)).toBe(true)
  })

  it('should use competitors roadmap as base when available', () => {
    const competitorRoadmap: RoadmapItem[] = [
      makeRoadmapItem({ title: '경쟁사 기반 항목', week: 3, priority: 'high' }),
    ]

    const result = generateRoadmap(makeBaseParams({ competitorRoadmap }))

    expect(result.some((r) => r.title === '경쟁사 기반 항목')).toBe(true)
  })

  it('should generate roadmap without competitors (fallback)', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'technical',
        insights: [
          {
            title: 'HTTPS 미적용',
            description: '보안 위험',
            severity: 'critical',
            category: 'security',
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

    const quickWins = [makeQuickWin({ ruleName: '빠른 개선 항목' })]

    const result = generateRoadmap(
      makeBaseParams({ agentResults, quickWins, competitorRoadmap: [] })
    )

    expect(result.length).toBeGreaterThan(1)
    expect(result.some((r) => r.title.includes('HTTPS'))).toBe(true)
    expect(result.some((r) => r.title === '빠른 개선 항목')).toBe(true)
  })

  // ─── Phase 1: 즉시 실행 (Week 1–4) ───

  describe('Phase 1 — Quick Win', () => {
    it('should place Quick Wins in week 1–2 with high priority', () => {
      const quickWins = [
        makeQuickWin({ ruleName: 'QW 1', severity: 'critical' }),
        makeQuickWin({ ruleName: 'QW 2', severity: 'warning' }),
      ]

      const result = generateRoadmap(makeBaseParams({ quickWins }))

      const qw1 = result.find((r) => r.title === 'QW 1')
      const qw2 = result.find((r) => r.title === 'QW 2')

      expect(qw1).toBeDefined()
      expect(qw1!.week).toBe(1)
      expect(qw1!.priority).toBe('high')

      expect(qw2).toBeDefined()
      expect(qw2!.week).toBe(2)
      expect(qw2!.priority).toBe('high')
    })

    it('should move excess Quick Wins (>3) to Phase 2', () => {
      const quickWins = Array.from({ length: 5 }, (_, i) =>
        makeQuickWin({ ruleName: `QW ${i}`, ruleId: `rule-${i}` })
      )

      const result = generateRoadmap(makeBaseParams({ quickWins }))

      const phase1 = result.filter(
        (r) => r.title.startsWith('QW') && r.week <= 4
      )
      const phase2 = result.filter(
        (r) => r.title.startsWith('QW') && r.week >= 5
      )

      expect(phase1.length).toBeLessThanOrEqual(3)
      expect(phase2.length).toBeGreaterThan(0)
    })
  })

  describe('Phase 1 — Critical insights', () => {
    it('should place critical insights in week 3 with high priority', () => {
      const agentResults = [
        makeAgentResult({
          agentId: 'technical',
          insights: [
            {
              title: '심각한 보안 취약점',
              description: '즉시 수정 필요',
              severity: 'critical',
              category: 'security',
              actionable: true,
            },
          ],
        }),
      ]

      const result = generateRoadmap(makeBaseParams({ agentResults }))

      const item = result.find((r) => r.title.includes('심각한 보안'))
      expect(item).toBeDefined()
      expect(item!.week).toBe(3)
      expect(item!.priority).toBe('high')
      expect(item!.estimatedImpact).toBe(9)
    })
  })

  describe('Phase 1 — Low score categories', () => {
    it('should place low-score categories (<40) in week 4', () => {
      const categoryScores = [
        makeCategoryScore({ id: 'security', score: 25, name: '보안' }),
      ]

      const result = generateRoadmap(makeBaseParams({ categoryScores }))

      const item = result.find(
        (r) => r.title.includes('보안') && r.title.includes('긴급')
      )
      expect(item).toBeDefined()
      expect(item!.week).toBe(4)
      expect(item!.priority).toBe('high')
    })
  })

  // ─── Phase 2: 단기 개선 (Week 5–8) ───

  describe('Phase 2 — Warning insights', () => {
    it('should place actionable warnings in week 6 with medium priority', () => {
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

      const result = generateRoadmap(makeBaseParams({ agentResults }))

      const item = result.find((r) => r.title.includes('메타 태그'))
      expect(item).toBeDefined()
      expect(item!.week).toBe(6)
      expect(item!.priority).toBe('medium')
      expect(item!.estimatedImpact).toBe(7)
    })
  })

  describe('Phase 2 — Competitor gaps', () => {
    it('should place competitor gaps in week 7', () => {
      const competitorAnalyses: CompetitorAnalysis[] = [
        {
          url: 'https://rival.com',
          overallScore: 60,
          strengths: [],
          weaknesses: [],
          gaps: ['모바일 최적화 미흡'],
        },
      ]

      const result = generateRoadmap(makeBaseParams({ competitorAnalyses }))

      const item = result.find((r) => r.title.includes('모바일 최적화'))
      expect(item).toBeDefined()
      expect(item!.week).toBe(7)
      expect(item!.priority).toBe('medium')
    })
  })

  describe('Phase 2 — Mid score categories', () => {
    it('should place mid-score categories (40–69) in week 8', () => {
      const categoryScores = [
        makeCategoryScore({ id: 'content', score: 55, name: '콘텐츠' }),
      ]

      const result = generateRoadmap(makeBaseParams({ categoryScores }))

      const item = result.find(
        (r) => r.title.includes('콘텐츠') && r.title.includes('개선')
      )
      expect(item).toBeDefined()
      expect(item!.week).toBe(8)
      expect(item!.priority).toBe('medium')
    })
  })

  // ─── Phase 3: 중장기 최적화 (Week 9–12) ───

  describe('Phase 3 — Info insights', () => {
    it('should place actionable info in week 10 with low priority', () => {
      const agentResults = [
        makeAgentResult({
          agentId: 'geo',
          insights: [
            {
              title: 'Schema 확장 가능',
              description: '추가 마크업 적용',
              severity: 'info',
              category: 'geo',
              actionable: true,
            },
          ],
        }),
      ]

      const result = generateRoadmap(makeBaseParams({ agentResults }))

      const item = result.find((r) => r.title.includes('Schema 확장'))
      expect(item).toBeDefined()
      expect(item!.week).toBe(10)
      expect(item!.priority).toBe('low')
      expect(item!.estimatedImpact).toBe(4)
    })
  })

  describe('Phase 3 — Competitor strengths', () => {
    it('should place competitor strength responses in week 11', () => {
      const competitorAnalyses: CompetitorAnalysis[] = [
        {
          url: 'https://rival.com',
          overallScore: 80,
          strengths: ['빠른 페이지 속도'],
          weaknesses: [],
          gaps: [],
        },
      ]

      const result = generateRoadmap(makeBaseParams({ competitorAnalyses }))

      const item = result.find((r) => r.title.includes('빠른 페이지 속도'))
      expect(item).toBeDefined()
      expect(item!.week).toBe(11)
      expect(item!.priority).toBe('low')
    })
  })

  describe('Phase 3 — Overall summary', () => {
    it('should include overall summary at week 12', () => {
      const result = generateRoadmap(
        makeBaseParams({ overallScore: makeOverallScore(47) })
      )

      const item = result.find((r) => r.week === 12)
      expect(item).toBeDefined()
      expect(item!.title).toContain('성과 점검')
      expect(item!.description).toContain('47점')
    })
  })

  // ─── 제한/중복 ───

  describe('limits and deduplication', () => {
    it('should limit total items to 24', () => {
      const agentResults = [
        makeAgentResult({
          agentId: 'technical',
          insights: Array.from({ length: 15 }, (_, i) => ({
            title: `기술 이슈 ${i}`,
            description: `설명 ${i}`,
            severity: 'critical' as const,
            category: `technical` as const,
            actionable: true,
          })),
        }),
        makeAgentResult({
          agentId: 'seo',
          insights: Array.from({ length: 15 }, (_, i) => ({
            title: `SEO 이슈 ${i}`,
            description: `설명 ${i}`,
            severity: 'warning' as const,
            category: 'seo' as const,
            actionable: true,
          })),
        }),
      ]

      const result = generateRoadmap(makeBaseParams({ agentResults }))

      expect(result.length).toBeLessThanOrEqual(24)
    })

    it('should limit items per week to 3', () => {
      const quickWins = Array.from({ length: 5 }, (_, i) =>
        makeQuickWin({
          ruleName: `Critical QW ${i}`,
          ruleId: `rule-${i}`,
          severity: 'critical',
        })
      )

      const result = generateRoadmap(makeBaseParams({ quickWins }))

      const weekCounts = new Map<number, number>()
      for (const item of result) {
        weekCounts.set(item.week, (weekCounts.get(item.week) ?? 0) + 1)
      }

      for (const [, count] of weekCounts) {
        expect(count).toBeLessThanOrEqual(3)
      }
    })

    it('should deduplicate items with similar titles', () => {
      const competitorRoadmap: RoadmapItem[] = [
        makeRoadmapItem({ title: 'HTTPS 적용 필요', week: 2 }),
      ]

      const agentResults = [
        makeAgentResult({
          agentId: 'technical',
          insights: [
            {
              title: 'HTTPS 적용 필요',
              description: '동일 이슈',
              severity: 'critical',
              category: 'security',
              actionable: true,
            },
          ],
        }),
      ]

      const result = generateRoadmap(
        makeBaseParams({ competitorRoadmap, agentResults })
      )

      const httpsItems = result.filter((r) =>
        r.title.includes('HTTPS 적용 필요')
      )
      expect(httpsItems.length).toBe(1)
    })

    it('should deduplicate when one title contains another', () => {
      const competitorRoadmap: RoadmapItem[] = [
        makeRoadmapItem({ title: 'SEO 개선', week: 5 }),
      ]

      const agentResults = [
        makeAgentResult({
          agentId: 'seo',
          insights: [
            {
              title: 'SEO 개선',
              description: '더 상세한 설명',
              severity: 'warning',
              category: 'seo',
              actionable: true,
            },
          ],
        }),
      ]

      const result = generateRoadmap(
        makeBaseParams({ competitorRoadmap, agentResults })
      )

      // "SEO 개선" vs "[seo] SEO 개선" — 후자가 전자 포함 → 중복 제거
      const seoItems = result.filter(
        (r) => r.title === 'SEO 개선' || r.title === '[seo] SEO 개선'
      )
      expect(seoItems.length).toBe(1)
    })
  })

  // ─── 에이전트 스킵 ───

  describe('agent filtering', () => {
    it('should skip competitors agent insights (already in roadmap)', () => {
      const agentResults = [
        makeAgentResult({
          agentId: 'competitors',
          insights: [
            {
              title: '경쟁사 인사이트',
              description: '이미 로드맵에 반영됨',
              severity: 'critical',
              category: 'seo',
              actionable: true,
            },
          ],
        }),
      ]

      const result = generateRoadmap(makeBaseParams({ agentResults }))

      expect(result.some((r) => r.title.includes('경쟁사 인사이트'))).toBe(
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
              title: '실패한 에이전트',
              description: '무시되어야 함',
              severity: 'critical',
              category: 'seo',
              actionable: true,
            },
          ],
        }),
      ]

      const result = generateRoadmap(makeBaseParams({ agentResults }))

      expect(result.some((r) => r.title.includes('실패한 에이전트'))).toBe(
        false
      )
    })
  })

  // ─── estimatedImpact ───

  describe('estimatedImpact mapping', () => {
    it('should assign impact 9 for critical severity', () => {
      const agentResults = [
        makeAgentResult({
          agentId: 'technical',
          insights: [
            {
              title: 'Critical 항목',
              description: '설명',
              severity: 'critical',
              category: 'technical',
              actionable: true,
            },
          ],
        }),
      ]

      const result = generateRoadmap(makeBaseParams({ agentResults }))

      const item = result.find((r) => r.title.includes('Critical 항목'))
      expect(item?.estimatedImpact).toBe(9)
    })

    it('should assign impact 7 for warning severity', () => {
      const agentResults = [
        makeAgentResult({
          agentId: 'seo',
          insights: [
            {
              title: 'Warning 항목',
              description: '설명',
              severity: 'warning',
              category: 'seo',
              actionable: true,
            },
          ],
        }),
      ]

      const result = generateRoadmap(makeBaseParams({ agentResults }))

      const item = result.find((r) => r.title.includes('Warning 항목'))
      expect(item?.estimatedImpact).toBe(7)
    })

    it('should assign impact 4 for info severity', () => {
      const agentResults = [
        makeAgentResult({
          agentId: 'geo',
          insights: [
            {
              title: 'Info 항목',
              description: '설명',
              severity: 'info',
              category: 'geo',
              actionable: true,
            },
          ],
        }),
      ]

      const result = generateRoadmap(makeBaseParams({ agentResults }))

      const item = result.find((r) => r.title.includes('Info 항목'))
      expect(item?.estimatedImpact).toBe(4)
    })
  })

  // ─── 불변성 ───

  it('should not mutate input competitorRoadmap', () => {
    const competitorRoadmap: RoadmapItem[] = [
      makeRoadmapItem({ title: '원본 항목', week: 3 }),
    ]
    const original = JSON.parse(JSON.stringify(competitorRoadmap))

    generateRoadmap(
      makeBaseParams({
        competitorRoadmap,
        quickWins: [makeQuickWin({ ruleName: '추가 항목' })],
      })
    )

    expect(competitorRoadmap).toEqual(original)
  })

  // ─── 카테고리별 인사이트 제한 ───

  it('should limit insights per category to 3', () => {
    const agentResults = [
      makeAgentResult({
        agentId: 'technical',
        insights: Array.from({ length: 6 }, (_, i) => ({
          title: `기술 critical ${i}`,
          description: `설명 ${i}`,
          severity: 'critical' as const,
          category: 'technical' as const,
          actionable: true,
        })),
      }),
    ]

    const result = generateRoadmap(makeBaseParams({ agentResults }))

    const techCriticals = result.filter(
      (r) =>
        r.title.includes('[technical]') && r.title.includes('기술 critical')
    )
    expect(techCriticals.length).toBeLessThanOrEqual(3)
  })
})
