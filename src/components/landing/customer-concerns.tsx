'use client'

import { motion } from 'framer-motion'

const concerns = [
  {
    q: '마케팅비 쓰는데 어디서 새는지 모르겠다',
    a: '항목별 매출 영향 금액 환산 + 가장 큰 구멍부터 막는 순서를 제공합니다.',
    note: '(실제 고객 상담에서 가장 많이 듣는 질문입니다)',
    radius: 'rounded-[20px]',
  },
  {
    q: '리포트는 받는데, 그래서 뭘 먼저 해야 하는지 모르겠어요',
    a: '3줄 요약 카드로 비유 기반 쉬운 설명을 기본 제공합니다. 전문가 모드는 토글로 전환 가능합니다.',
    radius: 'rounded-2xl',
  },
  {
    q: 'ChatGPT에 우리 회사 검색하면 경쟁사만 나와요',
    a: 'GEO 진단으로 AI 검색 가시성을 분석하고, 어떻게 노출을 개선할 수 있는지 가이드를 제공합니다.',
    note: '— 2026년 마케팅 담당자 설문, 상위 고민 3위',
    radius: 'rounded-3xl',
  },
]

const CustomerConcerns = () => (
  <section
    aria-labelledby="heading-concerns"
    className="py-20 px-6 bg-background"
  >
    <div className="max-w-[1120px] mx-auto">
      <div className="text-center mb-16">
        <h2
          id="heading-concerns"
          className="text-3xl font-bold tracking-tight mb-4 text-foreground"
        >
          이런 고민이 있으시다면
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {concerns.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.7 }}
            className={`p-8 ${item.radius} border border-border bg-background shadow-sm`}
          >
            <p className="font-bold text-foreground mb-4 leading-snug">
              &ldquo;{item.q}&rdquo;
            </p>
            <div className="flex gap-3">
              <div className="w-1 h-auto bg-findably-cyan rounded-full shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground leading-[1.7]">
                  {item.a}
                </p>
                {item.note && (
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

export default CustomerConcerns
