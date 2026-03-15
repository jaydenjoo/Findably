'use client'

import type { CategoryScore, RuleResult } from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'
import { ACCESS } from '@/config/access-control'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { RuleListItem } from '@/components/dashboard/RuleListItem'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import type { UserTier } from '@/lib/access-control/get-user-tier'

interface ContentDetailProps {
  contentCategory: CategoryScore
  tier: UserTier
}

/** 룰을 서브그룹으로 분류 */
function groupRules(rules: RuleResult[]): {
  label: string
  rules: RuleResult[]
}[] {
  const groups: { label: string; ids: string[] }[] = [
    {
      label: '구조',
      ids: [
        'heading-hierarchy',
        'meta-title',
        'meta-description',
        'h1-exists',
        'h1-single',
      ],
    },
    {
      label: '가독성',
      ids: ['content-length', 'paragraph-length', 'reading-level'],
    },
    {
      label: '전문성',
      ids: ['author-info', 'date-published', 'citations', 'expertise-signals'],
    },
  ]

  const grouped = groups
    .map((g) => ({
      label: g.label,
      rules: g.ids
        .map((id) => rules.find((r) => r.id === id))
        .filter((r): r is RuleResult => r !== undefined),
    }))
    .filter((g) => g.rules.length > 0)

  // 분류되지 않은 나머지
  const assignedIds = new Set(groups.flatMap((g) => g.ids))
  const others = rules.filter((r) => !assignedIds.has(r.id))
  if (others.length > 0) {
    grouped.push({ label: '기타', rules: others })
  }

  return grouped
}

export function ContentDetail({
  contentCategory,
  tier,
}: ContentDetailProps): React.JSX.Element {
  const color = SCORING.getScoreColor(contentCategory.score)
  const isFree = tier === 'free'

  // 실패 먼저 정렬
  const sortedRules = [...contentCategory.rules].sort((a, b) => {
    if (a.skipped !== b.skipped) return a.skipped ? 1 : -1
    if (a.passed !== b.passed) return a.passed ? 1 : -1
    return b.maxPoints - a.maxPoints
  })

  const visibleRules = isFree
    ? sortedRules.slice(0, ACCESS.FREE_DETAIL_ITEMS)
    : sortedRules
  const hiddenRules = isFree ? sortedRules.slice(ACCESS.FREE_DETAIL_ITEMS) : []

  const subGroups = groupRules(contentCategory.rules)

  return (
    <div className="flex flex-col gap-6">
      {/* 상단: 콘텐츠 종합 점수 */}
      <section
        className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        aria-label="콘텐츠 종합 점수"
      >
        <h2 className="self-start text-lg font-semibold text-slate-900">
          콘텐츠 품질 분석
        </h2>
        <ScoreGauge score={contentCategory.score} size="lg" />
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text}`}
        >
          {SCORING.getScoreLabel(contentCategory.score)}
        </span>
        <div className="flex gap-4 text-sm text-slate-500">
          <span>
            통과{' '}
            <strong className="font-semibold text-slate-700">
              {contentCategory.passedCount}
            </strong>
          </span>
          <span>
            실패{' '}
            <strong className="font-semibold text-slate-700">
              {contentCategory.totalCount -
                contentCategory.passedCount -
                contentCategory.skippedCount}
            </strong>
          </span>
        </div>
      </section>

      {/* 서브그룹 요약 (paid only) */}
      {!isFree && subGroups.length > 1 && (
        <section className="flex flex-col gap-3" aria-label="서브 점수">
          <h2 className="text-lg font-semibold text-slate-900">
            세부 카테고리
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {subGroups.map((group) => {
              const passed = group.rules.filter((r) => r.passed).length
              const total = group.rules.filter((r) => !r.skipped).length
              return (
                <div
                  key={group.label}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <h4 className="text-sm font-semibold text-slate-900">
                    {group.label}
                  </h4>
                  <p className="text-xs text-slate-500">
                    통과 {passed}/{total}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 룰 상세 리스트 */}
      <section className="flex flex-col gap-3" aria-label="콘텐츠 룰 상세">
        <h2 className="text-lg font-semibold text-slate-900">상세 항목</h2>
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
    </div>
  )
}
