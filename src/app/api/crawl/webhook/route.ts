import { timingSafeEqual } from 'crypto'
import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/api/response'
import { crawlingConfig } from '@/config/crawling'
import { runLayers } from '@/features/crawling/services/run-layers'
import {
  saveCrawlResult,
  markDiagnosisFailed,
} from '@/features/crawling/services/save-crawl-result'
import { runDiagnosis } from '@/features/diagnosis-free/services/run-diagnosis'
import type { CrawlData } from '@/features/crawling'

/**
 * 웹훅 페이로드 Zod 스키마
 * diagnosisId: UUID, url: URL 포맷 검증
 */
const webhookPayloadSchema = z.object({
  diagnosisId: z.string().uuid('diagnosisId must be a valid UUID'),
  url: z.string().url('url must be a valid URL'),
  layer1: z.unknown().nullable().default(null),
  robots_txt: z.unknown().nullable().default(null),
  sitemap: z.unknown().nullable().default(null),
  llms_txt: z.unknown().nullable().default(null),
  cms: z.unknown().nullable().default(null),
  mobile: z.unknown().nullable().default(null),
  is_partial: z.boolean().default(false),
  blocked_reason: z.string().optional(),
})

type WebhookPayload = z.infer<typeof webhookPayloadSchema>

/**
 * POST /api/crawl/webhook
 *
 * n8n Layer 1 크롤링 완료 콜백.
 * 1. 웹훅 시크릿 검증 (Authorization 헤더)
 * 2. Layer 2+3 병렬 실행
 * 3. CrawlData 조립 + Supabase 저장
 *
 * 인증: 사용자 세션이 아닌 웹훅 시크릿으로 검증 (서버 간 통신)
 */
export async function POST(request: NextRequest): Promise<Response> {
  // 1. 웹훅 시크릿 검증
  const authHeader = request.headers.get('authorization')
  const expectedSecret = crawlingConfig.webhookSecret

  if (!expectedSecret) {
    console.error('[webhook] N8N_WEBHOOK_SECRET 미설정')
    return errorResponse('서버 설정 오류', 500)
  }

  const expectedToken = `Bearer ${expectedSecret}`
  if (
    !authHeader ||
    authHeader.length !== expectedToken.length ||
    !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedToken))
  ) {
    return errorResponse('인증 실패', 401)
  }

  // 2. 페이로드 파싱
  let payload: WebhookPayload
  try {
    const body = (await request.json()) as Record<string, unknown>
    payload = webhookPayloadSchema.parse(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : '잘못된 요청'
    return errorResponse(message, 400)
  }

  const startTime = Date.now()

  // 3. Layer 2+3 병렬 실행
  try {
    const { layer2, layer3 } = await runLayers(payload.url)

    // 4. CrawlData 조립
    const crawlData: CrawlData = {
      crawled_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      is_partial: payload.is_partial,
      blocked_reason: payload.blocked_reason,
      layer1: payload.layer1 as CrawlData['layer1'],
      robots_txt: payload.robots_txt as CrawlData['robots_txt'],
      sitemap: payload.sitemap as CrawlData['sitemap'],
      llms_txt: payload.llms_txt as CrawlData['llms_txt'],
      cms: payload.cms as CrawlData['cms'],
      mobile: payload.mobile as CrawlData['mobile'],
      layer2,
      layer3,
    }

    // 5. Supabase 저장
    const result = await saveCrawlResult({
      diagnosisId: payload.diagnosisId,
      crawlData,
    })

    if (!result.success) {
      console.error('[webhook] 저장 실패:', result.error)
      return errorResponse('크롤링 결과 저장에 실패했습니다', 500)
    }

    // 6. 진단 엔진 실행 (evaluate + AI 인용 점수 + DB 저장)
    const diagnosisResult = await runDiagnosis(payload.diagnosisId, crawlData)

    if (!diagnosisResult.success) {
      console.error('[webhook] 진단 실패:', diagnosisResult.error)
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
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[webhook] 처리 중 예외:', message)

    // 실패 시 진단 상태를 failed로 전환
    await markDiagnosisFailed(payload.diagnosisId, message)

    return errorResponse('크롤링 처리 중 오류가 발생했습니다', 500)
  }
}
