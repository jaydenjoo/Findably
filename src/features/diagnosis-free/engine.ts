import type { CrawlData } from '@/features/crawling'
import { SCORING } from '@/config/scoring'
import {
  CATEGORY_CONFIG,
  SEVERITY_PRIORITY_WEIGHTS,
  SKIPPED_MESSAGES,
} from './constants'
import { ALL_RULES } from './rules'
import type {
  CategoryId,
  CategoryScore,
  OverallScore,
  RuleDefinition,
  RuleResult,
} from './types'

/** 단일 룰 평가 → RuleResult */
function evaluateRule(rule: RuleDefinition, data: CrawlData): RuleResult {
  if (!rule.isEvaluable(data)) {
    return {
      id: rule.id,
      category: rule.category,
      name: rule.name,
      points: 0,
      maxPoints: rule.maxPoints,
      passed: false,
      skipped: true,
      severity: rule.severity,
      message:
        SKIPPED_MESSAGES[rule.category] ?? SKIPPED_MESSAGES['default'] ?? '',
      quickWinEligible: rule.quickWinEligible,
      difficulty: rule.difficulty,
    }
  }

  const evaluation = rule.evaluate(data)
  return {
    id: rule.id,
    category: rule.category,
    name: rule.name,
    points: evaluation.passed ? rule.maxPoints : 0,
    maxPoints: rule.maxPoints,
    passed: evaluation.passed,
    skipped: false,
    severity: rule.severity,
    message: evaluation.message,
    quickWinEligible: rule.quickWinEligible,
    difficulty: rule.difficulty,
  }
}

/** 카테고리별 점수 산출 (100점 만점 정규화) */
function calculateCategoryScore(
  categoryId: CategoryId,
  results: RuleResult[]
): CategoryScore {
  const config = CATEGORY_CONFIG[categoryId]
  const categoryResults = results.filter((r) => r.category === categoryId)

  const evaluatedResults = categoryResults.filter((r) => !r.skipped)
  const earnedPoints = evaluatedResults.reduce((sum, r) => sum + r.points, 0)
  const maxPoints = evaluatedResults.reduce((sum, r) => sum + r.maxPoints, 0)

  // 평가 가능한 룰이 없으면 0점 (분모 0 방지)
  const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0

  return {
    id: categoryId,
    name: config.name,
    score,
    weight: config.weight,
    rules: categoryResults,
    passedCount: evaluatedResults.filter((r) => r.passed).length,
    totalCount: evaluatedResults.length,
    skippedCount: categoryResults.filter((r) => r.skipped).length,
  }
}

/** 전체 점수 산출 (가중 평균) */
export function evaluate(data: CrawlData): OverallScore {
  // 1. 모든 룰 평가
  const results = ALL_RULES.map((rule) => evaluateRule(rule, data))

  // 2. 카테고리별 점수 계산
  const categoryIds = Object.keys(CATEGORY_CONFIG) as CategoryId[]
  const categories = categoryIds.map((id) =>
    calculateCategoryScore(id, results)
  )

  // 3. 가중 평균으로 종합 점수 계산
  const totalWeight = categories.reduce((sum, c) => {
    // 평가된 룰이 0개인 카테고리는 가중치에서 제외
    return c.totalCount > 0 ? sum + c.weight : sum
  }, 0)

  const weightedSum = categories.reduce((sum, c) => {
    return c.totalCount > 0 ? sum + c.score * c.weight : sum
  }, 0)

  const overallScore =
    totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

  // 4. 등급 산출
  const grade = SCORING.getScoreGrade(overallScore)
  const gradeLabel = SCORING.getScoreLabel(overallScore)

  // 5. Quick Win 식별
  const quickWins = results
    .filter((r) => !r.skipped && !r.passed && r.quickWinEligible)
    .sort((a, b) => {
      // severity 가중치 + impact 복합 정렬
      const priorityA = SEVERITY_PRIORITY_WEIGHTS[a.severity] + a.maxPoints
      const priorityB = SEVERITY_PRIORITY_WEIGHTS[b.severity] + b.maxPoints
      return priorityB - priorityA
    })
    .map((r) => ({
      ruleId: r.id,
      ruleName: r.name,
      category: r.category,
      severity: r.severity,
      message: r.message,
      impact: r.maxPoints,
      source: 'rule' as const,
      difficulty: r.difficulty ?? 'medium',
    }))

  return {
    score: overallScore,
    grade,
    gradeLabel,
    categories,
    quickWins,
    totalRules: results.length,
    passedRules: results.filter((r) => r.passed).length,
    failedRules: results.filter((r) => !r.skipped && !r.passed).length,
    skippedRules: results.filter((r) => r.skipped).length,
    evaluatedAt: new Date().toISOString(),
  }
}
