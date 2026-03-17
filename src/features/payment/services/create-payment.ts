import { createAdminClient } from '@/lib/supabase/admin'
import { PRICING } from '@/config/pricing'
import type { CreatePaymentParams, PaymentServiceResult } from '../types'

/**
 * 결제 레코드 생성 + 진단 payment_status 업데이트
 *
 * RLS: payments 테이블에 INSERT 정책이 없으므로 admin client(service_role) 사용
 * 보안: 금액은 서버에서 PRICING.DIAGNOSIS_AMOUNT로 강제 (클라이언트 금액 무시)
 */
export async function createPayment(
  params: Omit<CreatePaymentParams, 'amount'>
): Promise<PaymentServiceResult> {
  const supabase = createAdminClient()

  // 1. 진단 존재 + 소유권 확인
  const { data: diagnosis, error: diagError } = await supabase
    .from('diagnoses')
    .select('id, user_id, tier')
    .eq('id', params.diagnosisId)
    .eq('user_id', params.userId)
    .single()

  if (diagError || !diagnosis) {
    return { success: false, error: '진단을 찾을 수 없습니다' }
  }

  // 이미 결제 완료된 진단
  if (diagnosis.tier === 'paid') {
    return { success: false, error: '이미 결제가 완료된 진단입니다' }
  }

  // 2. 결제 레코드 INSERT (금액은 서버에서 강제)
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      user_id: params.userId,
      diagnosis_id: params.diagnosisId,
      amount: PRICING.DIAGNOSIS_AMOUNT,
      status: 'paid',
      toss_order_id: params.orderId,
      toss_payment_key: `mock_${params.orderId}`,
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    console.error('[createPayment] INSERT 실패:', insertError)
    return { success: false, error: '결제 레코드 생성에 실패했습니다' }
  }

  // 3. 진단 tier → 'paid' + status → 'analyzing' 업데이트
  //    결제 완료 즉시 분석 대기 상태로 전환 → 대시보드에서 "분석 진행 중" 표시
  const { error: updateError } = await supabase
    .from('diagnoses')
    .update({ tier: 'paid', status: 'analyzing' })
    .eq('id', params.diagnosisId)

  if (updateError) {
    console.error('[createPayment] payment_status 업데이트 실패:', updateError)
    // 결제 레코드는 이미 생성됨 — 롤백하지 않고 로그만
  }

  return { success: true, paymentId: payment.id }
}
