'use client'

import type {
  AICitationPossibilityScore,
  OverallScore,
} from '@/features/diagnosis-free/types'
import { SCORING } from '@/config/scoring'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { AICitationCard } from '@/components/dashboard/AICitationCard'
import { QuickWinCard } from '@/components/dashboard/QuickWinCard'
import { CategoryScoreCard } from './CategoryScoreCard'
import { PartialDataBanner } from '@/features/crawling'

interface DashboardContentProps {
  overallScore: OverallScore
  citation: AICitationPossibilityScore
  isPartial?: boolean
  blockedReason?: string
}

export function DashboardContent({
  overallScore,
  citation,
  isPartial,
  blockedReason,
}: DashboardContentProps): React.JSX.Element {
  const scoreColor = SCORING.getScoreColor(overallScore.score)

  return (
    <div className="flex flex-col gap-6">
      {/* robots.txt 차단 경고 배너 */}
      {isPartial && <PartialDataBanner blockedReason={blockedReason} />}

      {/* 1행: 종합 점수 + AI 인용 가능성 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 종합 점수 카드 */}
        <section
          className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          aria-label="종합 마케팅 점수"
        >
          <h2 className="self-start text-lg font-semibold text-slate-900">
            종합 마케팅 점수
          </h2>
          <ScoreGauge score={overallScore.score} size="lg" />
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
            <span>
              스킵{' '}
              <strong className="font-semibold text-slate-700">
                {overallScore.skippedRules}
              </strong>
            </span>
          </div>
        </section>

        {/* AI 인용 가능성 카드 */}
        <AICitationCard citation={citation} />
      </div>

      {/* 2행: Quick Win */}
      {overallScore.quickWins.length > 0 && (
        <section className="flex flex-col gap-3" aria-label="Quick Win 항목">
          <h2 className="text-lg font-semibold text-slate-900">
            지금 바로 개선할 수 있는 항목
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {overallScore.quickWins.map((qw) => (
              <QuickWinCard key={qw.ruleId} quickWin={qw} />
            ))}
          </div>
        </section>
      )}

      {/* 3행: 카테고리별 점수 */}
      <section className="flex flex-col gap-3" aria-label="카테고리별 점수">
        <h2 className="text-lg font-semibold text-slate-900">
          카테고리별 점수
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overallScore.categories.map((cat) => (
            <CategoryScoreCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>
    </div>
  )
}
