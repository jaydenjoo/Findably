'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
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

/** 결제 API 응답 타입 */
interface CheckoutApiResponse {
  success: boolean
  error?: string
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
  const router = useRouter()
  const scoreColor = SCORING.getScoreColor(overallScore.score)
  const isFree = tier === 'free'

  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // 즉시 결제 처리 (Mock — 별도 결제 프로세스 없이 바로 유료 전환)
  const handleInstantCheckout = useCallback(async () => {
    if (isProcessing) return
    setIsProcessing(true)
    setCheckoutError(null)

    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId }),
      })
      const result = (await response.json()) as CheckoutApiResponse

      if (!response.ok || !result.success) {
        setCheckoutError(result.error ?? '처리에 실패했습니다.')
        setIsProcessing(false)
        return
      }

      // 성공 → 페이지 새로고침으로 tier='paid' 반영
      router.refresh()
    } catch {
      setCheckoutError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
      setIsProcessing(false)
    }
  }, [diagnosisId, isProcessing, router])

  // DB에 저장된 구버전 데이터에 이 필드가 null일 수 있으므로 방어 처리
  const passedRules = overallScore.passedRules ?? 0
  const failedRules = overallScore.failedRules ?? 0
  const skippedRules = overallScore.skippedRules ?? 0
  const categories = overallScore.categories ?? []
  const quickWins = overallScore.quickWins ?? []

  // Free 사용자: Quick Win 제한
  const visibleQuickWins = isFree
    ? quickWins.slice(0, ACCESS.FREE_QUICK_WIN_LIMIT)
    : quickWins
  const hiddenQuickWins = isFree
    ? quickWins.slice(ACCESS.FREE_QUICK_WIN_LIMIT)
    : []

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더: 제목 + 새 진단 + 샘플 보기 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">진단 결과</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/onboarding/url"
            className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100 cursor-pointer"
          >
            새 URL 진단하기 →
          </Link>
          <Link
            href="/reports/sample"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            샘플 보기 →
          </Link>
        </div>
      </div>

      {/* robots.txt 차단 경고 배너 */}
      {isPartial && <PartialDataBanner blockedReason={blockedReason} />}

      {/* 결제 에러 표시 */}
      {checkoutError && (
        <div
          className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
          role="alert"
          aria-live="polite"
        >
          {checkoutError}
        </div>
      )}

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
                {passedRules}
              </strong>
            </span>
            <span>
              실패{' '}
              <strong className="font-semibold text-slate-700">
                {failedRules}
              </strong>
            </span>
            <span>
              스킵{' '}
              <strong className="font-semibold text-slate-700">
                {skippedRules}
              </strong>
            </span>
          </div>
        </section>

        {/* AI 인용 가능성 카드 */}
        <AICitationCard citation={citation} />
      </div>

      {/* 2행: Quick Win — Free는 1개만, 나머지 BlurOverlay */}
      {quickWins.length > 0 && (
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
              onCtaClick={handleInstantCheckout}
              ctaDisabled={isProcessing}
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
            <button
              type="button"
              onClick={handleInstantCheckout}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '처리 중...' : '상세 분석 받기 — 9.9만원'}
            </button>
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
          {categories.map((cat) => (
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
