'use client'

import Link from 'next/link'
import type {
  OverallScore,
  AICitationPossibilityScore,
  CategoryScore,
  CategoryId,
} from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'
import { ACCESS } from '@/config/access-control'
import { getDiagnosisDetailUrl } from '@/lib/utils/category-routing'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { AICitationCard } from '@/components/dashboard/AICitationCard'
import { QuickWinCard } from '@/components/dashboard/QuickWinCard'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import type { UserTier } from '@/lib/access-control/get-user-tier'

interface OverviewContentProps {
  overallScore: OverallScore
  citation: AICitationPossibilityScore
  tier: UserTier
  diagnosisId: string
}

function CategoryCard({
  category,
  diagnosisId,
}: {
  category: CategoryScore
  diagnosisId: string
}): React.JSX.Element {
  const color = SCORING.getScoreColor(category.score)
  const href = getDiagnosisDetailUrl(category.id as CategoryId, diagnosisId)
  const percentage = Math.max(0, Math.min(100, category.score))

  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          {category.name}
        </h3>
        <span
          className={`text-lg font-bold font-display tabular-nums ${color.text}`}
        >
          {category.score}
          <span className="text-xs font-normal text-slate-400">/100</span>
        </span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="meter"
        aria-valuenow={category.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${category.name} 점수 ${category.score}점`}
      >
        <div
          className={`h-full rounded-full transition-all ${color.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>
          통과 {category.passedCount}/{category.totalCount}
        </span>
        {category.skippedCount > 0 && (
          <span className="text-slate-400">
            ({category.skippedCount}개 스킵)
          </span>
        )}
      </div>
    </Link>
  )
}

export function OverviewContent({
  overallScore,
  citation,
  tier,
  diagnosisId,
}: OverviewContentProps): React.JSX.Element {
  const scoreColor = SCORING.getScoreColor(overallScore.score)
  const isFree = tier === 'free'
  const visibleQuickWins = isFree
    ? overallScore.quickWins.slice(0, ACCESS.FREE_QUICK_WIN_LIMIT)
    : overallScore.quickWins
  const hiddenQuickWins = isFree
    ? overallScore.quickWins.slice(ACCESS.FREE_QUICK_WIN_LIMIT)
    : []

  return (
    <div className="flex flex-col gap-6">
      {/* 상단: ScoreGauge + 등급 뱃지 + 요약 */}
      <section
        className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        aria-label="종합 마케팅 점수"
      >
        <ScoreGauge score={overallScore.score} size="xl" />
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${scoreColor.bg} ${scoreColor.text}`}
        >
          {overallScore.gradeLabel} 등급
        </span>
        <div className="flex gap-4 text-sm text-slate-500">
          <span>
            통과{' '}
            <strong className="font-semibold text-slate-700">
              {overallScore.passedRules}
            </strong>
          </span>
          <span>
            실패{' '}
            <strong className="font-semibold text-slate-700">
              {overallScore.failedRules}
            </strong>
          </span>
          {overallScore.skippedRules > 0 && (
            <span>
              스킵{' '}
              <strong className="font-semibold text-slate-700">
                {overallScore.skippedRules}
              </strong>
            </span>
          )}
        </div>
        <p className="max-w-md text-center text-sm text-slate-500">
          총 {overallScore.totalRules}개 항목을 분석했습니다.{' '}
          {overallScore.failedRules > 0
            ? `${overallScore.failedRules}개 항목이 개선이 필요합니다.`
            : '모든 항목이 양호합니다.'}
        </p>
      </section>

      {/* 중단: 8개 카테고리 점수 그리드 */}
      <section className="flex flex-col gap-3" aria-label="카테고리별 점수">
        <h2 className="text-lg font-semibold text-slate-900">
          카테고리별 점수
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overallScore.categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              diagnosisId={diagnosisId}
            />
          ))}
        </div>
      </section>

      {/* 하단: AI 인용 + Quick Win */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AICitationCard citation={citation} />

        <section className="flex flex-col gap-3" aria-label="Quick Win 항목">
          <h2 className="text-lg font-semibold text-slate-900">
            Quick Win — 바로 개선 가능
          </h2>
          <div className="flex flex-col gap-3">
            {visibleQuickWins.map((qw) => (
              <QuickWinCard
                key={qw.ruleId}
                quickWin={qw}
                diagnosisId={diagnosisId}
              />
            ))}
          </div>
          {isFree && hiddenQuickWins.length > 0 && (
            <BlurOverlay visiblePercent={0}>
              <div className="flex flex-col gap-3">
                {hiddenQuickWins.map((qw) => (
                  <QuickWinCard
                    key={qw.ruleId}
                    quickWin={qw}
                    diagnosisId={diagnosisId}
                  />
                ))}
              </div>
            </BlurOverlay>
          )}
        </section>
      </div>
    </div>
  )
}
