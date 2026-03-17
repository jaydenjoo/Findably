'use client'

import { motion, useInView } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

const Gauge = ({
  value,
  label,
  color,
  delay = 0,
}: {
  value: number
  label: string
  color: string
  delay?: number
}) => {
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const arcDeg = 270
  const arcLength = (arcDeg / 360) * circumference
  const gapLength = circumference - arcLength
  const progress = (value / 100) * arcLength
  const offset = arcLength - progress

  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const duration = 1500
    const delayMs = delay
    const timeout = setTimeout(() => {
      const startTime = performance.now()
      const animate = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setCount(Math.round(eased * value))
        if (t < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, delayMs)
    return () => clearTimeout(timeout)
  }, [isInView, value, delay])

  const rotationOffset = 135

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="meter"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} ${value}점`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${gapLength}`}
            strokeLinecap="round"
            className="text-border/60"
            style={{
              transform: `rotate(${rotationOffset}deg)`,
              transformOrigin: 'center',
            }}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${gapLength}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: arcLength }}
            animate={isInView ? { strokeDashoffset: offset } : {}}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
              delay: delay / 1000,
            }}
            style={{
              transform: `rotate(${rotationOffset}deg)`,
              transformOrigin: 'center',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-[32px] font-bold tabular-nums leading-none"
            style={{ color }}
          >
            {count}
          </span>
          <span className="text-[11px] text-muted-foreground mt-1">/100</span>
        </div>
      </div>
      <span className="font-medium text-muted-foreground text-sm">{label}</span>
    </div>
  )
}

const scores = [
  { value: 87, label: 'SEO', color: '#10B981' },
  { value: 72, label: 'GEO', color: '#F59E0B' },
  { value: 91, label: '콘텐츠', color: '#10B981' },
  { value: 68, label: '기술 진단', color: '#F59E0B' },
]

const ScorePreview = () => (
  <section
    aria-labelledby="heading-score-preview"
    className="py-24 px-6 bg-background"
  >
    <div className="max-w-[1120px] mx-auto text-center">
      <motion.h2
        id="heading-score-preview"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl font-bold tracking-tight mb-4 text-foreground"
      >
        한눈에 보는 마케팅 건강 점수
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground mb-16"
      >
        4가지 차원으로 진단하고, 각 항목의 비즈니스 영향도를 함께 표시합니다
      </motion.p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
        {scores.map((s, i) => (
          <Gauge key={i} {...s} delay={i * 150} />
        ))}
      </div>

      <div className="inline-flex items-center gap-3 px-6 py-3 bg-findably-light border border-border rounded-full text-sm text-muted-foreground font-medium">
        <Zap className="w-4 h-4 text-findably-cyan" />각 항목별 비즈니스
        영향도(높음/중간/낮음) + 개선 우선순위가 함께 제공됩니다
      </div>
      <p className="mt-6 text-[10px] text-slate-400">
        * 위 점수는 시연용 샘플이며, 실제 진단 시 사이트별 결과가 제공됩니다
      </p>
    </div>
  </section>
)

export default ScorePreview
