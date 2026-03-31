'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { retryPaidAnalysis } from '@/features/diagnosis-paid/actions/retry-analysis'

interface AnalysisTimeoutStateProps {
  diagnosisId: string
  isPaid: boolean
}

/**
 * 분석 타임아웃 화면
 *
 * 유료 진단: "재분석 시작" 버튼 → retryPaidAnalysis 호출 → PaidAnalyzingState로 전환
 * 무료 진단: 새로고침 + URL 재입력 안내
 */
export function AnalysisTimeoutState({
  diagnosisId,
  isPaid,
}: AnalysisTimeoutStateProps): React.JSX.Element {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRetry = useCallback(async () => {
    if (isRetrying) return
    setIsRetrying(true)
    setError(null)

    const result = await retryPaidAnalysis(diagnosisId)

    if (!result.success) {
      setError(result.error ?? '재시도에 실패했습니다.')
      setIsRetrying(false)
      return
    }

    // 성공 → 페이지 새로고침으로 PaidAnalyzingState 표시
    router.refresh()
  }, [diagnosisId, isRetrying, router])

  return (
    <div className="mx-auto max-w-lg py-10">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-warning-50">
          <AlertCircle className="size-6 text-warning-600" />
        </div>

        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          분석이 예상보다 오래 걸리고 있습니다
        </h2>

        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          분석 중 일시적 문제가 발생한 것 같습니다.
          {isPaid
            ? ' 아래 버튼을 눌러 분석을 다시 시작할 수 있습니다.'
            : ' 새로고침을 시도해주세요.'}
        </p>

        {error && (
          <div
            className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          {isPaid && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRetrying ? (
                <>
                  <RotateCcw className="size-4 animate-spin" />
                  재분석 시작 중...
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  재분석 시작
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => router.refresh()}
            className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            새로고침 →
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          문제가 계속되면 support@findably.co.kr로 문의해주세요.
        </p>
      </div>
    </div>
  )
}
