import { describe, it, expect } from 'vitest'
import { aggregateScores } from './score-aggregator'
import type {
  OverallScore,
  AICitationPossibilityScore,
  CategoryScore,
} from '../types'

// ─── 헬퍼: 테스트용 카테고리 점수 생성 ───

function makeCategory(
  id: string,
  score: number,
  overrides?: Partial<CategoryScore>
): CategoryScore {
  return {
    id: id as CategoryScore['id'],
    name: id,
    score,
    weight: 1,
    rules: [],
    passedCount: 0,
    totalCount: 0,
    skippedCount: 0,
    ...overrides,
  }
}

function makeOverallScore(
  categoryScores: Record<string, number>
): OverallScore {
  const categories = Object.entries(categoryScores).map(([id, score]) =>
    makeCategory(id, score)
  )
  return {
    score: 50,
    grade: 'warning',
    gradeLabel: '주의',
    categories,
    quickWins: [],
    totalRules: 67,
    passedRules: 30,
    failedRules: 30,
    skippedRules: 7,
    evaluatedAt: '2026-03-17T00:00:00.000Z',
  }
}

function makeAICitation(overallScore: number): AICitationPossibilityScore {
  return {
    overallScore,
    passed: overallScore >= 50,
    platforms: [],
    recommendation: '테스트',
  }
}

// ─── 테스트 ───

describe('aggregateScores', () => {
  it('should aggregate 7 categories into 5 macro scores with AI data', () => {
    const overallScore = makeOverallScore({
      technical: 80,
      content: 60,
      mobile: 70,
      geo: 50,
      'social-ai': 40,
      performance: 90,
      security: 85,
    })
    const aiCitation = makeAICitation(75)

    const result = aggregateScores({
      overallScore,
      aiCitation,
      dataCompleteness: 95,
    })

    expect(result.macroScores).toHaveLength(5)
    expect(result.hasAIData).toBe(true)

    // SEO = avg(technical:80, content:60, mobile:70) = 70
    const seo = result.macroScores.find((m) => m.id === 'seo')
    expect(seo?.score).toBe(70)

    // GEO = avg(geo:50, social-ai:40) = 45
    const geo = result.macroScores.find((m) => m.id === 'geo')
    expect(geo?.score).toBe(45)

    // Performance = 90
    const perf = result.macroScores.find((m) => m.id === 'performance')
    expect(perf?.score).toBe(90)

    // AI = 75
    const ai = result.macroScores.find((m) => m.id === 'ai')
    expect(ai?.score).toBe(75)

    // Security = 85
    const sec = result.macroScores.find((m) => m.id === 'security')
    expect(sec?.score).toBe(85)
  })

  it('should use fallback weights when AI data is absent', () => {
    const overallScore = makeOverallScore({
      technical: 80,
      content: 60,
      mobile: 70,
      geo: 50,
      'social-ai': 40,
      performance: 90,
      security: 85,
    })

    const result = aggregateScores({
      overallScore,
      aiCitation: null,
      dataCompleteness: 80,
    })

    expect(result.macroScores).toHaveLength(4)
    expect(result.hasAIData).toBe(false)
    expect(result.macroScores.find((m) => m.id === 'ai')).toBeUndefined()

    // 가중치: SEO(25%) + GEO(30%) + Performance(25%) + Security(20%)
    // 70*0.25 + 45*0.30 + 90*0.25 + 85*0.20
    // = 17.5 + 13.5 + 22.5 + 17 = 70.5 → 71 (반올림)
    expect(result.totalScore).toBe(71)
  })

  it('should calculate weighted total score with AI data', () => {
    const overallScore = makeOverallScore({
      technical: 80,
      content: 60,
      mobile: 70,
      geo: 50,
      'social-ai': 40,
      performance: 90,
      security: 85,
    })
    const aiCitation = makeAICitation(75)

    const result = aggregateScores({
      overallScore,
      aiCitation,
      dataCompleteness: 95,
    })

    // SEO=70*0.20 + GEO=45*0.25 + Perf=90*0.20 + AI=75*0.25 + Sec=85*0.10
    // = 14 + 11.25 + 18 + 18.75 + 8.5 = 70.5 → 71
    expect(result.totalScore).toBe(71)
  })

  it('should derive reportReliability=high when dataCompleteness >= 90', () => {
    const overallScore = makeOverallScore({ technical: 50 })

    const result = aggregateScores({
      overallScore,
      aiCitation: null,
      dataCompleteness: 95,
    })

    expect(result.reportReliability).toBe('high')
    expect(result.dataCompleteness).toBe(95)
  })

  it('should derive reportReliability=medium when dataCompleteness 70-89', () => {
    const overallScore = makeOverallScore({ technical: 50 })

    const result = aggregateScores({
      overallScore,
      aiCitation: null,
      dataCompleteness: 75,
    })

    expect(result.reportReliability).toBe('medium')
  })

  it('should derive reportReliability=low when dataCompleteness < 70', () => {
    const overallScore = makeOverallScore({ technical: 50 })

    const result = aggregateScores({
      overallScore,
      aiCitation: null,
      dataCompleteness: 50,
    })

    expect(result.reportReliability).toBe('low')
  })

  it('should assign correct grades and labels to macro scores', () => {
    const overallScore = makeOverallScore({
      technical: 90, // excellent
      content: 90,
      mobile: 90,
      performance: 65, // good
      security: 30, // critical
    })

    const result = aggregateScores({
      overallScore,
      aiCitation: null,
      dataCompleteness: 100,
    })

    const seo = result.macroScores.find((m) => m.id === 'seo')
    expect(seo?.grade).toBe('excellent')
    expect(seo?.gradeLabel).toBe('양호')

    const perf = result.macroScores.find((m) => m.id === 'performance')
    expect(perf?.grade).toBe('good')
    expect(perf?.gradeLabel).toBe('보통')

    const sec = result.macroScores.find((m) => m.id === 'security')
    expect(sec?.grade).toBe('critical')
    expect(sec?.gradeLabel).toBe('심각')
  })
})
