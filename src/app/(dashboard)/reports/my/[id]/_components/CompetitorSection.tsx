import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { ScoreGauge } from '@/components/shared/ScoreGauge'
import { BLUR_OVERLAY_CTA } from '@/config/report'
import type { CompetitorAnalysis } from '@/features/diagnosis-paid'

interface CompetitorSectionProps {
  competitors: CompetitorAnalysis[]
  isPaid: boolean
}

export function CompetitorSection({
  competitors,
  isPaid,
}: CompetitorSectionProps): React.JSX.Element {
  if (competitors.length === 0) return <></>

  const content = (
    <section className="flex flex-col gap-4" aria-label="경쟁사 비교 분석">
      <h2 className="text-lg font-semibold text-slate-900">경쟁사 비교</h2>
      <p className="text-sm text-slate-500">
        주요 경쟁사와 비교한 강점·약점·기회 분석입니다.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {competitors.map((comp, idx) => (
          <div
            key={comp.url}
            className={`rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              idx === 0
                ? 'border-primary-200 bg-primary-50/40'
                : 'border-slate-200 bg-white'
            }`}
          >
            {/* 헤더 */}
            <div className="mb-4 flex items-center gap-3">
              <ScoreGauge
                score={comp.overallScore}
                size="sm"
                showLabel={false}
              />
              <div className="min-w-0">
                <h3
                  className="truncate text-sm font-semibold text-slate-900"
                  title={comp.url}
                >
                  {comp.url}
                </h3>
                {idx === 0 && (
                  <span className="text-xs text-primary-600">벤치마크</span>
                )}
              </div>
            </div>

            {/* 강점 */}
            <div className="mb-3">
              <h4 className="mb-1 text-xs font-semibold text-success-700">
                강점
              </h4>
              <ul className="space-y-1">
                {comp.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-slate-600"
                  >
                    <span
                      className="mt-1 size-1 shrink-0 rounded-full bg-success-500"
                      aria-hidden="true"
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* 약점 */}
            <div className="mb-3">
              <h4 className="mb-1 text-xs font-semibold text-danger-700">
                약점
              </h4>
              <ul className="space-y-1">
                {comp.weaknesses.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs text-slate-600"
                  >
                    <span
                      className="mt-1 size-1 shrink-0 rounded-full bg-danger-500"
                      aria-hidden="true"
                    />
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            {/* 갭 */}
            {comp.gaps.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-semibold text-warning-700">
                  우리가 앞선 점
                </h4>
                <ul className="space-y-1">
                  {comp.gaps.map((g, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-slate-600"
                    >
                      <span
                        className="mt-1 size-1 shrink-0 rounded-full bg-warning-500"
                        aria-hidden="true"
                      />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
