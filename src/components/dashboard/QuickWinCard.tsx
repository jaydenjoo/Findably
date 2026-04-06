'use client'

import { useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import type { QuickWin } from '@/features/diagnosis-free/types'
import { CATEGORY_CONFIG } from '@/features/diagnosis-free/constants'
import { SCORING } from '@/config/scoring'

interface QuickWinCardProps {
  quickWin: QuickWin
  diagnosisId: string
  /**
   * true 면 "고쳤어요" 자기보고 버튼 노출 (유료 사용자 전용)
   * false/undefined (기본): 버튼 미노출 (Free 사용자)
   */
  canSelfReport?: boolean
}

type ReportState = 'idle' | 'submitting' | 'reported' | 'error'

export function QuickWinCard({
  quickWin,
  diagnosisId,
  canSelfReport = false,
}: QuickWinCardProps): React.JSX.Element {
  const [reportState, setReportState] = useState<ReportState>('idle')

  const severity = SCORING.SEVERITY_STYLES[quickWin.severity] ?? {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    label: quickWin.severity,
  }
  const categoryName =
    CATEGORY_CONFIG[quickWin.category]?.name ?? quickWin.category
  const barColor =
    SCORING.SEVERITY_BAR_COLORS[quickWin.severity] ?? 'bg-slate-400'
  const detailUrl = `/diagnosis/overview?id=${diagnosisId}`

  async function handleSelfReport(
    e: MouseEvent<HTMLButtonElement>
  ): Promise<void> {
    // Link 네비게이션 차단 — 카드 전체가 Link 내부이므로
    e.preventDefault()
    e.stopPropagation()

    if (reportState === 'submitting' || reportState === 'reported') return

    setReportState('submitting')
    try {
      const res = await fetch('/api/self-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosisId,
          ruleId: quickWin.ruleId,
        }),
      })
      if (!res.ok) {
        setReportState('error')
        return
      }
      setReportState('reported')
    } catch (error) {
      console.error('[QuickWinCard] self-report 실패', error)
      setReportState('error')
    }
  }

  return (
    <Link href={detailUrl}>
      <article
        className="flex min-w-[260px] flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-px hover:shadow-md cursor-pointer"
        aria-label={`Quick Win: ${quickWin.ruleName} — 자세히 보기`}
      >
        {/* 상단: severity 뱃지 + 카테고리 */}
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severity.bg} ${severity.text}`}
          >
            {severity.label}
          </span>
          <span className="text-xs text-slate-500">{categoryName}</span>
        </div>

        {/* 중앙: 룰 이름 + 메시지 */}
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-sm font-semibold text-slate-900">
            {quickWin.ruleName}
          </h3>
          <p className="line-clamp-2 text-sm text-slate-500">
            {quickWin.message}
          </p>
        </div>

        {/* 하단: 예상 임팩트 + impact 바 */}
        <div className="rounded-md bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary-700">
          이 항목 수정 시{' '}
          <span className="font-bold">+{quickWin.impact}점</span> 예상
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">영향도</span>
            <span className="text-xs font-semibold text-slate-600">
              {quickWin.impact}점
            </span>
          </div>
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-slate-100"
            role="meter"
            aria-valuenow={quickWin.impact}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-label={`영향도 ${quickWin.impact}점`}
          >
            <div
              className={`h-full rounded-full ${barColor} transition-all`}
              style={{
                width: `${Math.min((quickWin.impact / 10) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* 자기보고 버튼 — 유료 사용자 전용 */}
        {canSelfReport && (
          <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
            {reportState === 'reported' ? (
              <div
                className="inline-flex items-center gap-1.5 rounded-md bg-success-50 px-2.5 py-1.5 text-xs font-semibold text-success-700"
                aria-live="polite"
              >
                <Check className="size-3.5" aria-hidden="true" />
                확인했어요 · 7일 후 재검사 예정
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSelfReport}
                disabled={reportState === 'submitting'}
                aria-label={`${quickWin.ruleName} 고쳤다고 표시`}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2.5 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {reportState === 'submitting' ? '기록 중...' : '고쳤어요 ✓'}
              </button>
            )}
            {reportState === 'error' && (
              <p role="alert" className="text-xs text-danger-600">
                기록에 실패했습니다. 다시 시도해주세요.
              </p>
            )}
          </div>
        )}
      </article>
    </Link>
  )
}
