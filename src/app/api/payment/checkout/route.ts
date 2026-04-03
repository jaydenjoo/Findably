import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { createPayment } from '@/features/payment'
import { getPaymentAdapter } from '@/lib/adapters/payment'
import { PRICING } from '@/config/pricing'
import { checkRateLimit } from '@/lib/api/rate-limit'

/** Vercel Lambda 최대 실행 시간 (초) — after()의 유료 분석 트리거에 60초 필요 */
export const maxDuration = 60

/**
 * POST /api/payment/checkout
 *
 * 결제 처리 API (현재: Mock, 추후: Toss Payments)
 *
 * 1. Rate limit 확인
 * 2. 인증 확인
 * 3. 결제 어댑터로 승인 처리
 * 4. 결제 레코드 생성 + payment_status 업데이트
 * 5. 유료 분석 트리거 (after() — 결제 완료 후이므로 실패 추적 필수)
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

    // 5. 유료 분석은 프론트엔드(PaidAnalyzingState)에서 trigger-analysis를 직접 호출
    //    Vercel Hobby 서버리스에서 after()/fire-and-forget이 불안정하므로
    //    서버→서버 트리거 대신 클라이언트→서버 방식으로 변경
    const paidDiagId = paymentResult.paidDiagnosisId ?? body.diagnosisId

    return successResponse({
      paymentId: paymentResult.paymentId,
      diagnosisId: paidDiagId,
      amount: PRICING.DIAGNOSIS_AMOUNT,
    })
  })
}
