'use client'

import { ErrorCard } from '@/components/shared/ErrorCard'

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.JSX.Element {
  return (
    <ErrorCard
      title="문제가 발생했습니다"
      message={error.message || '잠시 후 다시 시도해주세요.'}
      onRetry={reset}
    />
  )
}
