'use client'

import { Button } from '@/components/ui/button'

interface ErrorProps {
  reset: () => void
}

export default function ActionsSchemaError({
  reset,
}: ErrorProps): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger-50">
        <span className="text-xl text-danger-500" aria-hidden="true">
          !
        </span>
      </div>
      <h1 className="text-xl font-bold text-slate-900">
        Schema 분석 정보를 불러올 수 없습니다
      </h1>
      <p className="text-sm text-slate-500">
        일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      <Button onClick={reset} aria-label="Schema 분석 다시 불러오기">
        다시 시도
      </Button>
    </div>
  )
}
