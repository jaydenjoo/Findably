'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
  {
    label: '💰 비즈니스 영향도',
    emoji: '💰',
    title: '점수를 비즈니스 언어로 번역합니다',
    desc: 'SEO 점수 47점이 뭔 뜻인지 모르겠다고요? Findably는 각 진단 항목이 비즈니스에 미치는 영향도를 업종 데이터 기반으로 분석하여, 어디를 먼저 고쳐야 하는지 우선순위를 잡아줍니다.',
    before: '메타 디스크립션 누락 — SEO 점수 -8점',
    after: '💰 비즈니스 영향도: 높음 ■■■■□\n"가게 앞 안내판이 없는 상태입니다"',
  },
  {
    label: '📝 3줄 요약',
    emoji: '📝',
    title: '전문용어 대신 대표님 언어로',
    desc: '"Schema Markup 미적용"? 대표님은 모릅니다. Findably는 "AI한테 명함을 안 줬습니다"로 번역합니다. 전문가 모드도 토글 한 번이면 됩니다.',
    before: 'Schema Markup 미적용 — GEO 영향도 높음',
    after:
      '📝 AI한테 명함을 안 줬습니다\nChatGPT가 회사를 소개하려 해도 기본 정보를 모릅니다',
  },
  {
    label: '🎮 개선 시뮬레이터',
    emoji: '🎮',
    title: '고치면 어떻게 달라지는지 미리보기',
    desc: 'Quick Win 항목을 체크하면 예상 점수 변화를 시뮬레이션합니다. 어떤 항목을 먼저 개선해야 가장 효과적인지, 우선순위를 데이터로 확인하세요.',
    before: '현재 47점 → 뭘 먼저 고쳐야 하지?',
    after: '🎮 ☑ 3개 선택 시: 47→68점 예상\n비즈니스 영향도 높은 순으로 정렬',
  },
  {
    label: '⚡ 경쟁사 비교',
    emoji: '⚡',
    title: '경쟁사 대비 어디가 부족한지 한눈에',
    desc: '점수를 경쟁사와 나란히 비교하고, 항목별로 "경쟁사는 하는데 우리는 안 하는 것" 리스트를 자동으로 생성합니다. 데이터 기반 의사결정을 돕습니다.',
    before: '우리 47점 — 이게 높은 건지 낮은 건지 모름',
    after:
      '⚡ 우리 47점 vs 경쟁사 평균 72점\n"경쟁사는 하는데 우리는 안 하는 것" 5개 발견',
  },
]

const FeatureTabs = () => {
  const [active, setActive] = useState(0)

  return (
    <section
      id="features"
      aria-labelledby="heading-features"
      className="py-28 px-6 bg-findably-light"
    >
      <div className="max-w-[1120px] mx-auto">
        <div className="text-center mb-12">
          <h2
            id="heading-features"
            className="text-3xl font-bold tracking-tight mb-4 text-foreground"
          >
            마케팅 리포트를 바로 실행 계획으로 바꿔드립니다
          </h2>
          <p className="text-muted-foreground text-sm">
            중소기업{' '}
            <span className="text-4xl font-black text-findably-cyan align-middle leading-none mx-1">
              73%
            </span>
            가 &lsquo;마케팅에 돈은 쓰는데, 뭐가 효과인지 모르겠다&rsquo;고
            합니다.*
            <span className="block text-[10px] mt-2 text-slate-400">
              * Constant Contact 2025, SMB 2,500개사 대상 조사
            </span>
          </p>
        </div>

        <div className="flex flex-nowrap overflow-x-auto md:flex-wrap md:justify-center gap-3 mb-12 pb-2 -mx-2 px-2">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 border min-h-[44px] ${
                active === i
                  ? 'bg-findably-cyan/10 text-findably-cyan border-findably-cyan/40 shadow-[0_0_0_1px_hsla(187,92%,43%,0.15)]'
                  : 'bg-background text-muted-foreground border-border hover:border-findably-cyan/20 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-background p-6 md:p-10 rounded-[20px] border border-border shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.35,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              {(() => {
                const tab = tabs[active]
                if (!tab) return null
                return (
                  <>
                    <div className="space-y-6">
                      <div className="text-4xl">{tab.emoji}</div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        {tab.title}
                      </h3>
                      <p className="text-muted-foreground leading-[1.7]">
                        {tab.desc}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="p-6 bg-red-50 border border-red-100 rounded-xl relative overflow-hidden">
                        <span className="absolute top-0 right-0 bg-red-100 text-red-800 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                          기존 방식
                        </span>
                        <p className="text-red-300 font-mono text-sm line-through">
                          {tab.before}
                        </p>
                      </div>
                      <div className="p-6 bg-cyan-50 border border-cyan-100 rounded-2xl relative shadow-sm">
                        <span className="absolute top-0 right-0 bg-findably-cyan text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                          Findably 방식
                        </span>
                        <p className="text-cyan-900 font-bold whitespace-pre-line leading-relaxed">
                          {tab.after}
                        </p>
                      </div>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

export default FeatureTabs
