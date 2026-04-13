'use client'

import { useState } from 'react'
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
import { Download } from 'lucide-react'
import { CategoryScoreCard } from './CategoryScoreCard'
import { ImpactMatrix } from './ImpactMatrix'
import { RiskHeatmap } from './RiskHeatmap'
import { ScoreTrend } from './ScoreTrend'
import { PartialDataBanner } from '@/features/crawling'
import { GiftCodeModal } from './GiftCodeModal'
import { NPSSection } from './NPSSection'

interface DashboardContentProps {
  overallScore: OverallScore
  citation: AICitationPossibilityScore
  isPartial?: boolean
  blockedReason?: string
  diagnosisId: string
  tier: UserTier
  /** 이전 진단 점수 (변화 트렌드 표시용) */
  previousScore?: number
  /** 이전 진단 날짜 */
  previousDate?: string
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

/** 업종 평균 벤치마크 (추후 DB 기반으로 교체 가능) */
const INDUSTRY_AVG_SCORE = 48

function getBenchmarkText(score: number): string {
  const diff = score - INDUSTRY_AVG_SCORE
  if (diff > 0) return `업종 평균(${INDUSTRY_AVG_SCORE}점)보다 +${diff}점 높음`
  if (diff < 0) return `업종 평균(${INDUSTRY_AVG_SCORE}점)보다 ${diff}점 낮음`
  return `업종 평균(${INDUSTRY_AVG_SCORE}점)과 동일`
}

/** 게이미피케이션 뱃지 */
const SCORE_BADGES: { min: number; label: string; emoji: string }[] = [
  { min: 90, label: '마케팅 마스터', emoji: '👑' },
  { min: 70, label: '성장 궤도 진입', emoji: '🚀' },
  { min: 50, label: 'SEO 초보 탈출', emoji: '💪' },
  { min: 30, label: '첫 걸음 시작', emoji: '🌱' },
  { min: 0, label: '진단 완료', emoji: '✅' },
]

function getScoreBadge(score: number): { label: string; emoji: string } {
  return (
    SCORE_BADGES.find((b) => score >= b.min) ??
    SCORE_BADGES[SCORE_BADGES.length - 1]!
  )
}

export function DashboardContent({
  overallScore,
  citation,
  isPartial,
  blockedReason,
  diagnosisId,
  tier,
  previousScore,
  previousDate,
}: DashboardContentProps): React.JSX.Element {
  const scoreColor = SCORING.getScoreColor(overallScore.score)
  const isFree = tier === 'free'

  const [showGiftModal, setShowGiftModal] = useState(false)

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
          {!isFree && (
            <a
              href={`/api/reports/${diagnosisId}/pdf`}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-600 hover:shadow-md cursor-pointer"
            >
              <Download className="size-3.5" />
              PDF
            </a>
          )}
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

      {/* 선물 코드 모달 */}
      {showGiftModal && (
        <GiftCodeModal
          diagnosisId={diagnosisId}
          onClose={() => setShowGiftModal(false)}
        />
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
          {/* 게이미피케이션 뱃지 */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            <span>{getScoreBadge(overallScore.score).emoji}</span>
            {getScoreBadge(overallScore.score).label}
          </span>
          {/* 업종 평균 벤치마크 */}
          <p className="text-xs text-slate-400">
            {getBenchmarkText(overallScore.score)}
          </p>
          {/* 점수 변화 트렌드 */}
          {previousScore !== undefined && previousDate && (
            <ScoreTrend
              currentScore={overallScore.score}
              previousScore={previousScore}
              previousDate={previousDate}
            />
          )}

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
              확인 불가{' '}
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
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {visibleQuickWins.map((qw) => (
                <QuickWinCard
                  key={qw.ruleId}
                  quickWin={qw}
                  diagnosisId={diagnosisId}
                  canSelfReport={!isFree}
                />
              ))}
            </div>
            {/* 모바일 스크롤 힌트 그라데이션 */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent md:hidden" />
          </div>

          {/* Free 사용자: 나머지 Quick Win은 BlurOverlay */}
          {isFree && hiddenQuickWins.length > 0 && (
            <BlurOverlay
              visiblePercent={15}
              onCtaClick={() => setShowGiftModal(true)}
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

      {/* 2.5행: 리스크 히트맵 — 항상 표시 (핵심 요약) */}
      {categories.length > 0 && <RiskHeatmap categories={categories} />}

      {/* 2.6행: 상세 분석 (접기/펼치기) — 매트릭스 + 카테고리 */}
      {!isFree && quickWins.length > 0 && (
        <DetailSection title="상세 분석 더 보기">
          <ImpactMatrix quickWins={quickWins} />
        </DetailSection>
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
              onClick={() => setShowGiftModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 cursor-pointer"
            >
              상세 분석 받기 →
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

      {/* 3행: 카테고리별 점수 (접기) */}
      <DetailSection title="카테고리별 상세 점수">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryScoreCard
              key={cat.id}
              category={cat}
              diagnosisId={diagnosisId}
            />
          ))}
        </div>
      </DetailSection>

      {/* 4행: NPS 피드백 (Free/Paid 공통, 페이지 최하단) */}
      <NPSSection diagnosisId={diagnosisId} />
    </div>
  )
}

/** 접기/펼치기 섹션 */
function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-left cursor-pointer group"
      >
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="text-sm text-primary-500 group-hover:text-primary-600">
          {open ? '접기 ▲' : '펼치기 ▼'}
        </span>
      </button>
      {open && <div className="flex flex-col gap-4">{children}</div>}
    </section>
  )
}
