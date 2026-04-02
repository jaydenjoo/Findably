'use server'

import { createClient } from '@/lib/supabase/server'
import { transitionStatus } from '@/lib/diagnosis/transition-status'

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

  // 유료 레코드: analyzing 또는 failed만 재시도 가능
  // (무료/유료 분리 아키텍처: completed→analyzing 전이 불필요)
  const retryableStatuses = ['analyzing', 'failed']
  if (!retryableStatuses.includes(diagnosis.status)) {
    return { success: false, error: '재시도할 수 없는 상태입니다.' }
  }

  // 3. status를 analyzing으로 리셋 (failed → analyzing)
  const transition = await transitionStatus(diagnosisId, 'analyzing', {
    caller: 'retryPaidAnalysis',
  })

  if (!transition.success) {
    console.error('[retryPaidAnalysis] 전이 실패:', transition.error)
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
