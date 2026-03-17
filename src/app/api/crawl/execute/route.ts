import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/api/response'
import { buildFallbackCrawlData } from '@/features/crawling/services/fallback-crawl'
import {
  saveCrawlResult,
  markDiagnosisFailed,
} from '@/features/crawling/services/save-crawl-result'
import { runDiagnosis } from '@/features/diagnosis-free/services/run-diagnosis'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/crawl/execute
 *
 * n8n 없이 직접 크롤링+진단을 실행하는 내부 API.
 * Layer 2(Google API) + Layer 3(오픈소스)만 실행 (~60% 데이터).
 *
 * 인증: 내부 시크릿 헤더 (서버 간 통신)
 * 호출자: submitUrlAction (fire-and-forget)
 */

const INTERNAL_SECRET = process.env.CRAWL_EXECUTE_SECRET

const executePayloadSchema = z.object({
  diagnosisId: z.string().uuid('diagnosisId must be a valid UUID'),
  url: z.string().url('url must be a valid URL'),
})

export async function POST(request: NextRequest): Promise<Response> {
  // 1. 내부 시크릿 검증
  if (!INTERNAL_SECRET) {
    console.error('[execute] CRAWL_EXECUTE_SECRET 환경변수 미설정')
    return errorResponse('서버 설정 오류', 500)
  }

  const authHeader = request.headers.get('x-internal-secret')
  if (authHeader !== INTERNAL_SECRET) {
    return errorResponse('인증 실패', 401)
  }

  // 2. 페이로드 파싱
  let payload: z.infer<typeof executePayloadSchema>
  try {
    const body = (await request.json()) as Record<string, unknown>
    payload = executePayloadSchema.parse(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : '잘못된 요청'
    return errorResponse(message, 400)
  }

  // 3. 진단 소유권 확인 (존재하는 진단인지)
  const supabase = createAdminClient()
  const { data: diagnosis, error: dbError } = await supabase
    .from('diagnoses')
    .select('id, status')
    .eq('id', payload.diagnosisId)
    .single()

  if (dbError || !diagnosis) {
    return errorResponse('진단을 찾을 수 없습니다', 404)
  }

  // 이미 완료/분석 중이면 중복 실행 방지
  if (diagnosis.status === 'completed' || diagnosis.status === 'analyzing') {
    return successResponse({
      skipped: true,
      reason: `이미 ${diagnosis.status} 상태입니다`,
    })
  }

  // 4. status → crawling 전환
  await supabase
    .from('diagnoses')
    .update({ status: 'crawling' })
    .eq('id', payload.diagnosisId)

  // 5. Layer 2+3 크롤링 실행
  try {
    const crawlData = await buildFallbackCrawlData({
      url: payload.url,
      blockedReason: 'Layer 2+3 only — Layer 1(Playwright) 미설정',
    })

    // 6. 크롤링 결과 저장
    const saveResult = await saveCrawlResult({
      diagnosisId: payload.diagnosisId,
      crawlData,
    })

    if (!saveResult.success) {
      console.error('[execute] 저장 실패:', saveResult.error)
      await markDiagnosisFailed(
        payload.diagnosisId,
        saveResult.error ?? '크롤링 결과 저장 실패'
      )
      return errorResponse('크롤링 결과 저장에 실패했습니다', 500)
    }

    // 7. 진단 엔진 실행 (67개 룰 + AI 인용 점수)
    const diagnosisResult = await runDiagnosis({
      diagnosisId: payload.diagnosisId,
      crawlData,
    })

    if (!diagnosisResult.success) {
      console.error('[execute] 진단 실패:', diagnosisResult.error)
      await markDiagnosisFailed(
        payload.diagnosisId,
        diagnosisResult.error ?? '진단 엔진 실행 실패'
      )
      return errorResponse('진단 처리에 실패했습니다', 500)
    }

    return successResponse({
      saved: true,
      diagnosed: true,
      duration_ms: crawlData.duration_ms,
      is_partial: crawlData.is_partial,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[execute] 처리 중 예외:', message)
    await markDiagnosisFailed(payload.diagnosisId, message)
    return errorResponse('크롤링 처리 중 오류가 발생했습니다', 500)
  }
}
