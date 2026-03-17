/**
 * Payment 모듈 공개 인터페이스
 *
 * 현재: Mock 결제 (개발용)
 * 추후: Toss Payments 등 실제 결제 연동 시 서비스만 교체
 */

// 타입
export type {
  PaymentStatus,
  PaymentRecord,
  CreatePaymentParams,
  CompletePaymentParams,
  PaymentServiceResult,
} from './types'

// 서비스
export { createPayment } from './services/create-payment'
