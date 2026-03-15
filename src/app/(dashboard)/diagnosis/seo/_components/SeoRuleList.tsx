'use client'

import type { CategoryScore, RuleResult } from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'
import { ACCESS } from '@/config/access-control'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { RuleListItem } from '@/components/dashboard/RuleListItem'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import type { UserTier } from '@/lib/access-control/get-user-tier'

/** SEO 상세 = technical + performance + security + mobile 카테고리 */
const SEO_CATEGORY_IDS = [
  'technical',
  'performance',
  'security',
  'mobile',
] as const

interface SeoRuleListProps {
  categories: CategoryScore[]
  tier: UserTier
}

function CategorySection({
  category,
  rules,
  tier,
}: {
  category: CategoryScore
  rules: RuleResult[]
  tier: UserTier
}): React.JSX.Element {
  const color = SCORING.getScoreColor(category.score)
  const isFree = tier === 'free'

  // 실패 항목 먼저, 통과 → 스킵 순
  const sortedRules = [...rules].sort((a, b) => {
    if (a.skipped !== b.skipped) return a.skipped ? 1 : -1
    if (a.passed !== b.passed) return a.passed ? 1 : -1
    return b.maxPoints - a.maxPoints
  })

  const visibleRules = isFree
    ? sortedRules.slice(0, ACCESS.FREE_DETAIL_ITEMS)
    : sortedRules
  const hiddenRules = isFree ? sortedRules.slice(ACCESS.FREE_DETAIL_ITEMS) : []

  return (
    <section
      className="flex flex-col gap-4"
      aria-label={`${category.name} 상세`}
    >
      {/* 카테고리 헤더 */}
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ScoreGauge score={category.score} size="sm" showLabel={false} />
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-base font-semibold text-slate-900">
            {category.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}
            >
              {SCORING.getScoreLabel(category.score)}
            </span>
            <span>
              통과 {category.passedCount}/{category.totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* 룰 리스트 */}
      <div className="flex flex-col gap-2">
        {visibleRules.map((rule) => (
          <RuleListItem key={rule.id} rule={rule} />
        ))}
      </div>

      {/* Free BlurOverlay */}
      {isFree && hiddenRules.length > 0 && (
        <BlurOverlay visiblePercent={10}>
          <div className="flex flex-col gap-2">
            {hiddenRules.map((rule) => (
              <RuleListItem key={rule.id} rule={rule} />
            ))}
          </div>
        </BlurOverlay>
      )}
    </section>
  )
}

export function SeoRuleList({
  categories,
  tier,
}: SeoRuleListProps): React.JSX.Element {
  const seoCategories = categories.filter((c) =>
    (SEO_CATEGORY_IDS as readonly string[]).includes(c.id)
  )

  // 전체 SEO 점수 = 포함 카테고리의 가중 평균
  const totalWeight = seoCategories.reduce((sum, c) => sum + c.weight, 0)
  const weightedScore =
    totalWeight > 0
      ? Math.round(
          seoCategories.reduce((sum, c) => sum + c.score * c.weight, 0) /
            totalWeight
        )
      : 0

  return (
    <div className="flex flex-col gap-6">
      {/* 상단: SEO 종합 점수 */}
      <section
        className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        aria-label="SEO 종합 점수"
      >
        <h2 className="self-start text-lg font-semibold text-slate-900">
          SEO 종합 분석
        </h2>
        <ScoreGauge score={weightedScore} size="lg" />
        <p className="max-w-md text-center text-sm text-slate-500">
          기술 SEO, 성능, 보안, 모바일 4개 카테고리의 가중 평균 점수입니다.
        </p>
      </section>

      {/* 카테고리별 상세 */}
      {seoCategories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          rules={category.rules}
          tier={tier}
        />
      ))}
    </div>
  )
}
