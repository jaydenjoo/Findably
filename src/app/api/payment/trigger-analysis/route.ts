import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/api/response'
import { runDiagnosisPaid } from '@/features/diagnosis-paid'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** Vercel Lambda 최대 실행 시간 (초) — Pro 플랜: 최대 300초 */
export const maxDuration = 120

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

  // 3. 이미 완료/진행 중인지 확인 (중복 실행 방지)
  const admin = createAdminClient()
  const { data: diag } = await admin
    .from('diagnoses')
    .select('status')
    .eq('id', body.diagnosisId)
    .single()

  if (diag?.status === 'completed') {
    return successResponse({
      diagnosisId: body.diagnosisId,
      status: 'already_completed',
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
