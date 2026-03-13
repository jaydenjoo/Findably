import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { LANDING } from '@/config/landing'

export function FinalCTA(): React.JSX.Element {
  const { finalCta } = LANDING

  return (
    <section className="relative overflow-hidden bg-slate-900 py-16 md:py-24">
      {/* Background blob */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-white md:text-[36px] md:leading-[1.2]">
          {finalCta.title}
        </h2>
        <p className="mt-4 text-base text-slate-400">{finalCta.description}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className={buttonVariants({
              size: 'lg',
              className:
                'h-12 px-6 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
            })}
          >
            {finalCta.cta.primary}
          </Link>
          <Link
            href="/reports/sample"
            className={buttonVariants({
              variant: 'outline',
              size: 'lg',
              className:
                'h-12 border-slate-600 px-6 text-base font-semibold text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-white',
            })}
          >
            {finalCta.cta.secondary}
          </Link>
        </div>
      </div>
    </section>
  )
}
