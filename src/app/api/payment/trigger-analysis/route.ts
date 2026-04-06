import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/api/response'
import { runDiagnosisPaid } from '@/features/diagnosis-paid'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Vercel Lambda 최대 실행 시간 (초) — Pro 플랜: 최대 300초
 *
 * 2026-04-06: 120 → 300으로 상향 (Phase 3 Fix 1).
 * 1차 실패 사례(competitors retry 중 정확히 120s hit)에서
 * 5에이전트 90s race + retry-failed-agents + CMO 30s 누적이
 * 120s를 초과하는 것이 확인됨. 시간 예산 재배분 전 임시 완화.
 */
export const maxDuration = 300

/**
 * POST /api/payment/trigger-analysis
 *
 * 유료 분석 실행 API.
 * 프론트엔드(PaidAnalyzingState)에서 직접 호출.
 * 동기 실행 — maxDuration=60으로 전체 시간 확보.
 *
 * 인증: Supabase Auth (로그인 사용자) 또는 내부 시크릿
 */

const INTERNAL_SECRET = process.env.CRAWL_EXECUTE_SECRET

const triggerSchema = z.object({
  diagnosisId: z.string().uuid('diagnosisId must be a valid UUID'),
})

export async function POST(request: NextRequest): Promise<Response> {
  // 1. 인증: 내부 시크릿 또는 사용자 세션
  const authHeader = request.headers.get('x-internal-secret')
  const isInternalCall = INTERNAL_SECRET && authHeader === INTERNAL_SECRET

  if (!isInternalCall) {
    // 프론트엔드 호출 — 사용자 인증 확인
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.error('[trigger-analysis] 인증 실패 — 사용자 세션 없음')
      return errorResponse('인증이 필요합니다', 401)
    }
    console.log('[trigger-analysis] 인증 성공:', user.id)
  }

  // 2. 페이로드 검증
  let body: z.infer<typeof triggerSchema>
  try {
    const raw = (await request.json()) as Record<string, unknown>
    body = triggerSchema.parse(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : '잘못된 요청'
    return errorResponse(message, 400)
  }

  // 3. 진단 조회 — tier + status (중복 실행 + 잘못된 tier 방지)
  const admin = createAdminClient()
  const { data: diag } = await admin
    .from('diagnoses')
    .select('status, tier')
    .eq('id', body.diagnosisId)
    .single()

  if (diag?.status === 'completed') {
    return successResponse({
      diagnosisId: body.diagnosisId,
      status: 'already_completed',
    })
  }

  // 3-1. tier 가드 — 무료 진단은 n8n 콜백(/api/crawl/complete)이 트리거하므로
  //      이 라우트로 들어오면 무시. 프론트엔드 실수/재시도로 들어와도 DB를 망치지 않음.
  if (diag?.tier !== 'paid') {
    console.warn(
      '[trigger-analysis] 무료 진단에 호출됨 — 스킵:',
      body.diagnosisId,
      { tier: diag?.tier ?? 'null' }
    )
    return successResponse({
      diagnosisId: body.diagnosisId,
      status: 'skipped_free_tier',
    })
  }

  // 4. 유료 진단 동기 실행
  console.log('[trigger-analysis] 유료 진단 시작:', body.diagnosisId)

  const result = await runDiagnosisPaid(body.diagnosisId)

  if (!result.success) {
    console.error('[trigger-analysis] 유료 진단 실패:', result.error, {
      diagnosisId: body.diagnosisId,
      failedAgents: result.failedAgents,
    })

    // DB 상태를 'failed'로 업데이트 (analyzing 무한 대기 방지)
    try {
      await admin
        .from('diagnoses')
        .update({ status: 'failed' })
        .eq('id', body.diagnosisId)
    } catch (dbError) {
      console.error('[trigger-analysis] DB 상태 업데이트 실패:', dbError)
    }

    return errorResponse(result.error ?? '유료 진단 실패', 500)
  }

  console.log('[trigger-analysis] 유료 진단 완료:', body.diagnosisId)
  return successResponse({ diagnosisId: body.diagnosisId, status: 'completed' })
}
