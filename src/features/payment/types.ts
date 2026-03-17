/**
 * 결제 모듈 타입 정의
 */

/** 결제 상태 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

/** DB payments 레코드 */
export interface PaymentRecord {
  id: string
  userId: string
  diagnosisId: string
  amount: number
  status: PaymentStatus
  paymentKey: string | null
  orderId: string
  paidAt: string | null
  createdAt: string
}

/** 결제 생성 파라미터 */
export interface CreatePaymentParams {
  userId: string
  diagnosisId: string
  amount: number
  orderId: string
}

/** 결제 완료 업데이트 파라미터 */
export interface CompletePaymentParams {
  orderId: string
  paymentKey: string
  paidAt: string
}

/** 결제 서비스 결과 */
export interface PaymentServiceResult {
  success: boolean
  paymentId?: string
  error?: string
}
