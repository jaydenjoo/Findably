import { type NextRequest } from 'next/server'
import { after } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/api/response'
import { runDiagnosisPaid } from '@/features/diagnosis-paid'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/payment/trigger-analysis
 *
 * 결제 완료 후 유료 분석을 트리거하는 내부 API.
 * after() API로 백그라운드 실행 — Vercel에서 waitUntil로 변환되어
 * Lambda 수명이 연장됨 (응답 후에도 실행 지속).
 *
 * 인증: 내부 시크릿 헤더 (CRAWL_EXECUTE_SECRET 재사용)
 * 프로덕션에서도 정상 작동 (dev 엔드포인트와 분리)
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

  // 3. 유료 진단을 백그라운드로 실행
  // after()는 응답을 먼저 보낸 뒤 실행됨 (Vercel: waitUntil로 Lambda 수명 연장)
  after(async () => {
    console.log(
      '[trigger-analysis] 유료 진단 백그라운드 시작:',
      body.diagnosisId
    )
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
    } else {
      console.log('[trigger-analysis] 유료 진단 완료:', body.diagnosisId)
    }
  })

  // 202 Accepted — 분석은 백그라운드에서 진행 중
  return successResponse(
    { diagnosisId: body.diagnosisId, status: 'accepted' },
    undefined,
    202
  )
}
