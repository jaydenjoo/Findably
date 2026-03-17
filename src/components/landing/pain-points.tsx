'use client'

import { motion } from 'framer-motion'

const items = [
  {
    emoji: '💸',
    quote: '돈은 쓰는데 뭐가 효과인지 모르겠다',
    solution: '항목별 ROI 영향도 + 실행 우선순위 제공',
  },
  {
    emoji: '🤔',
    quote: '전문용어만 써서 이해가 안 된다',
    solution: '비유 기반 3줄 요약으로 번역',
  },
  {
    emoji: '📍',
    quote: '리포트 받아도 다음 행동을 모르겠다',
    solution: 'Quick Win 3개 + 90일 실행 로드맵 자동 생성',
  },
]

const PainPoints = () => (
  <div className="bg-findably-light border-y border-border py-7">
    <div className="max-w-[1120px] mx-auto px-6 grid md:grid-cols-3 gap-12 items-end">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.7 }}
          className={`flex flex-col items-center text-center gap-3 ${
            i === 0
              ? 'md:scale-[1.05] md:origin-bottom'
              : i === 2
                ? 'md:pb-2'
                : ''
          }`}
        >
          <span className={`mb-2 ${i === 0 ? 'text-[38px]' : 'text-[32px]'}`}>
            {item.emoji}
          </span>
          <p className="text-muted-foreground italic text-sm">
            &ldquo;{item.quote}&rdquo;
          </p>
          <p
            className={`text-findably-cyan font-bold tracking-tight ${
              i === 0 ? 'text-[15px]' : 'text-sm'
            }`}
          >
            {item.solution}
          </p>
        </motion.div>
      ))}
    </div>
  </div>
)

export default PainPoints
