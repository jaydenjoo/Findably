'use client'

import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

const plans = [
  {
    name: 'Free',
    price: '0원',
    period: '',
    features: ['1회 정밀 진단 리포트', '비즈니스 영향도 분석', '3줄 요약 카드'],
    cta: '시작하기',
    highlighted: false,
    radius: 'rounded-[20px]',
  },
  {
    name: 'Starter',
    price: '9.9만원',
    period: '/월',
    badge: '가장 인기',
    features: [
      '상시 모니터링 (주 1회)',
      '경쟁사 비교 (3개사)',
      '개선 시뮬레이터',
      '90일 실행 로드맵',
    ],
    cta: '9.9만원에 시작하기',
    highlighted: true,
    radius: 'rounded-3xl',
  },
  {
    name: 'Pro',
    price: '24.9만원',
    period: '/월',
    features: [
      '실시간 모니터링',
      '경쟁사 비교 (무제한)',
      'AI 검색(GEO) 최적화 가이드',
      'API 연동 지원',
    ],
    cta: '문의하기',
    highlighted: false,
    radius: 'rounded-2xl',
  },
]

const Pricing = () => (
  <section
    id="pricing"
    aria-labelledby="heading-pricing"
    className="py-24 px-6 bg-findably-light"
  >
    <div className="max-w-[1120px] mx-auto">
      <div className="text-center mb-16">
        <h2
          id="heading-pricing"
          className="text-3xl font-bold tracking-tight mb-4 text-foreground"
        >
          심플한 가격
        </h2>
        <p className="text-muted-foreground">
          첫 진단은 무료. 가치를 확인한 후 결정하세요.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.7 }}
            className={`bg-background p-8 ${plan.radius} flex flex-col relative transition-all ${
              plan.highlighted
                ? 'border-2 border-findably-cyan shadow-xl shadow-findably-cyan/5 md:scale-105 bg-findably-cyan/[0.03]'
                : 'border border-border'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-findably-cyan text-findably-cyan-foreground text-[10px] font-bold px-4 py-1 rounded-full">
                {plan.badge}
              </div>
            )}
            <h3 className="text-xl font-bold mb-2 text-foreground">
              {plan.name}
            </h3>
            <div className="text-3xl font-bold mb-6 text-foreground">
              {plan.price}
              {plan.period && (
                <span className="text-sm font-normal text-muted-foreground">
                  {plan.period}
                </span>
              )}
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((f, j) => (
                <li
                  key={j}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="w-4 h-4 text-findably-cyan shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-3 rounded-full font-bold text-sm transition-all min-h-[44px] ${
                plan.highlighted
                  ? 'bg-findably-cyan text-findably-cyan-foreground hover:bg-findably-cyan/90'
                  : 'border border-border text-foreground hover:bg-findably-light'
              }`}
            >
              {plan.cta}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

export default Pricing
