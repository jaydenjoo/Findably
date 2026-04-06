import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { BLUR_OVERLAY_CTA } from '@/config/report'

interface CmoSummarySectionProps {
  summary: string
  qualityScore?: number
  isPaid: boolean
}

export function CmoSummarySection({
  summary,
  qualityScore,
  isPaid,
}: CmoSummarySectionProps): React.JSX.Element {
  const content = (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-label="대표님을 위한 3줄 요약"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        대표님을 위한 3줄 요약
      </h2>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {qualityScore !== undefined && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            <ScoreGauge score={qualityScore} size="sm" />
            {/*
              Phase A (2026-04-06): "품질 점수" → "AI 검증 품질"
              종합 마케팅 점수(62점 등)와 CMO의 리포트 검증 품질 점수가 혼동되지
              않도록 명확히 구분. 지시문 Task 2 점수 통일 요건의 보조 조치.
            */}
            <span className="text-xs text-slate-500">AI 검증 품질</span>
          </div>
        )}
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {summary}
        </p>
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
