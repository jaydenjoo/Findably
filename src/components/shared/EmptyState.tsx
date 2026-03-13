import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EmptyStateProps } from '@/types/ui'

/**
 * 빈 상태 — 아이콘 + 제목 + 설명 + CTA
 *
 * @example
 * <EmptyState
 *   title="아직 진단 결과가 없어요"
 *   description="URL을 입력하고 무료 진단을 시작해보세요."
 *   action={{ label: '진단 시작 →', href: '/onboarding/url' }}
 * />
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
        <Icon className="size-8 text-slate-400" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>

      {action && (
        <Button size="sm" render={<Link href={action.href} />}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
