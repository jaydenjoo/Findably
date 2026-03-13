'use client'

import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ErrorCardProps } from '@/types/ui'

/**
 * 에러 표시 카드 — danger 스타일 + 재시도 버튼
 *
 * @example
 * <ErrorCard
 *   title="데이터를 불러올 수 없습니다"
 *   message={error.message}
 *   onRetry={() => reset()}
 * />
 */
export function ErrorCard({
  title = '문제가 발생했습니다',
  message = '잠시 후 다시 시도해주세요.',
  onRetry,
}: ErrorCardProps): React.JSX.Element {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-danger-50">
        <AlertCircle className="size-6 text-danger-500" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{message}</p>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="size-4" data-icon="inline-start" />
          다시 시도
        </Button>
      )}
    </div>
  )
}
