'use client'

import type {
  CategoryScore,
  AICitationPossibilityScore,
  RuleResult,
} from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'
import { ACCESS } from '@/config/access-control'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { AICitationCard } from '@/components/dashboard/AICitationCard'
import { RuleListItem } from '@/components/dashboard/RuleListItem'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import type { UserTier } from '@/lib/access-control/get-user-tier'

/** GEO 상세 = geo + social-ai 카테고리 */
const GEO_CATEGORY_IDS = ['geo', 'social-ai'] as const

interface GeoDetailProps {
  categories: CategoryScore[]
  citation: AICitationPossibilityScore
  tier: UserTier
}

function CategoryRules({
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

      <div className="flex flex-col gap-2">
        {visibleRules.map((rule) => (
          <RuleListItem key={rule.id} rule={rule} />
        ))}
      </div>

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

export function GeoDetail({
  categories,
  citation,
  tier,
}: GeoDetailProps): React.JSX.Element {
  const geoCategories = categories.filter((c) =>
    (GEO_CATEGORY_IDS as readonly string[]).includes(c.id)
  )

  const totalWeight = geoCategories.reduce((sum, c) => sum + c.weight, 0)
  const categoryScore =
    totalWeight > 0
      ? Math.round(
          geoCategories.reduce((sum, c) => sum + c.score * c.weight, 0) /
            totalWeight
        )
      : 0

  // 카테고리 룰이 모두 skip되어 0점이면 AI 인용 점수를 대표 점수로 사용
  const allSkipped = geoCategories.every(
    (c) => c.passedCount === 0 && c.totalCount === c.skippedCount
  )
  let weightedScore = 0
  if (categoryScore > 0) {
    weightedScore = categoryScore
  } else if (allSkipped) {
    weightedScore = citation.overallScore
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 상단: GEO 종합 점수 */}
      <section
        className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        aria-label="GEO 종합 점수"
      >
        <h2 className="self-start text-lg font-semibold text-slate-900">
          GEO (AI 검색) 종합 분석
        </h2>
        <ScoreGauge score={weightedScore} size="lg" />
        <p className="max-w-md text-center text-sm text-slate-500">
          AI 검색 엔진에서 사이트가 인용될 가능성을 분석합니다.
        </p>
      </section>

      {/* AI 인용 가능성 카드 (확장 뷰) */}
      <AICitationCard citation={citation} />

      {/* 플랫폼별 신호 분석 */}
      <section className="flex flex-col gap-3" aria-label="플랫폼별 신호 분석">
        <h2 className="text-lg font-semibold text-slate-900">
          플랫폼별 신호 분석
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {citation.platforms.map((platform) => {
            const color = SCORING.getScoreColor(platform.score)
            return (
              <div
                key={platform.platform}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {platform.platformLabel}
                  </h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}
                  >
                    {platform.score}점
                  </span>
                </div>
                {platform.blocked ? (
                  <p className="text-sm text-danger-600">
                    robots.txt에서 봇이 차단되어 있습니다.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>봇 접근</span>
                      <span className="font-semibold text-slate-700">
                        {platform.signals.botAccess}점
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>콘텐츠 발견</span>
                      <span className="font-semibold text-slate-700">
                        {platform.signals.contentDiscoverability}점
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>신뢰 신호</span>
                      <span className="font-semibold text-slate-700">
                        {platform.signals.trustSignals}점
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 카테고리별 상세 룰 */}
      {geoCategories.map((category) => (
        <CategoryRules
          key={category.id}
          category={category}
          rules={category.rules}
          tier={tier}
        />
      ))}
    </div>
  )
}
