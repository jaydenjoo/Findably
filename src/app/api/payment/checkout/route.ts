import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { createPayment } from '@/features/payment'
import { getPaymentAdapter } from '@/lib/adapters/payment'
import { PRICING } from '@/config/pricing'
import { checkRateLimit } from '@/lib/api/rate-limit'

/**
 * POST /api/payment/checkout
 *
 * 결제 처리 API (현재: Mock, 추후: Toss Payments)
 *
 * 1. Rate limit 확인
 * 2. 인증 확인
 * 3. 결제 어댑터로 승인 처리
 * 4. 결제 레코드 생성 + payment_status 업데이트
 * 5. 유료 분석 트리거 (await — 결제 완료 후이므로 실패 추적 필수)
 *
 * 보안: 🔴 결제 관련 — 금액 서버 강제, 소유권 검증
 */

const checkoutSchema = z.object({
  diagnosisId: z.string().uuid('diagnosisId must be a valid UUID'),
})

export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user) => {
    // 1. Rate limit 확인 (1분에 3회)
    const rateLimit = checkRateLimit(`payment:${user.id}`, {
      windowMs: 60_000,
      maxRequests: 3,
    })

    if (!rateLimit.allowed) {
      return errorResponse(
        `요청이 너무 빠릅니다. ${Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000)}초 후 다시 시도해주세요.`,
        429
      )
    }

    // 2. 페이로드 파싱
    let body: z.infer<typeof checkoutSchema>
    try {
      const raw = (await request.json()) as Record<string, unknown>
      body = checkoutSchema.parse(raw)
    } catch (error) {
      const message = error instanceof Error ? error.message : '잘못된 요청'
      return errorResponse(message, 400)
    }

    // 3. 결제 어댑터로 승인 처리
    const orderId = `order_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
    const adapter = getPaymentAdapter()

    const approval = await adapter.approve({
      orderId,
      amount: PRICING.DIAGNOSIS_AMOUNT,
      orderName: 'Findably 상세 마케팅 진단',
    })

    if (!approval.success) {
      return errorResponse(approval.error ?? '결제 승인에 실패했습니다', 402)
    }

    // 4. 결제 레코드 생성 + payment_status 업데이트
    const paymentResult = await createPayment({
      userId: user.id,
      diagnosisId: body.diagnosisId,
      orderId,
    })

    if (!paymentResult.success) {
      return errorResponse(
        paymentResult.error ?? '결제 처리에 실패했습니다',
        500
      )
    }

    // 5. 유료 분석 트리거 (fire-and-forget — 결제 응답 즉시 반환)
    //    createPayment에서 이미 status='analyzing'으로 설정됨
    //    분석 실패 시 status='failed'로 변경되어 대시보드에서 재시도 안내
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    const internalSecret = process.env.CRAWL_EXECUTE_SECRET
    if (baseUrl && internalSecret) {
      fetch(`${baseUrl}/api/payment/trigger-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify({ diagnosisId: body.diagnosisId }),
      }).catch((triggerError: unknown) => {
        console.error('[checkout] 유료 분석 트리거 실패:', triggerError)
      })
    } else {
      console.error('[checkout] 환경변수 미설정:', {
        siteUrl: !!baseUrl,
        secret: !!internalSecret,
      })
    }

    return successResponse({
      paymentId: paymentResult.paymentId,
      diagnosisId: body.diagnosisId,
      amount: PRICING.DIAGNOSIS_AMOUNT,
    })
  })
}
