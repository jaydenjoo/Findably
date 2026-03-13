'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <Card>
      <CardHeader>
        <CardTitle className="text-center">문제가 발생했습니다</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <Button onClick={reset} className="w-full">
          다시 시도 →
        </Button>
      </CardContent>
    </Card>
  )
}
