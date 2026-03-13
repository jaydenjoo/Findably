import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { LANDING } from '@/config/landing'
import { SCORING } from '@/config/scoring'

const GAUGE_RADIUS = 52
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

export function SamplePreview(): React.JSX.Element {
  const { samplePreview } = LANDING
  const offset = GAUGE_CIRCUMFERENCE * (1 - samplePreview.score / 100)

  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-[36px] md:leading-[1.2]">
            {samplePreview.title}
          </h2>
          <p className="mt-3 text-base text-slate-500">
            {samplePreview.description}
          </p>
        </div>

        {/* Preview card */}
        <div className="landing-stagger mx-auto mt-10 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            {/* Score gauge */}
            <div
              className="flex shrink-0 flex-col items-center"
              role="meter"
              aria-valuenow={samplePreview.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`그린테크 종합 점수 ${samplePreview.score}점`}
            >
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg width="112" height="112" className="-rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r={GAUGE_RADIUS}
                    fill="none"
                    className="stroke-slate-200"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r={GAUGE_RADIUS}
                    fill="none"
                    className="stroke-primary-500"
                    strokeWidth="8"
                    strokeDasharray={GAUGE_CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-display text-3xl font-extrabold text-primary-600">
                    {samplePreview.score}
                  </span>
                  <span className="text-xs font-semibold text-primary-600">
                    {SCORING.getScoreLabel(samplePreview.score)}
                  </span>
                </div>
              </div>
              <span className="mt-2 text-xs text-slate-500">종합 점수</span>
            </div>

            {/* Metric bars */}
            <div className="w-full space-y-4">
              {samplePreview.metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{metric.label}</span>
                    <span className="font-semibold text-slate-700">
                      {metric.value}점
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${metric.color}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link
              href="/reports/sample"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'h-11 px-6 font-semibold',
              })}
            >
              {samplePreview.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
