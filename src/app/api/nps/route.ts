/** Vercel Lambda 최대 실행 시간 (초) — trackEvent INSERT 포함 */
export const maxDuration = 60

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/analytics/events'

const bodySchema = z.object({
  diagnosisId: z.string().uuid('diagnosisId must be a valid UUID'),
  score: z.number().int().min(0).max(10),
  comment: z.string().max(500).optional(),
})

export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user) => {
    // 1. 페이로드 검증
    let body: z.infer<typeof bodySchema>
    try {
      const raw = (await request.json()) as Record<string, unknown>
      body = bodySchema.parse(raw)
    } catch {
      return errorResponse('잘못된 요청입니다', 400)
    }

    const supabase = await createClient()

    // 2. diagnosis 소유권 + 상태 검증 (완료된 진단만)
    const { data: diagnosis, error: diagError } = await supabase
      .from('diagnoses')
      .select('id, user_id, status')
      .eq('id', body.diagnosisId)
      .maybeSingle()

    if (diagError || !diagnosis || diagnosis.user_id !== user.id) {
      return errorResponse('진단을 찾을 수 없습니다', 404)
    }

    if (diagnosis.status !== 'completed') {
      return errorResponse('완료된 진단에만 의견을 남길 수 있습니다', 400)
    }

    // 3. INSERT (중복 제출은 사용자에게 숨김 — 성공 반환)
    const { error: insertError } = await supabase.from('nps_responses').insert({
      user_id: user.id,
      diagnosis_id: body.diagnosisId,
      score: body.score,
      comment: body.comment ?? null,
    })

    if (insertError) {
      // Postgres 23505 = unique_violation → 중복 숨김
      if (insertError.code === '23505') {
        return successResponse({ submitted: true })
      }
      console.error('[nps] INSERT 실패:', insertError.message)
      return errorResponse('요청 처리에 실패했습니다', 500)
    }

    // 4. 이벤트 기록
    await trackEvent({
      userId: user.id,
      event: 'nps_submitted',
      properties: {
        diagnosisId: body.diagnosisId,
        score: body.score,
      },
    })

    return successResponse({ submitted: true })
  })
}
