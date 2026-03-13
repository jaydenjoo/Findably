'use client'

import { ErrorCard } from '@/components/shared/ErrorCard'

export default function DiagnosisError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.JSX.Element {
  return (
    <ErrorCard
      title="진단 데이터를 불러올 수 없습니다"
      message={error.message || '잠시 후 다시 시도해주세요.'}
      onRetry={reset}
    />
  )
}
