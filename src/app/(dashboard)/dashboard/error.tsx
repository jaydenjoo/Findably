'use client'

import { ErrorCard } from '@/components/shared/ErrorCard'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps): React.JSX.Element {
  return (
    <ErrorCard
      title="대시보드를 불러올 수 없습니다"
      message={
        error.digest
          ? '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
          : '잠시 후 다시 시도해주세요.'
      }
      onRetry={reset}
    />
  )
}
