import Link from 'next/link'
import { Check } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { LANDING } from '@/config/landing'

export function Pricing(): React.JSX.Element {
  const { pricing } = LANDING

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-[36px] md:leading-[1.2]">
            {pricing.title}
          </h2>
          <p className="mt-3 text-base text-slate-500">{pricing.description}</p>
        </div>

        <div className="landing-stagger mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {pricing.plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md md:p-8 ${
                plan.recommended
                  ? 'border-2 border-primary-500 bg-white shadow-md'
                  : 'border border-slate-200 bg-white shadow-sm'
              }`}
            >
              {/* Recommended badge */}
              {plan.recommended && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary-500 px-3 py-0.5 text-xs font-semibold text-white">
                  추천
                </span>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold text-slate-900">
                    {plan.price}
                  </span>
                  {plan.priceUnit && (
                    <span className="text-sm text-slate-500">
                      {plan.priceUnit}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {plan.description}
                </p>
              </div>

              {/* Feature list */}
              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={buttonVariants({
                  variant: plan.recommended ? 'default' : 'outline',
                  size: 'lg',
                  className: `h-11 w-full font-semibold ${
                    plan.recommended
                      ? 'shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'
                      : ''
                  }`,
                })}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
