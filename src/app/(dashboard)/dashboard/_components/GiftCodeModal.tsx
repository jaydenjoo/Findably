'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Loader2, X } from 'lucide-react'

interface GiftCodeModalProps {
  diagnosisId: string
  onClose: () => void
}

interface RedeemApiResponse {
  success: boolean
  data?: { diagnosisId: string; message: string }
  error?: string
}

export function GiftCodeModal({
  diagnosisId,
  onClose,
}: GiftCodeModalProps): React.JSX.Element {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(): Promise<void> {
    if (!code.trim() || isLoading) return
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/payment/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: code.trim(), diagnosisId }),
      })
      const result = (await response.json()) as RedeemApiResponse

      if (!response.ok || !result.success) {
        setError(result.error ?? '코드 적용에 실패했습니다')
        setIsLoading(false)
        return
      }

      // 성공 → 페이지 새로고침으로 유료 분석 화면 전환
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="모달 닫기"
      />

      {/* 모달 */}
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="선물 코드 입력"
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <X className="size-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center size-10 rounded-full bg-primary-50">
            <Gift className="size-5 text-primary-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">선물 코드 입력</h2>
            <p className="text-sm text-slate-500">
              코드를 입력하면 상세 분석을 받을 수 있습니다
            </p>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* 코드 입력 */}
        <div className="mb-5">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="예: FRIEND-2026"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-mono font-semibold tracking-widest text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
            disabled={isLoading}
            autoFocus
            aria-label="선물 코드"
          />
        </div>

        {/* 버튼 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!code.trim() || isLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              적용 중...
            </>
          ) : (
            '코드 적용하기 →'
          )}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          코드가 없으신가요? 정식 결제는 곧 오픈 예정입니다.
        </p>
      </div>
    </div>
  )
}
