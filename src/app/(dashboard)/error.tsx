'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-xl font-semibold text-slate-900">
        문제가 발생했습니다
      </h2>
      <p className="text-sm text-slate-500">
        {error.message || '잠시 후 다시 시도해주세요.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
      >
        다시 시도
      </button>
    </div>
  )
}
