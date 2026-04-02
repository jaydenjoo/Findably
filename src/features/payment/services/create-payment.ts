import { createAdminClient } from '@/lib/supabase/admin'
import { PRICING } from '@/config/pricing'
import type { CreatePaymentParams, PaymentServiceResult } from '../types'

/**
 * 결제 처리 + 유료 진단 레코드 생성 (무료/유료 분리 아키텍처)
 *
 * 무료 진단(source)에서 crawl_data를 복사하여 별도의 유료 진단 레코드를 생성.
 * 무료 레코드는 그대로 유지되고, 유료 레코드는 독립적으로 AI 분석을 진행.
 * → 두 레코드가 같은 status를 수정하지 않으므로 레이스 컨디션 제거.
 *
 * RLS: admin client(service_role) 사용
 * 보안: 금액은 서버에서 PRICING.DIAGNOSIS_AMOUNT로 강제
 */
export async function createPayment(
  params: Omit<CreatePaymentParams, 'amount'>
): Promise<PaymentServiceResult> {
  const supabase = createAdminClient()

  // 1. 무료 진단 존재 + 소유권 확인
  const { data: freeDiag, error: diagError } = await supabase
    .from('diagnoses')
    .select(
      'id, user_id, tier, url, crawl_data, analysis_data, total_score, grade, target_keywords, competitor_urls, industry'
    )
    .eq('id', params.diagnosisId)
    .eq('user_id', params.userId)
    .single()

  if (diagError || !freeDiag) {
    return { success: false, error: '진단을 찾을 수 없습니다' }
  }

  // 이미 유료인 진단에서 다시 결제 방지
  if (freeDiag.tier === 'paid') {
    return { success: false, error: '이미 결제가 완료된 진단입니다' }
  }

  // 2. 새 유료 진단 레코드 생성 (무료에서 데이터 복사)
  const { data: paidDiag, error: createError } = await supabase
    .from('diagnoses')
    .insert({
      user_id: params.userId,
      url: freeDiag.url,
      status: 'analyzing',
      tier: 'paid',
      crawl_data: freeDiag.crawl_data,
      analysis_data: freeDiag.analysis_data,
      total_score: freeDiag.total_score,
      grade: freeDiag.grade,
      target_keywords: freeDiag.target_keywords,
      competitor_urls: freeDiag.competitor_urls,
      industry: freeDiag.industry,
    })
    .select('id')
    .single()

  if (createError || !paidDiag) {
    console.error('[createPayment] 유료 진단 생성 실패:', createError)
    return { success: false, error: '유료 진단 생성에 실패했습니다' }
  }

  // 3. 결제 레코드 INSERT (유료 진단에 연결)
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      user_id: params.userId,
      diagnosis_id: paidDiag.id,
      amount: PRICING.DIAGNOSIS_AMOUNT,
      status: 'paid',
      toss_order_id: params.orderId,
      toss_payment_key: `mock_${params.orderId}`,
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    console.error('[createPayment] 결제 레코드 생성 실패:', insertError)
    return { success: false, error: '결제 레코드 생성에 실패했습니다' }
  }

  console.log(
    `[createPayment] 유료 진단 생성: ${paidDiag.id} (원본: ${freeDiag.id})`
  )

  return {
    success: true,
    paymentId: payment.id,
    paidDiagnosisId: paidDiag.id,
  }
}
