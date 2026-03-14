'use client'

import { ErrorCard } from '@/components/shared/ErrorCard'

/**
 * Auth 라우트 그룹 공용 에러 화면
 *
 * /login, /signup 등에서 예상치 못한 에러 발생 시 표시
 * error.tsx는 React Error Boundary — 'use client' 필수
 */
export default function AuthError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.JSX.Element {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <ErrorCard
        title="페이지를 불러올 수 없습니다"
        message="잠시 후 다시 시도해주세요."
        onRetry={reset}
      />
    </div>
  )
}
