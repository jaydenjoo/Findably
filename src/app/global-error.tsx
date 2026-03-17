'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps): React.JSX.Element {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ko">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div
          role="alert"
          aria-live="assertive"
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm"
        >
          <h1 className="text-xl font-bold text-slate-900">
            서버에 문제가 발생했습니다
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            다시 시도
          </button>
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error renders its own <html>, Next.js <Link> is unavailable */}
            <a
              href="/"
              className="text-sm text-slate-500 underline underline-offset-4 transition-colors hover:text-slate-700"
            >
              홈으로 돌아가기 →
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
