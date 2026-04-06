'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { BLUR_OVERLAY_CTA } from '@/config/report'
import { IMPACT_CATEGORY_LABELS } from '@/config/revenue'
import type { AIInsight } from '@/features/diagnosis-paid'
import {
  classifyInsight,
  dedupeInsightsByImpactCategory,
} from '@/lib/utils/insight-aggregation'

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
  const impactCategoryId = classifyInsight(insight)
  const impactLabel = IMPACT_CATEGORY_LABELS[impactCategoryId]

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} p-5 shadow-sm`}
    >
      {/* 뱃지 라인: 심각도 > 영향 카테고리 > 원본 카테고리 > 실행 가능 */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.bg} ${config.text}`}
        >
          {config.label}
        </span>
        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
          {impactLabel}
        </span>
        <span className="text-xs text-slate-400">#{insight.category}</span>
        {insight.actionable && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            실행 가능
          </span>
        )}
      </div>

      <h3 className="mb-1 text-sm font-semibold text-slate-900">
        {insight.title}
      </h3>

      {/*
        Phase A (2026-04-06): 개별 카드 금액 블록 제거.
        금액은 상단 TotalLeakageCard 한 곳에서만 표시 (지시문 Task 3 — 중복 방지).
      */}

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

  // Phase A (2026-04-06): 8개 영향 카테고리 기준 dedupe → 카테고리당 최대 3개 대표
  // 예: 기존 critical 10 + warning 20 = 30장 → dedupe 후 카테고리별 대표 ≤ 24장
  // 지시문 Task 3: "통합 후 항목 수가 줄어도 OK"
  const deduped = dedupeInsightsByImpactCategory(safeInsights)

  const content = (
    <section className="flex flex-col gap-4" aria-label="AI 인사이트">
      <h2 className="text-lg font-semibold text-slate-900">AI 인사이트</h2>
      <p className="text-sm text-slate-500">
        AI가 발견한 핵심 인사이트와 개선 제안입니다. 동일한 근본 원인은 대표
        항목으로 통합되어 표시됩니다.
      </p>

      <div className="flex flex-col gap-3">
        {deduped.map((insight, idx) => (
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
