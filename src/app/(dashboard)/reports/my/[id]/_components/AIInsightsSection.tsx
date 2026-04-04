'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { BLUR_OVERLAY_CTA } from '@/config/report'
import { calculateRevenueImpact } from '@/config/revenue'
import type { AIInsight } from '@/features/diagnosis-paid'

interface AIInsightsSectionProps {
  insights: AIInsight[]
  isPaid: boolean
}

const SEVERITY_CONFIG = {
  critical: {
    label: '심각',
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    border: 'border-danger-200',
    dot: 'bg-danger-500',
    order: 0,
  },
  warning: {
    label: '주의',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    border: 'border-warning-200',
    dot: 'bg-warning-500',
    order: 1,
  },
  info: {
    label: '정보',
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    border: 'border-primary-200',
    dot: 'bg-primary-500',
    order: 2,
  },
} as const

function InsightCard({ insight }: { insight: AIInsight }): React.JSX.Element {
  const [showExpert, setShowExpert] = useState(false)
  const config = SEVERITY_CONFIG[insight.severity]
  const revenue = calculateRevenueImpact({ severity: insight.severity })

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} p-5 shadow-sm`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.bg} ${config.text}`}
        >
          {config.label}
        </span>
        <span className="text-xs text-slate-400">{insight.category}</span>
        {insight.actionable && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            실행 가능
          </span>
        )}
      </div>

      <h3 className="mb-1 text-sm font-semibold text-slate-900">
        {insight.title}
      </h3>

      {/* 💰 매출 영향 (critical/warning만) */}
      {revenue && (
        <div className="my-3 rounded-lg bg-white/60 p-3">
          <p className="text-sm font-semibold text-slate-800">
            💰 이 문제로 월 약 {revenue.monthlyLoss}만원의 잠재 방문자를 놓치고
            있습니다
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
            <span>
              안 고치면 → 연간 약{' '}
              <strong className="text-danger-700">
                {revenue.annualLoss}만원
              </strong>{' '}
              손실 지속
            </span>
            <span>
              고치면 → 월{' '}
              <strong className="text-success-700">
                +{revenue.monthlyGain}만원
              </strong>{' '}
              추가 유입
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            * 업종 평균 기준 추정치
          </p>
        </div>
      )}

      <p className="text-sm text-slate-600">{insight.description}</p>

      {/* 전문가용 접기 (impact 텍스트가 있으면) */}
      {insight.impact && (
        <div className="mt-3">
          <button
            onClick={() => setShowExpert(!showExpert)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronDown
              className={`size-3 transition-transform duration-200 ${showExpert ? 'rotate-180' : ''}`}
            />
            📊 상세 지표 (전문가용)
          </button>
          {showExpert && (
            <p className="mt-2 text-xs text-slate-500 pl-4">{insight.impact}</p>
          )}
        </div>
      )}

      {insight.suggestedFix && (
        <div className="mt-3 rounded-lg bg-white/60 p-3">
          <h4 className="mb-1 text-xs font-semibold text-slate-700">
            개선 방법
          </h4>
          <p className="text-xs text-slate-600">{insight.suggestedFix}</p>
        </div>
      )}
    </div>
  )
}

export function AIInsightsSection({
  insights,
  isPaid,
}: AIInsightsSectionProps): React.JSX.Element {
  const safeInsights = insights ?? []
  if (safeInsights.length === 0) return <></>

  const sorted = [...safeInsights].sort(
    (a, b) =>
      SEVERITY_CONFIG[a.severity].order - SEVERITY_CONFIG[b.severity].order
  )

  const content = (
    <section className="flex flex-col gap-4" aria-label="AI 인사이트">
      <h2 className="text-lg font-semibold text-slate-900">AI 인사이트</h2>
      <p className="text-sm text-slate-500">
        AI가 발견한 핵심 인사이트와 개선 제안입니다.
      </p>

      <div className="flex flex-col gap-3">
        {sorted.map((insight, idx) => (
          <InsightCard key={idx} insight={insight} />
        ))}
      </div>
    </section>
  )

  if (isPaid) return content

  return (
    <BlurOverlay
      visiblePercent={BLUR_OVERLAY_CTA.visiblePercent}
      ctaLabel={BLUR_OVERLAY_CTA.ctaLabel}
      ctaHref={BLUR_OVERLAY_CTA.ctaHref}
      sampleLabel={BLUR_OVERLAY_CTA.sampleLabel}
      sampleHref={BLUR_OVERLAY_CTA.sampleHref}
    >
      {content}
    </BlurOverlay>
  )
}
