import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { CrawlData } from '@/features/crawling'
import type { RuleDefinition } from '../types'

// ─── Mock ALL_RULES ───

const mockRules: RuleDefinition[] = []

vi.mock('../rules', () => ({
  get ALL_RULES() {
    return mockRules
  },
}))

// mock 후에 import (호이스팅 되지만 명시적으로)
const { evaluate } = await import('../engine')

// ─── Helpers ───

function createRule(overrides: Partial<RuleDefinition> = {}): RuleDefinition {
  return {
    id: 'test-rule',
    category: 'technical',
    name: 'Test Rule',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: () => true,
    evaluate: () => ({ passed: true, message: '통과' }),
    ...overrides,
  }
}

function createMockCrawlData(): CrawlData {
  return {
    crawled_at: '2026-03-15T00:00:00Z',
    duration_ms: 1000,
    is_partial: false,
    layer1: null,
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
  }
}

beforeEach(() => {
  mockRules.length = 0
})

// ─── Task 4.4: Quick Win 자동 식별 ───

describe('Quick Win 식별', () => {
  it('should include only failed, non-skipped, quickWinEligible rules', () => {
    mockRules.push(
      createRule({
        id: 'pass',
        evaluate: () => ({ passed: true, message: '통과' }),
        quickWinEligible: true,
      }),
      createRule({
        id: 'fail-eligible',
        evaluate: () => ({ passed: false, message: '실패' }),
        quickWinEligible: true,
      }),
      createRule({
        id: 'fail-not-eligible',
        evaluate: () => ({ passed: false, message: '실패' }),
        quickWinEligible: false,
      }),
      createRule({
        id: 'skipped',
        isEvaluable: () => false,
        quickWinEligible: true,
      })
    )

    const result = evaluate(createMockCrawlData())

    expect(result.quickWins).toHaveLength(1)
    expect(result.quickWins[0]!.ruleId).toBe('fail-eligible')
  })

  it('should sort by severity priority + impact (critical > warning > info)', () => {
    mockRules.push(
      createRule({
        id: 'info-high-points',
        severity: 'info',
        maxPoints: 15,
        quickWinEligible: true,
        evaluate: () => ({ passed: false, message: 'info 실패' }),
      }),
      createRule({
        id: 'warning-mid-points',
        severity: 'warning',
        maxPoints: 10,
        quickWinEligible: true,
        evaluate: () => ({ passed: false, message: 'warning 실패' }),
      }),
      createRule({
        id: 'critical-low-points',
        severity: 'critical',
        maxPoints: 5,
        quickWinEligible: true,
        evaluate: () => ({ passed: false, message: 'critical 실패' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    // critical(30+5=35) > warning(20+10=30) > info(10+15=25)
    expect(result.quickWins.map((q) => q.ruleId)).toEqual([
      'critical-low-points',
      'warning-mid-points',
      'info-high-points',
    ])
  })

  it('should use impact as tiebreaker within same severity', () => {
    mockRules.push(
      createRule({
        id: 'warning-5',
        severity: 'warning',
        maxPoints: 5,
        quickWinEligible: true,
        evaluate: () => ({ passed: false, message: '실패' }),
      }),
      createRule({
        id: 'warning-10',
        severity: 'warning',
        maxPoints: 10,
        quickWinEligible: true,
        evaluate: () => ({ passed: false, message: '실패' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    expect(result.quickWins[0]!.ruleId).toBe('warning-10')
    expect(result.quickWins[1]!.ruleId).toBe('warning-5')
  })

  it('should return empty array when no quick wins', () => {
    mockRules.push(
      createRule({
        id: 'pass',
        evaluate: () => ({ passed: true, message: '통과' }),
        quickWinEligible: true,
      })
    )

    const result = evaluate(createMockCrawlData())
    expect(result.quickWins).toEqual([])
  })

  it('should map QuickWin fields correctly including difficulty', () => {
    mockRules.push(
      createRule({
        id: 'title-missing',
        category: 'content',
        name: '타이틀 누락',
        maxPoints: 8,
        severity: 'critical',
        quickWinEligible: true,
        difficulty: 'easy',
        evaluate: () => ({ passed: false, message: '타이틀이 없습니다' }),
      })
    )

    const result = evaluate(createMockCrawlData())
    const qw = result.quickWins[0]!

    expect(qw).toEqual({
      ruleId: 'title-missing',
      ruleName: '타이틀 누락',
      category: 'content',
      severity: 'critical',
      message: '타이틀이 없습니다',
      impact: 8,
      source: 'rule',
      difficulty: 'easy',
    })
  })

  it('should default difficulty to medium when not set on rule', () => {
    mockRules.push(
      createRule({
        id: 'no-difficulty',
        quickWinEligible: true,
        evaluate: () => ({ passed: false, message: '실패' }),
        // difficulty 미설정 — 하위 호환
      })
    )

    const result = evaluate(createMockCrawlData())
    const qw = result.quickWins[0]!

    expect(qw.difficulty).toBe('medium')
  })
})

// ─── Task 4.5: 종합 점수 + 등급 산출 ───

describe('종합 점수 계산', () => {
  it('should calculate weighted average across categories', () => {
    // technical(weight 15): 1 rule, passed → 100점
    // content(weight 25): 1 rule, failed → 0점
    mockRules.push(
      createRule({
        id: 'tech-1',
        category: 'technical',
        maxPoints: 10,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'content-1',
        category: 'content',
        maxPoints: 10,
        evaluate: () => ({ passed: false, message: '실패' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    // technical: 100 × 15 = 1500
    // content: 0 × 25 = 0
    // totalWeight: 15 + 25 = 40
    // score: 1500 / 40 = 37.5 → 38
    expect(result.score).toBe(38)
  })

  it('should exclude categories with no evaluated rules from weight', () => {
    // technical만 있고 나머지 카테고리 룰 없음 → weight 15만 사용
    mockRules.push(
      createRule({
        id: 'tech-1',
        category: 'technical',
        maxPoints: 10,
        evaluate: () => ({ passed: true, message: '통과' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    // technical: 100점, weight 15
    // 다른 카테고리: 룰 없음 → totalCount=0 → 제외
    // score: (100 × 15) / 15 = 100
    expect(result.score).toBe(100)
  })

  it('should exclude skipped-only categories from weight', () => {
    mockRules.push(
      createRule({
        id: 'tech-pass',
        category: 'technical',
        maxPoints: 10,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'content-skip',
        category: 'content',
        isEvaluable: () => false,
      })
    )

    const result = evaluate(createMockCrawlData())

    // content는 스킵됨 → totalCount=0 → 가중치 제외
    // technical만: 100 × 15 / 15 = 100
    expect(result.score).toBe(100)
  })

  it('should return 0 when all rules are skipped', () => {
    mockRules.push(
      createRule({
        id: 'skip-1',
        category: 'technical',
        isEvaluable: () => false,
      }),
      createRule({
        id: 'skip-2',
        category: 'content',
        isEvaluable: () => false,
      })
    )

    const result = evaluate(createMockCrawlData())

    expect(result.score).toBe(0)
  })

  it('should return 0 when no rules exist', () => {
    // mockRules는 빈 배열
    const result = evaluate(createMockCrawlData())

    expect(result.score).toBe(0)
  })

  it('should handle partial passes within a category', () => {
    // content에 2개 룰: 1통과 + 1실패 → 50점
    mockRules.push(
      createRule({
        id: 'content-pass',
        category: 'content',
        maxPoints: 10,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'content-fail',
        category: 'content',
        maxPoints: 10,
        evaluate: () => ({ passed: false, message: '실패' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    // content: earned=10, max=20, score=50
    // weighted: 50 × 25 / 25 = 50
    expect(result.score).toBe(50)
  })
})

describe('등급 산출', () => {
  it('should return excellent grade for score >= 80', () => {
    mockRules.push(
      createRule({
        id: 'tech-1',
        category: 'technical',
        maxPoints: 10,
        evaluate: () => ({ passed: true, message: '통과' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.grade).toBe('excellent')
    expect(result.gradeLabel).toBe('양호')
  })

  it('should return good grade for score 60-79', () => {
    // 2개 카테고리로 가중 평균 60-79 만들기
    // technical(15): 100점, content(25): 40점
    // (100×15 + 40×25) / 40 = (1500+1000)/40 = 62.5 → 63
    mockRules.push(
      createRule({
        id: 'tech-pass',
        category: 'technical',
        maxPoints: 10,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'content-pass',
        category: 'content',
        maxPoints: 4,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'content-fail',
        category: 'content',
        maxPoints: 6,
        evaluate: () => ({ passed: false, message: '실패' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(result.score).toBeLessThan(80)
    expect(result.grade).toBe('good')
    expect(result.gradeLabel).toBe('보통')
  })

  it('should return warning grade for score 40-59', () => {
    // technical(15): 0점, content(25): 100점
    // (0×15 + 100×25) / 40 = 2500/40 = 62.5... 이건 good이 됨
    // technical(15): 100점, content(25): 0점
    // (100×15 + 0×25) / 40 = 1500/40 = 37.5 → 38 → critical임
    // technical(15): 50점, content(25): 50점
    // (50×15 + 50×25) / 40 = 2000/40 = 50 → warning
    mockRules.push(
      createRule({
        id: 'tech-pass',
        category: 'technical',
        maxPoints: 5,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'tech-fail',
        category: 'technical',
        maxPoints: 5,
        evaluate: () => ({ passed: false, message: '실패' }),
      }),
      createRule({
        id: 'content-pass',
        category: 'content',
        maxPoints: 5,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'content-fail',
        category: 'content',
        maxPoints: 5,
        evaluate: () => ({ passed: false, message: '실패' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    expect(result.score).toBe(50)
    expect(result.grade).toBe('warning')
    expect(result.gradeLabel).toBe('주의')
  })

  it('should return critical grade for score < 40', () => {
    mockRules.push(
      createRule({
        id: 'content-fail',
        category: 'content',
        maxPoints: 10,
        evaluate: () => ({ passed: false, message: '실패' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    expect(result.score).toBe(0)
    expect(result.grade).toBe('critical')
    expect(result.gradeLabel).toBe('심각')
  })

  it('should return grade boundary: exactly 80 → excellent', () => {
    // technical(15): 100, content(25): 68
    // (100×15 + 68×25) / 40 = (1500+1700)/40 = 80
    mockRules.push(
      createRule({
        id: 'tech-pass',
        category: 'technical',
        maxPoints: 10,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'content-pass',
        category: 'content',
        maxPoints: 68,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'content-fail',
        category: 'content',
        maxPoints: 32,
        evaluate: () => ({ passed: false, message: '실패' }),
      })
    )

    const result = evaluate(createMockCrawlData())

    expect(result.score).toBe(80)
    expect(result.grade).toBe('excellent')
  })
})

describe('결과 메타데이터', () => {
  it('should count passed/failed/skipped rules correctly', () => {
    mockRules.push(
      createRule({
        id: 'pass-1',
        category: 'technical',
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'pass-2',
        category: 'technical',
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'fail-1',
        category: 'content',
        evaluate: () => ({ passed: false, message: '실패' }),
      }),
      createRule({
        id: 'skip-1',
        category: 'security',
        isEvaluable: () => false,
      })
    )

    const result = evaluate(createMockCrawlData())

    expect(result.totalRules).toBe(4)
    expect(result.passedRules).toBe(2)
    expect(result.failedRules).toBe(1)
    expect(result.skippedRules).toBe(1)
  })

  it('should include evaluatedAt as ISO string', () => {
    mockRules.push(createRule({ id: 'r1', category: 'technical' }))

    const result = evaluate(createMockCrawlData())

    expect(result.evaluatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('should include all 7 categories', () => {
    const result = evaluate(createMockCrawlData())

    expect(result.categories).toHaveLength(7)
    const ids = result.categories.map((c) => c.id)
    expect(ids).toContain('technical')
    expect(ids).toContain('content')
    expect(ids).toContain('social-ai')
    expect(ids).toContain('performance')
    expect(ids).toContain('security')
    expect(ids).toContain('mobile')
    expect(ids).toContain('geo')
  })
})

describe('카테고리 점수', () => {
  it('should normalize category score to 0-100', () => {
    mockRules.push(
      createRule({
        id: 'tech-1',
        category: 'technical',
        maxPoints: 3,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'tech-2',
        category: 'technical',
        maxPoints: 7,
        evaluate: () => ({ passed: false, message: '실패' }),
      })
    )

    const result = evaluate(createMockCrawlData())
    const tech = result.categories.find((c) => c.id === 'technical')!

    // earned=3, max=10, score=30
    expect(tech.score).toBe(30)
    expect(tech.passedCount).toBe(1)
    expect(tech.totalCount).toBe(2)
    expect(tech.skippedCount).toBe(0)
  })

  it('should handle skipped rules in category counts', () => {
    mockRules.push(
      createRule({
        id: 'tech-pass',
        category: 'technical',
        maxPoints: 10,
        evaluate: () => ({ passed: true, message: '통과' }),
      }),
      createRule({
        id: 'tech-skip',
        category: 'technical',
        isEvaluable: () => false,
      })
    )

    const result = evaluate(createMockCrawlData())
    const tech = result.categories.find((c) => c.id === 'technical')!

    expect(tech.score).toBe(100)
    expect(tech.passedCount).toBe(1)
    expect(tech.totalCount).toBe(1) // 스킵 제외
    expect(tech.skippedCount).toBe(1)
    expect(tech.rules).toHaveLength(2) // 전체 룰은 포함
  })
})
