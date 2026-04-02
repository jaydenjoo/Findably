'use client'

import { useState } from 'react'
import {
  adminUpdateStatus,
  adminRetriggerPaid,
  adminDeleteDiagnosis,
} from '../_actions/admin-actions'

interface AdminActionsProps {
  diagnosisId: string
  currentStatus: string
  tier: string
}

export function AdminActions({
  diagnosisId,
  currentStatus,
  tier,
}: AdminActionsProps): React.JSX.Element {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleAction(
    action: () => Promise<{ success: boolean; error?: string }>
  ): Promise<void> {
    setLoading(true)
    setMessage('')
    const result = await action()
    setMessage(result.success ? '완료' : `실패: ${result.error}`)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* 상태가 stuck(analyzing 5분+)이면 completed로 변경 */}
      {currentStatus === 'analyzing' && (
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handleAction(() => adminUpdateStatus(diagnosisId, 'completed'))
          }
          className="rounded bg-success-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-success-600 disabled:opacity-50 cursor-pointer"
        >
          완료처리
        </button>
      )}

      {/* 유료 재분석 트리거 */}
      {tier === 'paid' && (
        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction(() => adminRetriggerPaid(diagnosisId))}
          className="rounded bg-primary-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50 cursor-pointer"
        >
          재분석
        </button>
      )}

      {/* failed면 재시도 가능 */}
      {currentStatus === 'failed' && (
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            handleAction(() => adminUpdateStatus(diagnosisId, 'analyzing'))
          }
          className="rounded bg-warning-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-warning-600 disabled:opacity-50 cursor-pointer"
        >
          재시도
        </button>
      )}

      {/* 삭제 */}
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          if (confirm('이 진단을 삭제할까요?')) {
            void handleAction(() => adminDeleteDiagnosis(diagnosisId))
          }
        }}
        className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-300 disabled:opacity-50 cursor-pointer"
      >
        삭제
      </button>

      {message && (
        <span
          className={`text-xs ${message === '완료' ? 'text-success-600' : 'text-danger-600'}`}
        >
          {message}
        </span>
      )}
    </div>
  )
}
