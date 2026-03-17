'use client'

import Link from 'next/link'
import type {
  AICitationPossibilityScore,
  OverallScore,
} from '@/features/diagnosis-free/types'
import type { UserTier } from '@/lib/access-control/get-user-tier'
import type { ScoreGrade } from '@/types/ui'
import { SCORING } from '@/config/scoring'
import { ACCESS } from '@/config/access-control'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { AICitationCard } from '@/components/dashboard/AICitationCard'
import { QuickWinCard } from '@/components/dashboard/QuickWinCard'
import { CategoryScoreCard } from './CategoryScoreCard'
import { PartialDataBanner } from '@/features/crawling'

interface DashboardContentProps {
  overallScore: OverallScore
  citation: AICitationPossibilityScore
  isPartial?: boolean
  blockedReason?: string
  diagnosisId: string
  tier: UserTier
}

const SCORE_MESSAGES: Record<ScoreGrade, string> = {
  excellent: '마케팅 건강 상태가 양호합니다. 세부 최적화로 완성도를 높이세요.',
  good: '좋은 출발이에요! 아래 Quick Win부터 개선하면 크게 성장할 수 있습니다.',
  warning: '개선이 필요한 부분이 있습니다. Quick Win 항목을 우선 처리하세요.',
  critical: '마케팅 기초 체력을 키울 때입니다. 아래 추천 항목부터 시작하세요.',
}

function getScoreMessage(score: number): string {
  return SCORE_MESSAGES[SCORING.getScoreGrade(score)]
}

export function DashboardContent({
  overallScore,
  citation,
  isPartial,
  blockedReason,
  diagnosisId,
  tier,
}: DashboardContentProps): React.JSX.Element {
  const scoreColor = SCORING.getScoreColor(overallScore.score)
  const isFree = tier === 'free'

  // Free 사용자: Quick Win 제한
  const visibleQuickWins = isFree
    ? overallScore.quickWins.slice(0, ACCESS.FREE_QUICK_WIN_LIMIT)
    : overallScore.quickWins
  const hiddenQuickWins = isFree
    ? overallScore.quickWins.slice(ACCESS.FREE_QUICK_WIN_LIMIT)
    : []

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더: 제목 + 샘플 보기 링크 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">진단 결과</h1>
        <Link
          href="/reports/sample"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          샘플 보기 →
        </Link>
      </div>

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
          <p className="text-center text-sm text-slate-500 leading-relaxed max-w-xs">
            {getScoreMessage(overallScore.score)}
          </p>
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

      {/* 2행: Quick Win — Free는 1개만, 나머지 BlurOverlay */}
      {overallScore.quickWins.length > 0 && (
        <section className="flex flex-col gap-3" aria-label="Quick Win 항목">
          <h2 className="text-lg font-semibold text-slate-900">
            지금 바로 개선할 수 있는 항목
          </h2>

          {/* 무료로 볼 수 있는 Quick Win */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {visibleQuickWins.map((qw) => (
              <QuickWinCard
                key={qw.ruleId}
                quickWin={qw}
                diagnosisId={diagnosisId}
              />
            ))}
          </div>

          {/* Free 사용자: 나머지 Quick Win은 BlurOverlay */}
          {isFree && hiddenQuickWins.length > 0 && (
            <BlurOverlay
              visiblePercent={15}
              ctaHref={`/checkout/${diagnosisId}`}
            >
              <div className="flex gap-4 overflow-hidden pb-2">
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
      )}

      {/* Free 사용자 업그레이드 CTA — Quick Win이 부족해도 항상 표시 */}
      {isFree && hiddenQuickWins.length === 0 && (
        <section
          className="rounded-lg border border-primary-200 bg-primary-50 p-6 text-center"
          aria-label="상세 분석 업그레이드 안내"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            더 자세한 분석이 필요하신가요?
          </h2>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            5개 AI 전문가가 60개+ 항목을 심층 분석하고, 경쟁사 비교와 90일 실행
            계획까지 제공합니다.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/checkout/${diagnosisId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
            >
              상세 분석 받기 — 9.9만원
            </Link>
            <Link
              href="/reports/sample"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              샘플 먼저 보기 →
            </Link>
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
            <CategoryScoreCard
              key={cat.id}
              category={cat}
              diagnosisId={diagnosisId}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
