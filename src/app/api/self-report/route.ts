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
  ruleId: z.string().min(1).max(100),
})

const RECRAWL_DELAY_MS = 7 * 24 * 60 * 60 * 1000

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

    // 2. diagnosis 소유권 검증 (RLS가 보장하지만 명시적으로 확인)
    const { data: diagnosis, error: diagError } = await supabase
      .from('diagnoses')
      .select('id, user_id')
      .eq('id', body.diagnosisId)
      .maybeSingle()

    if (diagError || !diagnosis || diagnosis.user_id !== user.id) {
      return errorResponse('진단을 찾을 수 없습니다', 404)
    }

    // 3. 리크롤 예약 시각 계산 (DST 무관하게 정확히 7일 후)
    const recrawlAt = new Date(Date.now() + RECRAWL_DELAY_MS)

    // 4. INSERT (UNIQUE 위반 시 중복 제출로 처리)
    const { error: insertError } = await supabase.from('self_reports').insert({
      user_id: user.id,
      diagnosis_id: body.diagnosisId,
      rule_id: body.ruleId,
      recrawl_scheduled_at: recrawlAt.toISOString(),
    })

    if (insertError) {
      // Postgres 23505 = unique_violation
      if (insertError.code === '23505') {
        return successResponse({ alreadyReported: true })
      }
      console.error('[self-report] INSERT 실패:', insertError.message)
      return errorResponse('요청 처리에 실패했습니다', 500)
    }

    // 5. 이벤트 기록 (실패해도 계속 진행)
    await trackEvent({
      userId: user.id,
      event: 'self_report_submitted',
      properties: {
        diagnosisId: body.diagnosisId,
        ruleId: body.ruleId,
      },
    })

    return successResponse({
      alreadyReported: false,
      recrawlScheduledAt: recrawlAt.toISOString(),
    })
  })
}
