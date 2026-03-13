import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { LANDING } from '@/config/landing'

const HERO_VISUAL_METRICS = [
  { label: 'SEO 점수', value: 68, colorClass: 'bg-primary-500' },
  { label: 'GEO 점수', value: 45, colorClass: 'bg-warning-500' },
  { label: '콘텐츠 품질', value: 82, colorClass: 'bg-success-500' },
] as const

const GAUGE_RADIUS = 52
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS
const GAUGE_SCORE = 72

function HeroVisual(): React.JSX.Element {
  return (
    <div
      className="landing-stagger relative"
      role="img"
      aria-label="마케팅 점수 미리보기 게이지, 72점"
    >
      {/* Main card — dashboard preview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-success-500" />
          <span className="text-sm font-semibold text-slate-700">
            마케팅 진단 결과
          </span>
        </div>

        {/* Score gauge */}
        <div className="mb-6 flex items-center justify-center">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg width="128" height="128" className="-rotate-90">
              <circle
                cx="64"
                cy="64"
                r={GAUGE_RADIUS}
                fill="none"
                className="stroke-slate-200"
                strokeWidth="8"
              />
              <circle
                cx="64"
                cy="64"
                r={GAUGE_RADIUS}
                fill="none"
                className="stroke-primary-500"
                strokeWidth="8"
                strokeDasharray={GAUGE_CIRCUMFERENCE}
                strokeDashoffset={GAUGE_CIRCUMFERENCE * (1 - GAUGE_SCORE / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display text-3xl font-extrabold text-primary-600">
                {GAUGE_SCORE}
              </span>
              <span className="text-xs font-semibold text-primary-600">
                보통
              </span>
            </div>
          </div>
        </div>

        {/* Metric bars */}
        <div className="space-y-3">
          {HERO_VISUAL_METRICS.map((metric) => (
            <div key={metric.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-600">{metric.label}</span>
                <span className="font-semibold text-slate-700">
                  {metric.value}점
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${metric.colorClass}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-3 -top-3 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-600 shadow-sm ring-1 ring-success-500/20">
        23개 문제 발견
      </div>
    </div>
  )
}

export function Hero(): React.JSX.Element {
  const { hero } = LANDING

  return (
    <section className="relative overflow-hidden bg-slate-50 py-16 md:py-24">
      {/* Background texture — micro dots */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, #dde0e4 0.5px, transparent 0.5px)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden="true"
      />

      {/* Background blob */}
      <div
        className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Text */}
        <div className="landing-stagger flex flex-col gap-6">
          <span className="w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold tracking-[0.05em] text-primary-600">
            {hero.badge}
          </span>

          <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] text-slate-900 md:text-[56px] md:leading-[1.1]">
            {hero.title.line1}
            <br />
            <span className="text-primary-500">{hero.title.highlight}</span>
          </h1>

          <p className="max-w-lg text-base leading-[1.7] text-slate-500">
            {hero.description}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={buttonVariants({
                size: 'lg',
                className:
                  'h-12 px-6 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
              })}
            >
              {hero.cta.primary}
            </Link>
            <Link
              href="/reports/sample"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'h-12 px-6 text-base font-semibold',
              })}
            >
              {hero.cta.secondary}
            </Link>
          </div>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:gap-8">
            {hero.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="font-display text-2xl font-extrabold text-slate-900">
                  {stat.value}
                </span>
                <span className="text-sm text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Visual mockup */}
        <div className="hidden lg:block">
          <HeroVisual />
        </div>
      </div>
    </section>
  )
}
