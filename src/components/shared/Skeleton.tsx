import type { SkeletonVariant } from '@/types/ui'
import { cn } from '@/lib/utils'

const BASE = 'animate-pulse rounded-lg bg-slate-200'

function SkeletonCard({
  className,
}: {
  className?: string
}): React.JSX.Element {
  return <div className={cn(BASE, 'h-[200px] w-full', className)} />
}

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(BASE, 'h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

function SkeletonGauge({
  className,
}: {
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn(BASE, 'mx-auto size-[120px] rounded-full', className)} />
  )
}

function SkeletonTableRow({
  cols = 4,
  className,
}: {
  cols?: number
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('flex gap-4', className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className={cn(BASE, 'h-8 flex-1')} />
      ))}
    </div>
  )
}

const VARIANT_MAP: Record<
  SkeletonVariant,
  React.ComponentType<Record<string, unknown>>
> = {
  card: SkeletonCard,
  text: SkeletonText,
  gauge: SkeletonGauge,
  'table-row': SkeletonTableRow,
}

/**
 * 재사용 스켈레톤 — variant로 형태 선택
 *
 * @example
 * <Skeleton variant="card" />
 * <Skeleton variant="text" lines={4} />
 * <Skeleton variant="gauge" />
 * <Skeleton variant="table-row" cols={5} />
 */
export function Skeleton({
  variant = 'text',
  className,
  ...rest
}: {
  variant?: SkeletonVariant
  className?: string
  lines?: number
  cols?: number
}): React.JSX.Element {
  const Component = VARIANT_MAP[variant]
  return (
    <div aria-busy="true" aria-label="로딩 중" role="status">
      <Component className={className} {...rest} />
    </div>
  )
}
