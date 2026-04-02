'use client'

import { useEffect, useRef, useState } from 'react'
import { retryPaidAnalysis } from '@/features/diagnosis-paid/actions/retry-analysis'
import { PaidAnalyzingState } from './PaidAnalyzingState'

interface PaidRecoveryStateProps {
  diagnosisId: string
}

/**
 * 유료 결제 완료 후 AI 분석 데이터가 누락된 경우 자동 복구
 *
 * 1. 마운트 시 retryPaidAnalysis 자동 호출
 * 2. 성공하면 PaidAnalyzingState로 전환 (폴링 + 프로그레스)
 * 3. 실패하면 에러 메시지 + 수동 재시도 버튼
 */
export function PaidRecoveryState({
  diagnosisId,
}: PaidRecoveryStateProps): React.JSX.Element {
  const [status, setStatus] = useState<'triggering' | 'analyzing' | 'error'>(
    'triggering'
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    if (triggered.current) return
    triggered.current = true

    async function triggerRecovery(): Promise<void> {
      const result = await retryPaidAnalysis(diagnosisId)
      if (result.success) {
        setStatus('analyzing')
      } else {
        setErrorMsg(result.error ?? '재분석 시작에 실패했습니다.')
        setStatus('error')
      }
    }

    void triggerRecovery()
  }, [diagnosisId])

  if (status === 'analyzing') {
    return <PaidAnalyzingState diagnosisId={diagnosisId} isPaid />
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-6 text-center max-w-md">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            상세 분석 재시도에 실패했습니다
          </h2>
          <p className="text-sm text-slate-600 mb-4">{errorMsg}</p>
          <button
            type="button"
            onClick={() => {
              setStatus('triggering')
              triggered.current = false
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 cursor-pointer"
          >
            다시 시도 →
          </button>
        </div>
      </div>
    )
  }

  // triggering 상태
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="rounded-lg border border-primary-200 bg-primary-50 p-6 text-center max-w-md">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          상세 분석을 자동으로 시작합니다
        </h2>
        <p className="text-sm text-slate-500">
          결제는 정상 처리되었으나 상세 분석 데이터가 누락되어 자동으로 재분석을
          진행합니다. 잠시만 기다려주세요.
        </p>
      </div>
    </div>
  )
}
