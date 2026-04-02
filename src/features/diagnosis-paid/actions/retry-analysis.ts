'use server'

import { createClient } from '@/lib/supabase/server'

interface RetryResult {
  success: boolean
  error?: string
}

/**
 * 유료 분석 재시도 Server Action
 *
 * 타임아웃된 유료 진단을 재트리거한다.
 * 1. 인증 + 소유권 확인
 * 2. paid tier + analyzing/failed 상태 확인
 * 3. DB 상태 리셋 (analyzing + updated_at 갱신)
 * 4. trigger-analysis API 호출
 */
export async function retryPaidAnalysis(
  diagnosisId: string
): Promise<RetryResult> {
  const supabase = await createClient()

  // 1. 인증
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: '로그인이 필요합니다.' }
  }

  // 2. 소유권 + 상태 확인
  const { data: diagnosis, error: fetchError } = await supabase
    .from('diagnoses')
    .select('id, status, tier')
    .eq('id', diagnosisId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !diagnosis) {
    return { success: false, error: '진단 정보를 찾을 수 없습니다.' }
  }

  if (diagnosis.tier !== 'paid') {
    return { success: false, error: '유료 진단만 재시도할 수 있습니다.' }
  }

  // analyzing, failed: 일반 재시도
  // completed: 유료 데이터 누락 시 자동 복구 (레이스 컨디션 대응)
  const retryableStatuses = ['analyzing', 'failed', 'completed']
  if (!retryableStatuses.includes(diagnosis.status)) {
    return { success: false, error: '재시도할 수 없는 상태입니다.' }
  }

  // 3. DB 상태 리셋
  const { error: updateError } = await supabase
    .from('diagnoses')
    .update({ status: 'analyzing', updated_at: new Date().toISOString() })
    .eq('id', diagnosisId)

  if (updateError) {
    console.error('[retryPaidAnalysis] DB 업데이트 실패:', updateError)
    return { success: false, error: '상태 업데이트에 실패했습니다.' }
  }

  // 4. 분석 재트리거
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  const internalSecret = process.env.CRAWL_EXECUTE_SECRET

  if (!baseUrl || !internalSecret) {
    console.error('[retryPaidAnalysis] 환경변수 미설정')
    return { success: false, error: '서버 설정 오류입니다.' }
  }

  try {
    await fetch(`${baseUrl}/api/payment/trigger-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify({ diagnosisId }),
    })
  } catch (triggerError) {
    console.error('[retryPaidAnalysis] 트리거 실패:', triggerError)
    return { success: false, error: '분석 시작에 실패했습니다.' }
  }

  return { success: true }
}
