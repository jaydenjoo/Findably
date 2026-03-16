import type {
  ComparisonMatrix,
  CompetitivePosition,
  EstimatedImpact,
  GapAnalysisResult,
  GapItem,
  GapSeverity,
  MatrixCategoryId,
} from '../types'
import { GAP_THRESHOLDS, POSITION_THRESHOLDS } from '../constants'

/**
 * 비교 매트릭스에서 경쟁사 대비 격차(Gap) 분석.
 * 원본이 뒤처지는 카테고리만 추출, 심각도별 정렬.
 */
export function analyzeGaps(matrix: ComparisonMatrix): GapAnalysisResult {
  const gaps: GapItem[] = []

  for (const category of matrix.categories) {
    if (category.competitorScores.length === 0) continue

    const bestCompetitorScore = Math.max(
      ...category.competitorScores.map((cs) => cs.score)
    )

    const gap = category.originalScore - bestCompetitorScore
    if (gap >= 0) continue // 원본이 우위 → 갭 아님

    const absGap = Math.abs(gap)

    gaps.push({
      category: category.id,
      categoryLabel: category.label,
      gap,
      severity: getSeverity(absGap),
      description: buildDescription(category.id, absGap, category.winner),
      suggestedAction: SUGGESTED_ACTIONS[category.id],
      estimatedImpact: getEstimatedImpact(category.id, absGap),
    })
  }

  gaps.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const competitivePosition = assessPosition(matrix)
  const summary = buildSummary(gaps, competitivePosition)

  return { gaps, competitivePosition, summary }
}

// ─── 심각도 판정 ───

const SEVERITY_ORDER: Record<GapSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

function getSeverity(absGap: number): GapSeverity {
  if (absGap >= GAP_THRESHOLDS.critical) return 'critical'
  if (absGap >= GAP_THRESHOLDS.warning) return 'warning'
  return 'info'
}

// ─── 영향도 판정 ───

const HIGH_IMPACT_CATEGORIES: MatrixCategoryId[] = ['performance', 'seo', 'geo']

function getEstimatedImpact(
  categoryId: MatrixCategoryId,
  absGap: number
): EstimatedImpact {
  if (
    HIGH_IMPACT_CATEGORIES.includes(categoryId) &&
    absGap >= GAP_THRESHOLDS.critical
  ) {
    return 'high'
  }
  if (absGap >= GAP_THRESHOLDS.warning) return 'medium'
  return 'low'
}

// ─── 경쟁 포지션 판정 ───

function assessPosition(matrix: ComparisonMatrix): CompetitivePosition {
  if (matrix.competitors.length === 0) return 'leading'

  const avgCompetitorScore =
    matrix.competitors.reduce((sum, c) => sum + c.overallScore, 0) /
    matrix.competitors.length

  const diff = matrix.originalOverallScore - avgCompetitorScore

  if (diff >= POSITION_THRESHOLDS.leading) return 'leading'
  if (diff <= POSITION_THRESHOLDS.lagging) return 'lagging'
  return 'competitive'
}

// ─── 설명 템플릿 ───

const DESCRIPTION_TEMPLATES: Record<
  MatrixCategoryId,
  (gap: number, winner: string) => string
> = {
  performance: (gap, winner) =>
    `${winner} 대비 성능 점수가 ${gap}점 낮습니다. 페이지 로딩 속도 개선이 필요합니다.`,
  seo: (gap, winner) =>
    `${winner} 대비 SEO 점수가 ${gap}점 낮습니다. 검색 엔진 최적화 강화가 필요합니다.`,
  accessibility: (gap, winner) =>
    `${winner} 대비 접근성 점수가 ${gap}점 낮습니다. 웹 접근성 개선이 필요합니다.`,
  content: (gap, winner) =>
    `${winner} 대비 콘텐츠 품질 점수가 ${gap}점 낮습니다. 콘텐츠 전략 재검토가 필요합니다.`,
  geo: (gap, winner) =>
    `${winner} 대비 GEO/AI 점수가 ${gap}점 낮습니다. AI 검색 노출 최적화가 필요합니다.`,
}

function buildDescription(
  categoryId: MatrixCategoryId,
  absGap: number,
  winner: string
): string {
  return DESCRIPTION_TEMPLATES[categoryId](absGap, winner)
}

const SUGGESTED_ACTIONS: Record<MatrixCategoryId, string> = {
  performance:
    '이미지 최적화, 코드 분할, CDN 적용을 통해 로딩 속도를 개선하세요.',
  seo: '메타태그 최적화, 구조화 데이터 추가, 내부 링크 구조를 개선하세요.',
  accessibility:
    'alt 텍스트 추가, 색상 대비 개선, 키보드 네비게이션을 점검하세요.',
  content:
    '전문성 있는 콘텐츠 추가, 구조화된 정보 제공, FAQ 섹션을 강화하세요.',
  geo: 'llms.txt 추가, Schema Markup 강화, AI 봇 접근 허용을 설정하세요.',
}

// ─── 요약 생성 ───

function buildSummary(gaps: GapItem[], position: CompetitivePosition): string {
  if (gaps.length === 0) {
    return '경쟁사 대비 모든 카테고리에서 우위를 점하고 있습니다.'
  }

  const criticalCount = gaps.filter((g) => g.severity === 'critical').length
  const warningCount = gaps.filter((g) => g.severity === 'warning').length
  const parts: string[] = []

  if (criticalCount > 0) parts.push(`심각한 격차 ${criticalCount}개`)
  if (warningCount > 0) parts.push(`주의 필요 ${warningCount}개`)

  const positionLabel =
    position === 'leading'
      ? '선두'
      : position === 'competitive'
        ? '경쟁적'
        : '후발'

  return `경쟁 포지션: ${positionLabel}. ${parts.join(', ')}${parts.length > 0 ? '가 발견되었습니다.' : ''} 우선순위가 높은 항목부터 개선하세요.`
}
