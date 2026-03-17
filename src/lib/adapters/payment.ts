/**
 * 결제 어댑터 — 결제 대행사 교체 가능 구조
 *
 * 현재: MockPaymentAdapter (개발용)
 * 추후: TossPaymentAdapter, StripePaymentAdapter 등으로 교체
 */

/** 결제 요청 파라미터 */
export interface PaymentRequestParams {
  orderId: string
  amount: number
  orderName: string
  customerName?: string
  customerEmail?: string
}

/** 결제 승인 결과 */
export interface PaymentApprovalResult {
  success: boolean
  paymentKey: string | null
  orderId: string
  amount: number
  paidAt: string | null
  error?: string
}

/** 결제 어댑터 인터페이스 */
export interface PaymentAdapter {
  /** 결제 승인 처리 */
  approve(params: PaymentRequestParams): Promise<PaymentApprovalResult>
  /** 결제 취소 */
  cancel(
    paymentKey: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }>
}

/**
 * Mock 결제 어댑터 — 개발/테스트용
 * 항상 즉시 성공 반환
 */
class MockPaymentAdapter implements PaymentAdapter {
  async approve(params: PaymentRequestParams): Promise<PaymentApprovalResult> {
    // 실제 결제 없이 즉시 성공
    return {
      success: true,
      paymentKey: `mock_pay_${crypto.randomUUID().slice(0, 8)}`,
      orderId: params.orderId,
      amount: params.amount,
      paidAt: new Date().toISOString(),
    }
  }

  async cancel(
    _paymentKey: string,
    _reason: string
  ): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  }
}

/**
 * 결제 어댑터 팩토리
 * 환경변수로 결제 대행사 선택 (기본: mock)
 */
export function getPaymentAdapter(): PaymentAdapter {
  const provider = process.env.PAYMENT_PROVIDER ?? 'mock'

  switch (provider) {
    case 'mock':
      return new MockPaymentAdapter()
    // case 'toss':
    //   return new TossPaymentAdapter()
    default:
      return new MockPaymentAdapter()
  }
}
