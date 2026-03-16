import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { BLUR_OVERLAY_CTA } from '@/config/report'
import type { SwotAnalysis } from '@/features/diagnosis-paid'

interface SwotSectionProps {
  swot: SwotAnalysis
  isPaid: boolean
}

const SWOT_CONFIG = [
  {
    key: 'strengths' as const,
    label: '강점 (Strengths)',
    bgColor: 'bg-success-50',
    borderColor: 'border-success-500',
    textColor: 'text-success-700',
  },
  {
    key: 'weaknesses' as const,
    label: '약점 (Weaknesses)',
    bgColor: 'bg-danger-50',
    borderColor: 'border-danger-500',
    textColor: 'text-danger-700',
  },
  {
    key: 'opportunities' as const,
    label: '기회 (Opportunities)',
    bgColor: 'bg-warning-50',
    borderColor: 'border-warning-500',
    textColor: 'text-warning-700',
  },
  {
    key: 'threats' as const,
    label: '위협 (Threats)',
    bgColor: 'bg-danger-50',
    borderColor: 'border-danger-500',
    textColor: 'text-danger-700',
  },
] as const

export function SwotSection({
  swot,
  isPaid,
}: SwotSectionProps): React.JSX.Element {
  const content = (
    <section className="flex flex-col gap-4" aria-label="SWOT 분석">
      <h2 className="text-lg font-semibold text-slate-900">SWOT 분석</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SWOT_CONFIG.map((config) => (
          <div
            key={config.key}
            className={`rounded-xl border-l-4 ${config.borderColor} ${config.bgColor} p-5 shadow-sm`}
          >
            <h3 className={`mb-3 text-sm font-semibold ${config.textColor}`}>
              {config.label}
            </h3>
            <ul className="flex flex-col gap-2">
              {swot[config.key].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${config.borderColor.replace('border-', 'bg-')}`}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
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
