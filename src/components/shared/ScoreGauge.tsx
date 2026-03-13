'use client'

import { useEffect, useRef, useState } from 'react'
import { SCORING } from '@/config/scoring'
import type { GaugeSizeConfig, ScoreGaugeProps } from '@/types/ui'

/** 사이즈별 설정 */
const SIZE_CONFIG: Record<
  NonNullable<ScoreGaugeProps['size']>,
  GaugeSizeConfig
> = {
  sm: { container: 80, fontSize: 20, strokeWidth: 6 },
  md: { container: 120, fontSize: 32, strokeWidth: 8 },
  lg: { container: 160, fontSize: 40, strokeWidth: 10 },
  xl: { container: 200, fontSize: 56, strokeWidth: 12 },
}

/** easeOutCubic */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/**
 * SVG 원형 게이지 + 카운트업 애니메이션
 *
 * @example
 * <ScoreGauge score={72} size="lg" />
 * <ScoreGauge score={35} size="sm" showLabel={false} />
 */
export function ScoreGauge({
  score,
  size = 'md',
  showLabel = true,
  animated = true,
}: ScoreGaugeProps): React.JSX.Element {
  const clampedScore = Math.max(0, Math.min(100, score))
  const config = SIZE_CONFIG[size]
  const radius = (config.container - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = config.container / 2

  const [displayScore, setDisplayScore] = useState(animated ? 0 : clampedScore)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (!animated || reducedMotion) {
      // rAF 콜백 내에서 setState → lint 규칙 충족
      rafRef.current = requestAnimationFrame(() => {
        setDisplayScore(clampedScore)
      })
      return () => cancelAnimationFrame(rafRef.current)
    }

    const duration = 1500
    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      setDisplayScore(Math.round(easedProgress * clampedScore))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [clampedScore, animated])

  const offset = circumference * (1 - displayScore / 100)
  const colors = SCORING.getScoreColor(clampedScore)
  const label = SCORING.getScoreLabel(clampedScore)

  return (
    <div
      role="meter"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`종합 마케팅 점수 ${clampedScore}점, ${label} 등급`}
      className="relative inline-flex items-center justify-center"
      style={{ width: config.container, height: config.container }}
    >
      <svg
        width={config.container}
        height={config.container}
        className="-rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-slate-200"
          strokeWidth={config.strokeWidth}
        />
        {/* 점수 원 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={colors.stroke}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: animated ? 'none' : 'stroke-dashoffset 0.3s ease',
          }}
        />
      </svg>

      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-display font-extrabold tabular-nums ${colors.text}`}
          style={{ fontSize: config.fontSize }}
        >
          {displayScore}
        </span>
        {showLabel && (
          <span className={`text-xs font-semibold ${colors.text}`}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
