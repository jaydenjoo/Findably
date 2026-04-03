import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/api/response'
import { runDiagnosisPaid } from '@/features/diagnosis-paid'
import { createAdminClient } from '@/lib/supabase/admin'

/** Vercel Lambda 최대 실행 시간 (초) — AI 에이전트 5개 + CMO 실행에 60초 필요 */
export const maxDuration = 60

/**
 * POST /api/payment/trigger-analysis
 *
 * 결제 완료 후 유료 분석을 실행하는 내부 API.
 * 동기 실행 — checkout의 after()에서 호출되는 별도 Lambda이므로
 * 응답을 기다리는 사용자 없음. maxDuration=60으로 전체 시간 확보.
 *
 * 중요: after() 사용 금지. Vercel Hobby에서 after()는 응답 후
 * 실행 시간이 극히 제한적(~10초)이어서 AI 에이전트가 잘림.
 *
 * 인증: 내부 시크릿 헤더 (CRAWL_EXECUTE_SECRET 재사용)
 */

const INTERNAL_SECRET = process.env.CRAWL_EXECUTE_SECRET

const triggerSchema = z.object({
  diagnosisId: z.string().uuid('diagnosisId must be a valid UUID'),
})

export async function POST(request: NextRequest): Promise<Response> {
  // 1. 내부 시크릿 검증
  if (!INTERNAL_SECRET) {
    console.error('[trigger-analysis] CRAWL_EXECUTE_SECRET 환경변수 미설정')
    return errorResponse('서버 설정 오류', 500)
  }

  const authHeader = request.headers.get('x-internal-secret')
  if (authHeader !== INTERNAL_SECRET) {
    return errorResponse('인증 실패', 401)
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

  // 3. 유료 진단 동기 실행 (after() 금지 — Vercel Hobby 제한)
  console.log('[trigger-analysis] 유료 진단 시작:', body.diagnosisId)

  const result = await runDiagnosisPaid(body.diagnosisId)

  if (!result.success) {
    console.error('[trigger-analysis] 유료 진단 실패:', result.error, {
      diagnosisId: body.diagnosisId,
      failedAgents: result.failedAgents,
    })

    // DB 상태를 'failed'로 업데이트 (analyzing 무한 대기 방지)
    try {
      const supabase = createAdminClient()
      await supabase
        .from('diagnoses')
        .update({ status: 'failed' })
        .eq('id', body.diagnosisId)
      console.log(
        '[trigger-analysis] DB 상태 failed로 업데이트:',
        body.diagnosisId
      )
    } catch (dbError) {
      console.error('[trigger-analysis] DB 상태 업데이트 실패:', dbError)
    }

    return errorResponse(result.error ?? '유료 진단 실패', 500)
  }

  console.log('[trigger-analysis] 유료 진단 완료:', body.diagnosisId)
  return successResponse({ diagnosisId: body.diagnosisId, status: 'completed' })
}
