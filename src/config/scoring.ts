import type { ScoreGrade } from '@/types/ui'
import type { RuleSeverity } from '@/features/diagnosis-free/types'

/**
 * 점수 등급 기준
 * 80+ excellent, 60+ good, 40+ warning, 0+ critical
 */
const GRADE_THRESHOLDS: readonly { min: number; grade: ScoreGrade }[] = [
  { min: 80, grade: 'excellent' },
  { min: 60, grade: 'good' },
  { min: 40, grade: 'warning' },
  { min: 0, grade: 'critical' },
] as const

/** 등급 한국어 라벨 */
const GRADE_LABELS: Record<ScoreGrade, string> = {
  excellent: '양호',
  good: '보통',
  warning: '주의',
  critical: '심각',
} as const

/** 등급별 Tailwind 클래스 */
const GRADE_COLORS: Record<
  ScoreGrade,
  { text: string; bg: string; stroke: string; border: string; bar: string }
> = {
  excellent: {
    text: 'text-success-600',
    bg: 'bg-success-50',
    stroke: 'stroke-success-500',
    border: 'border-success-500',
    bar: 'bg-success-500',
  },
  good: {
    text: 'text-primary-600',
    bg: 'bg-primary-50',
    stroke: 'stroke-primary-500',
    border: 'border-primary-500',
    bar: 'bg-primary-500',
  },
  warning: {
    text: 'text-warning-600',
    bg: 'bg-warning-50',
    stroke: 'stroke-warning-500',
    border: 'border-warning-500',
    bar: 'bg-warning-500',
  },
  critical: {
    text: 'text-danger-600',
    bg: 'bg-danger-50',
    stroke: 'stroke-danger-500',
    border: 'border-danger-500',
    bar: 'bg-danger-500',
  },
} as const

/** 점수 → 등급 */
function getScoreGrade(score: number): ScoreGrade {
  const clamped = Math.max(0, Math.min(100, score))
  const found = GRADE_THRESHOLDS.find((t) => clamped >= t.min)
  return found?.grade ?? 'critical'
}

/** 점수 → 색상 객체 */
function getScoreColor(score: number): {
  text: string
  bg: string
  stroke: string
  border: string
  bar: string
} {
  return GRADE_COLORS[getScoreGrade(score)]
}

/** 점수 → 한국어 라벨 */
function getScoreLabel(score: number): string {
  return GRADE_LABELS[getScoreGrade(score)]
}

/** 심각도 → 뱃지 스타일 */
const SEVERITY_STYLES: Record<
  RuleSeverity,
  { bg: string; text: string; label: string }
> = {
  critical: { bg: 'bg-danger-50', text: 'text-danger-600', label: '심각' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-600', label: '주의' },
  info: { bg: 'bg-primary-50', text: 'text-primary-600', label: '참고' },
} as const

/** 심각도 → impact 바 색상 */
const SEVERITY_BAR_COLORS: Record<RuleSeverity, string> = {
  critical: 'bg-danger-500',
  warning: 'bg-warning-500',
  info: 'bg-primary-500',
} as const

export const SCORING = {
  GRADE_THRESHOLDS,
  GRADE_LABELS,
  GRADE_COLORS,
  SEVERITY_STYLES,
  SEVERITY_BAR_COLORS,
  getScoreGrade,
  getScoreColor,
  getScoreLabel,
} as const
