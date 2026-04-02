import { createAdminClient } from '@/lib/supabase/admin'
import { transitionStatus } from '@/lib/diagnosis/transition-status'
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

  // 3. 진단 tier → 'paid' 업데이트 + status 전이
  const { error: tierError } = await supabase
    .from('diagnoses')
    .update({ tier: 'paid' })
    .eq('id', params.diagnosisId)

  if (tierError) {
    console.error('[createPayment] tier 업데이트 실패:', tierError)
  }

  // status 전이: completed → analyzing (유료 분석 시작)
  // transitionStatus가 tier='paid' 체크하므로 안전
  const transition = await transitionStatus(params.diagnosisId, 'analyzing', {
    caller: 'createPayment',
  })

  if (!transition.success) {
    console.error('[createPayment] status 전이 실패:', transition.error)
  }

  return { success: true, paymentId: payment.id }
}
