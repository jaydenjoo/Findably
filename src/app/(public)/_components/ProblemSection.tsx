import { LANDING } from '@/config/landing'

export function ProblemSection(): React.JSX.Element {
  const { problem } = LANDING

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-[36px] md:leading-[1.2]">
          {problem.title}
        </h2>

        {/* Before vs After */}
        <div className="landing-stagger mt-10 flex flex-col gap-4 md:flex-row md:gap-6">
          {/* Before */}
          <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <span className="mb-2 inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {problem.before.label}
            </span>
            <p className="text-sm leading-relaxed text-slate-600">
              {problem.before.text}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center text-slate-300 md:text-2xl">
            <span className="hidden md:inline" aria-hidden="true">
              →
            </span>
            <span className="md:hidden" aria-hidden="true">
              ↓
            </span>
          </div>

          {/* After */}
          <div className="flex-1 rounded-lg border border-primary-200 bg-primary-50 p-5">
            <span className="mb-2 inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-600">
              {problem.after.label}
            </span>
            <p className="text-sm leading-relaxed text-slate-700">
              {problem.after.text}
            </p>
          </div>
        </div>

        {/* Key question */}
        <div className="mt-12">
          <p className="font-display text-xl font-bold tracking-[-0.01em] text-slate-900 md:text-2xl">
            {problem.question}
          </p>
          <p className="mt-2 text-base text-slate-500">{problem.subtext}</p>
        </div>
      </div>
    </section>
  )
}
