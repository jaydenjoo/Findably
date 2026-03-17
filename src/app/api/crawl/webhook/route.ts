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
import type {
  CrawlData,
  Layer1Data,
  RobotsTxtData,
  SitemapData,
  LlmsTxtData,
  CmsData,
  MobileData,
  Layer2Data,
  Layer3Data,
} from '@/features/crawling'

/**
 * Zod 스키마: 각 layer 타입을 z.record() 또는 z.object().passthrough()로 검증
 * 런타임에는 unknown으로 전달받고, 타입 단언을 통해 CrawlData에 저장
 */
const layer1Schema = z.record(z.string(), z.any()).nullable().default(null)
const robotsTxtSchema = z.record(z.string(), z.any()).nullable().default(null)
const sitemapSchema = z.record(z.string(), z.any()).nullable().default(null)
const llmsTxtSchema = z.record(z.string(), z.any()).nullable().default(null)
const cmsSchema = z.record(z.string(), z.any()).nullable().default(null)
const mobileSchema = z.record(z.string(), z.any()).nullable().default(null)

/**
 * 웹훅 페이로드 Zod 스키마
 * diagnosisId: UUID, url: URL 포맷 검증
 */
const webhookPayloadSchema = z.object({
  diagnosisId: z.string().uuid('diagnosisId must be a valid UUID'),
  url: z.string().url('url must be a valid URL'),
  layer1: layer1Schema,
  robots_txt: robotsTxtSchema,
  sitemap: sitemapSchema,
  llms_txt: llmsTxtSchema,
  cms: cmsSchema,
  mobile: mobileSchema,
  is_partial: z.boolean().default(false),
  blocked_reason: z.string().optional(),
})

type WebhookPayload = z.infer<typeof webhookPayloadSchema>

async function verifyWebhookAuth(
  authHeader: string | null
): Promise<{ success: true } | { success: false; response: Response }> {
  const expectedSecret = crawlingConfig.webhookSecret

  if (!expectedSecret) {
    console.error('[webhook] N8N_WEBHOOK_SECRET 미설정')
    return { success: false, response: errorResponse('서버 설정 오류', 500) }
  }

  const expectedToken = `Bearer ${expectedSecret}`
  if (
    !authHeader ||
    authHeader.length !== expectedToken.length ||
    !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedToken))
  ) {
    return { success: false, response: errorResponse('인증 실패', 401) }
  }

  return { success: true }
}

async function parseWebhookPayload(
  request: NextRequest
): Promise<
  | { success: true; payload: WebhookPayload }
  | { success: false; response: Response }
> {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const payload = webhookPayloadSchema.parse(body)
    return { success: true, payload }
  } catch (error) {
    const message = error instanceof Error ? error.message : '잘못된 요청'
    return { success: false, response: errorResponse(message, 400) }
  }
}

async function executeLayersParallel(
  url: string
): Promise<
  | { success: true; layer2: unknown; layer3: unknown }
  | { success: false; error: string }
> {
  try {
    const { layer2, layer3 } = await runLayers(url)
    return { success: true, layer2, layer3 }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return { success: false, error: message }
  }
}

function assembleCrawlData(
  payload: WebhookPayload,
  layer2: unknown,
  layer3: unknown,
  startTime: number
): CrawlData {
  return {
    crawled_at: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
    is_partial: payload.is_partial,
    blocked_reason: payload.blocked_reason,
    layer1: payload.layer1 as Layer1Data | null,
    robots_txt: payload.robots_txt as RobotsTxtData | null,
    sitemap: payload.sitemap as SitemapData | null,
    llms_txt: payload.llms_txt as LlmsTxtData | null,
    cms: payload.cms as CmsData | null,
    mobile: payload.mobile as MobileData | null,
    layer2: layer2 as Layer2Data | null,
    layer3: layer3 as Layer3Data | null,
    markdownContent: null,
    siteUrls: null,
    firecrawlUsed: false,
  }
}

async function saveCrawlResultAndHandle(
  diagnosisId: string,
  crawlData: CrawlData
): Promise<{ success: true } | { success: false; response: Response }> {
  const result = await saveCrawlResult({
    diagnosisId,
    crawlData,
  })

  if (!result.success) {
    console.error('[webhook] 저장 실패:', result.error)
    return {
      success: false,
      response: errorResponse('크롤링 결과 저장에 실패했습니다', 500),
    }
  }

  return { success: true }
}

async function runDiagnosisAndHandle(
  diagnosisId: string,
  crawlData: CrawlData
): Promise<{ success: true } | { success: false; response: Response }> {
  const diagnosisResult = await runDiagnosis({
    diagnosisId,
    crawlData,
  })

  if (!diagnosisResult.success) {
    console.error('[webhook] 진단 실패:', diagnosisResult.error)
    await markDiagnosisFailed(
      diagnosisId,
      diagnosisResult.error ?? '진단 엔진 실행 실패'
    )
    return {
      success: false,
      response: errorResponse('진단 처리에 실패했습니다', 500),
    }
  }

  return { success: true }
}

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
  const authHeader = request.headers.get('authorization')
  const authResult = await verifyWebhookAuth(authHeader)

  if (!authResult.success) {
    return authResult.response
  }

  const payloadResult = await parseWebhookPayload(request)

  if (!payloadResult.success) {
    return payloadResult.response
  }

  const payload = payloadResult.payload
  const startTime = Date.now()

  try {
    const layersResult = await executeLayersParallel(payload.url)

    if (!layersResult.success) {
      console.error('[webhook] Layer 2+3 실행 실패:', layersResult.error)
      await markDiagnosisFailed(payload.diagnosisId, layersResult.error)
      return errorResponse('크롤링 처리 중 오류가 발생했습니다', 500)
    }

    const crawlData = assembleCrawlData(
      payload,
      layersResult.layer2,
      layersResult.layer3,
      startTime
    )

    const saveResult = await saveCrawlResultAndHandle(
      payload.diagnosisId,
      crawlData
    )

    if (!saveResult.success) {
      return saveResult.response
    }

    const diagnosisResult = await runDiagnosisAndHandle(
      payload.diagnosisId,
      crawlData
    )

    if (!diagnosisResult.success) {
      return diagnosisResult.response
    }

    return successResponse({
      saved: true,
      diagnosed: true,
      duration_ms: crawlData.duration_ms,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[webhook] 처리 중 예외:', message)

    await markDiagnosisFailed(payload.diagnosisId, message)

    return errorResponse('크롤링 처리 중 오류가 발생했습니다', 500)
  }
}
