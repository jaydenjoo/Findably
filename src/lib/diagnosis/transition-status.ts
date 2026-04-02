import { createAdminClient } from '@/lib/supabase/admin'

/**
 * 진단 상태 전이 관리자 — 모든 status 변경은 이 함수를 거친다
 *
 * 허용된 전이만 실행하고, 위반 시 에러 로그 + 차단.
 * 레이스 컨디션 방지: DB에서 현재 상태를 읽고 → 전이 규칙 검증 → 업데이트
 */

export type DiagnosisStatus =
  | 'pending'
  | 'crawling'
  | 'analyzing'
  | 'completed'
  | 'failed'

/** 허용된 상태 전이 맵 — from → to[] */
const VALID_TRANSITIONS: Record<DiagnosisStatus, DiagnosisStatus[]> = {
  pending: ['crawling', 'analyzing', 'failed'],
  crawling: ['analyzing', 'failed'],
  analyzing: ['completed', 'failed'],
  completed: ['analyzing'], // 유료 결제 시에만 (tier 체크 필수)
  failed: ['analyzing'], // 재시도 시에만
}

/** completed → analyzing 전이는 tier='paid'일 때만 허용 */
const PAID_ONLY_TRANSITIONS: Array<{
  from: DiagnosisStatus
  to: DiagnosisStatus
}> = [{ from: 'completed', to: 'analyzing' }]

interface TransitionOptions {
  /** 호출자 식별 (로그용) */
  caller: string
  /** 관리자 강제 전이 (규칙 우회) */
  force?: boolean
}

interface TransitionResult {
  success: boolean
  error?: string
  /** 전이 전 상태 */
  previousStatus?: DiagnosisStatus
}

/**
 * 진단 상태를 안전하게 전이한다.
 *
 * @param diagnosisId - 진단 ID
 * @param targetStatus - 목표 상태
 * @param options - 호출자 정보 + 강제 옵션
 * @returns 성공 여부 + 에러 메시지
 *
 * @example
 * // 크롤링 완료 → analyzing
 * await transitionStatus(id, 'analyzing', { caller: 'saveCrawlResult' })
 *
 * // 관리자 강제 변경
 * await transitionStatus(id, 'completed', { caller: 'admin', force: true })
 */
export async function transitionStatus(
  diagnosisId: string,
  targetStatus: DiagnosisStatus,
  options: TransitionOptions
): Promise<TransitionResult> {
  const { caller, force = false } = options
  const supabase = createAdminClient()

  // 1. 현재 상태 + tier 조회
  const { data: current, error: fetchError } = await supabase
    .from('diagnoses')
    .select('status, tier')
    .eq('id', diagnosisId)
    .single()

  if (fetchError || !current) {
    const msg = `[transitionStatus] 진단 조회 실패 (${caller}): ${fetchError?.message ?? 'not found'}`
    console.error(msg)
    return { success: false, error: msg }
  }

  const currentStatus = current.status as DiagnosisStatus
  const tier = current.tier as string

  // 2. 동일 상태 → 무시 (멱등성)
  if (currentStatus === targetStatus) {
    console.log(
      `[transitionStatus] ${caller}: ${diagnosisId.slice(0, 8)} — ${currentStatus} → ${targetStatus} (동일, 스킵)`
    )
    return { success: true, previousStatus: currentStatus }
  }

  // 3. 전이 규칙 검증 (force면 우회)
  if (!force) {
    const allowedTargets = VALID_TRANSITIONS[currentStatus]
    if (!allowedTargets?.includes(targetStatus)) {
      const msg = `[transitionStatus] 차단 (${caller}): ${currentStatus} → ${targetStatus} 는 허용되지 않는 전이`
      console.error(msg, { diagnosisId: diagnosisId.slice(0, 8), tier })
      return { success: false, error: msg, previousStatus: currentStatus }
    }

    // paid-only 전이 체크
    const isPaidOnly = PAID_ONLY_TRANSITIONS.some(
      (t) => t.from === currentStatus && t.to === targetStatus
    )
    if (isPaidOnly && tier !== 'paid') {
      const msg = `[transitionStatus] 차단 (${caller}): ${currentStatus} → ${targetStatus} 는 paid 전용 전이 (현재 tier=${tier})`
      console.error(msg, { diagnosisId: diagnosisId.slice(0, 8) })
      return { success: false, error: msg, previousStatus: currentStatus }
    }
  }

  // 4. 업데이트 실행
  const updatePayload: Record<string, unknown> = {
    status: targetStatus,
    updated_at: new Date().toISOString(),
  }

  if (targetStatus === 'completed') {
    updatePayload.completed_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('diagnoses')
    .update(updatePayload)
    .eq('id', diagnosisId)

  if (updateError) {
    const msg = `[transitionStatus] DB 업데이트 실패 (${caller}): ${updateError.message}`
    console.error(msg)
    return { success: false, error: msg, previousStatus: currentStatus }
  }

  console.log(
    `[transitionStatus] ${caller}: ${diagnosisId.slice(0, 8)} — ${currentStatus} → ${targetStatus} ✓`
  )

  return { success: true, previousStatus: currentStatus }
}
