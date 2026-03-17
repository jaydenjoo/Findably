'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CheckoutError({
  error,
  reset,
}: ErrorProps): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg py-10">
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50">
            <span className="text-2xl" role="img" aria-label="에러">
              !
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            결제 페이지를 불러올 수 없습니다
          </h2>
          <p className="text-center text-sm text-slate-500">
            {error.message || '잠시 후 다시 시도해주세요.'}
          </p>
          <Button
            onClick={reset}
            variant="outline"
            className="mt-2"
            aria-label="결제 페이지 다시 불러오기"
          >
            다시 시도 →
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
