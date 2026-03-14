import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/api/with-auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { triggerCrawl } from '@/lib/adapters/crawler'

/**
 * POST /api/crawl/trigger
 *
 * 크롤링 트리거 API Route.
 * submit-url Server Action에서 INSERT 후 호출.
 * 인증된 사용자만 자신의 pending 진단을 트리거 가능.
 */
export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user) => {
    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return errorResponse('잘못된 요청입니다', 400)
    }

    const diagnosisId =
      typeof body.diagnosisId === 'string' ? body.diagnosisId : null

    if (!diagnosisId) {
      return errorResponse('diagnosisId is required', 400)
    }

    // Atomic UPDATE: pending → crawling 상태 전환 + 소유권 검증을 단일 쿼리로
    const supabase = await createClient()
    const { data: diagnosis, error } = await supabase
      .from('diagnoses')
      .update({ status: 'crawling' })
      .eq('id', diagnosisId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select('id, url')
      .single()

    if (error || !diagnosis) {
      // 소유권 불일치, 미존재, 이미 처리됨 → 동일 응답 (정보 노출 방지)
      return errorResponse('요청을 처리할 수 없습니다', 403)
    }

    // n8n 웹훅 트리거
    const result = await triggerCrawl({
      diagnosisId: diagnosis.id,
      url: diagnosis.url,
      userId: user.id,
    })

    if (!result.success) {
      console.error('[/api/crawl/trigger]', result.error)
      return errorResponse('크롤링 서비스 연결에 실패했습니다', 502)
    }

    return successResponse({ triggered: true })
  })
}
