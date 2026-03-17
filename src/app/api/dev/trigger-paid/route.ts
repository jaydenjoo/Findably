import { type NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { runDiagnosisPaid } from '@/features/diagnosis-paid'

/**
 * DEV ONLY — 결제 없이 유료 진단을 트리거하는 엔드포인트
 * 프로덕션에서는 404 반환
 */
export async function POST(request: NextRequest): Promise<Response> {
  // 프로덕션 차단
  if (process.env.NODE_ENV === 'production') {
    return errorResponse('Not found', 404)
  }

  return withAuth(request, async () => {
    const body = (await request.json()) as { diagnosisId?: string }

    if (!body.diagnosisId || typeof body.diagnosisId !== 'string') {
      return errorResponse('diagnosisId는 필수입니다', 400)
    }

    const result = await runDiagnosisPaid(body.diagnosisId)

    if (!result.success) {
      return errorResponse(result.error ?? '유료 진단 실행 실패', 500, {
        failedAgents: result.failedAgents,
      })
    }

    return successResponse({ diagnosisId: body.diagnosisId }, undefined, 200)
  })
}
