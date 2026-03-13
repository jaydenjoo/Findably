import { Search, Bot, Zap } from 'lucide-react'
import { LANDING } from '@/config/landing'

const FEATURE_ICONS = [Search, Bot, Zap] as const

export function Features(): React.JSX.Element {
  const { features } = LANDING

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-[36px] md:leading-[1.2]">
          {features.title}
        </h2>

        {/* Asymmetric grid: 1 large + 2 small */}
        <div className="landing-stagger mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.cards.map((card, index) => {
            const Icon = FEATURE_ICONS[index] ?? FEATURE_ICONS[0]
            const isHighlight = card.highlight

            return (
              <div
                key={card.title}
                className={`group rounded-xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isHighlight
                    ? 'bg-primary-600 text-white shadow-sm md:col-span-2 md:row-span-1'
                    : 'border border-slate-200 bg-white shadow-sm'
                }`}
              >
                {/* Icon */}
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${
                    isHighlight ? 'bg-white/20' : 'bg-primary-50'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isHighlight ? 'text-white' : 'text-primary-600'}`}
                  />
                </div>

                <h3
                  className={`font-display text-lg font-semibold ${
                    isHighlight ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {card.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    isHighlight ? 'text-white/80' : 'text-slate-500'
                  }`}
                >
                  {card.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
