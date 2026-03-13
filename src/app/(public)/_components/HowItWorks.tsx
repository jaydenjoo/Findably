import { Globe, BarChart3, FileText } from 'lucide-react'
import { LANDING } from '@/config/landing'

const STEP_ICONS = [Globe, BarChart3, FileText] as const

export function HowItWorks(): React.JSX.Element {
  const { howItWorks } = LANDING

  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-[36px] md:leading-[1.2]">
          {howItWorks.title}
        </h2>

        <div className="landing-stagger mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {howItWorks.steps.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? STEP_ICONS[0]
            return (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center"
              >
                {/* Connector line (desktop only) */}
                {index < howItWorks.steps.length - 1 && (
                  <div
                    className="pointer-events-none absolute left-[calc(50%+32px)] top-6 hidden h-px w-[calc(100%-64px)] bg-slate-300 md:block"
                    aria-hidden="true"
                  />
                )}

                {/* Step number circle + icon */}
                <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                  <Icon className="h-5 w-5 text-primary-600" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[11px] font-bold text-white">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
