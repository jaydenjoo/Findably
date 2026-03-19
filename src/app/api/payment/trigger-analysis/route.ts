import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/api/response'
import { runDiagnosisPaid } from '@/features/diagnosis-paid'

/**
 * POST /api/payment/trigger-analysis
 *
 * 결제 완료 후 유료 분석을 트리거하는 내부 API.
 * checkout에서 fire-and-forget으로 호출.
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

  // 3. 유료 진단 실행
  const result = await runDiagnosisPaid(body.diagnosisId)

  if (!result.success) {
    console.error('[trigger-analysis] 유료 진단 실패:', result.error, {
      failedAgents: result.failedAgents,
    })
    return errorResponse(result.error ?? '유료 진단 실행 실패', 500, {
      failedAgents: result.failedAgents,
    })
  }

  return successResponse({ diagnosisId: body.diagnosisId })
}
