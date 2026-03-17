'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    step: '01',
    time: '10초',
    title: '🔗 URL 입력',
    desc: '웹사이트 주소 입력 + 업종 선택 (선택사항)',
  },
  {
    step: '02',
    time: '약 2분',
    title: '🔍 자동 수집',
    desc: '크롤러가 웹사이트 구조, 콘텐츠, 기술 요소를 자동 수집',
  },
  {
    step: '03',
    time: '약 1분',
    title: '🤖 AI 정밀 분석',
    desc: '룰 기반 1차 필터 + AI 정밀 분석으로 60개+ 항목 진단',
  },
  {
    step: '04',
    time: '약 30초',
    title: '🧠 전략 생성',
    desc: 'AI가 핵심 문제 Top 3 + Quick Win + 90일 로드맵 생성',
  },
  {
    step: '05',
    time: '즉시',
    title: '📊 영향도 분석',
    desc: '각 항목의 비즈니스 영향도를 업종 데이터 기반으로 분석',
  },
  {
    step: '06',
    time: '즉시',
    title: '📋 리포트 완성',
    desc: '대시보드 + PDF + 대표님 버전 3줄 요약 자동 생성',
  },
]

const radiuses = [
  'rounded-2xl',
  'rounded-xl',
  'rounded-[20px]',
  'rounded-2xl',
  'rounded-xl',
  'rounded-[20px]',
]

const HowItWorks = () => (
  <section
    aria-labelledby="heading-how-it-works"
    className="py-24 px-6 bg-findably-light"
  >
    <div className="max-w-[1120px] mx-auto">
      <div className="text-center mb-16">
        <h2
          id="heading-how-it-works"
          className="text-3xl font-bold tracking-tight mb-4 text-foreground"
        >
          6단계 자동 진단, 약 5분이면 완료
        </h2>
      </div>

      <div className="relative grid md:grid-cols-3 gap-6">
        <svg
          className="hidden md:block absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          <line
            x1="345"
            y1="250"
            x2="375"
            y2="250"
            stroke="hsl(187, 92%, 75%)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <polygon points="375,250 369,246 369,254" fill="hsl(187, 92%, 75%)" />
          <line
            x1="675"
            y1="250"
            x2="705"
            y2="250"
            stroke="hsl(187, 92%, 75%)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <line
            x1="830"
            y1="520"
            x2="830"
            y2="550"
            stroke="hsl(187, 92%, 75%)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <line
            x1="345"
            y1="750"
            x2="375"
            y2="750"
            stroke="hsl(187, 92%, 75%)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <line
            x1="675"
            y1="750"
            x2="705"
            y2="750"
            stroke="hsl(187, 92%, 75%)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
        </svg>

        {steps.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.7 }}
            whileHover={{ y: -4 }}
            className={`relative z-10 bg-background p-8 ${radiuses[i]} border border-border group transition-shadow hover:shadow-md`}
          >
            <span className="absolute top-4 right-4 text-[10px] font-bold text-muted-foreground bg-findably-light px-2 py-1 rounded-md">
              {item.time}
            </span>
            <div className="text-findably-cyan font-bold text-sm mb-4">
              {item.step}
            </div>
            <h4 className="text-lg font-bold mb-2 text-foreground">
              {item.title}
            </h4>
            <p className="text-muted-foreground text-sm leading-[1.7]">
              {item.desc}
            </p>
            {i < 5 && (
              <div className="md:hidden flex justify-center mt-4 -mb-8 relative z-20">
                <svg width="20" height="24" viewBox="0 0 20 24">
                  <line
                    x1="10"
                    y1="0"
                    x2="10"
                    y2="18"
                    stroke="hsl(187, 92%, 75%)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <polygon
                    points="10,24 6,16 14,16"
                    fill="hsl(187, 92%, 75%)"
                  />
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
)

export default HowItWorks
