'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CheckoutContentProps {
  diagnosisId: string
  url: string
  amount: number
  amountLabel: string
}

interface CheckoutApiResponse {
  success: boolean
  data?: {
    paymentId: string
    diagnosisId: string
    amount: number
  }
  error?: string
}

/**
 * 결제 페이지 클라이언트 컴포넌트
 *
 * Mock 결제: 버튼 클릭 → /api/payment/checkout 호출 → 성공 시 대시보드 이동
 * 추후: Toss Payments SDK 연동 시 이 컴포넌트만 교체
 */
export function CheckoutContent({
  diagnosisId,
  url,
  amount,
  amountLabel,
}: CheckoutContentProps): React.JSX.Element {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = useCallback(async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId }),
      })

      const result = (await response.json()) as CheckoutApiResponse

      if (!response.ok || !result.success) {
        setError(result.error ?? '결제 처리에 실패했습니다. 다시 시도해주세요.')
        setIsProcessing(false)
        return
      }

      // 결제 성공 → 대시보드로 이동
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.')
      setIsProcessing(false)
    }
  }, [diagnosisId, router])

  const formattedAmount = new Intl.NumberFormat('ko-KR').format(amount)

  return (
    <div className="mx-auto max-w-lg py-10">
      <h1 className="mb-8 text-center text-2xl font-bold text-slate-900 tracking-[-0.02em]">
        상세 분석 결제
      </h1>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">
            주문 내역
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 진단 대상 URL */}
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="mb-1 text-sm text-slate-500">진단 대상</p>
            <p className="truncate text-sm font-medium text-slate-700">{url}</p>
          </div>

          {/* 상품 정보 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">상세 마케팅 진단</span>
              <span className="text-sm font-medium text-slate-900">
                {formattedAmount}원
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">
                  총 결제금액
                </span>
                <span className="font-display text-xl font-bold text-primary-600">
                  {amountLabel}
                </span>
              </div>
            </div>
          </div>

          {/* 포함 항목 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">포함 항목</p>
            <div className="flex flex-wrap gap-2">
              {[
                '5-Agent AI 분석',
                'SWOT 분석',
                '90일 로드맵',
                'AI 인용 추적',
                '경쟁사 비교 (3개사)',
                'PDF 리포트',
              ].map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="bg-primary-50 text-primary-700 text-xs"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div
              className="rounded-lg border border-danger-200 bg-danger-50 p-3"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {/* 결제 버튼 */}
          <Button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 text-base font-semibold"
            aria-label={`${amountLabel} 결제하기`}
          >
            {isProcessing ? '결제 처리 중...' : `${amountLabel} 결제하기 →`}
          </Button>

          <p className="text-center text-xs text-slate-400">
            결제 완료 후 AI 상세 분석이 자동으로 시작됩니다 (약 1분 소요)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
