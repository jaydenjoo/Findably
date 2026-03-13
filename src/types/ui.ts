/**
 * 공통 UI 컴포넌트 Props 타입 (OST — 여기서만 정의)
 */

/** 점수 등급 */
export type ScoreGrade = 'excellent' | 'good' | 'warning' | 'critical'

/** 스켈레톤 변형 */
export type SkeletonVariant = 'card' | 'text' | 'gauge' | 'table-row'

/** EmptyState Props */
export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: { label: string; href: string }
}

/** ErrorCard Props */
export interface ErrorCardProps {
  title?: string
  message?: string
  onRetry?: () => void
}

/** BlurOverlay Props */
export interface BlurOverlayProps {
  children: React.ReactNode
  /** 상단 노출 비율 (기본 25%) */
  visiblePercent?: number
  ctaLabel?: string
  ctaHref?: string
  sampleLabel?: string
  sampleHref?: string
}

/** ScoreGauge Props */
export interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  animated?: boolean
}

/** ScoreGauge 사이즈 설정 */
export interface GaugeSizeConfig {
  container: number
  fontSize: number
  strokeWidth: number
}
