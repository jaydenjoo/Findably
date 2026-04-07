/** Vercel Lambda 최대 실행 시간 (초) — 크롤링 저장 + 무료 분석에 60초 필요 */
export const maxDuration = 60

import { timingSafeEqual } from 'crypto'
import { type NextRequest } from 'next/server'
import { after } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/api/response'
import { crawlingConfig } from '@/config/crawling'
import {
  saveCrawlResult,
  markDiagnosisFailed,
} from '@/features/crawling/services/save-crawl-result'
import { runDiagnosis } from '@/features/diagnosis-free/services/run-diagnosis'
import type { CrawlData } from '@/features/crawling'
import { parseCrawlV2Result } from '@/features/crawling/services/parse-crawl-v2'
import { enrichCrawlData } from '@/features/crawling/services/enrich-crawl-data'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDiagnosisCompleteEmail } from '@/lib/adapters/email'
import { SCORING } from '@/config/scoring'

/**
 * n8n 콜백 페이로드 스키마 (v2 + v3.2 호환)
 *
 * v2 필수 필드:
 *   diagnosisId, url, dataCompleteness, successSources, failedSources, crawlResult
 *
 * v3.2 신규 필드 (모두 optional — v2 하위 호환):
 *   requestId:    n8n 멱등성 키 — 워크플로우 측 추적용
 *   status:       'success' | 'partial' | 'quality_rejected' (Quality Gate 결과)
 *   durationSec:  크롤링 소요 시간
 *   errorDetails: 실패 소스의 상세 에러 [{ source, error }]
 *   reason:       quality_rejected 시 사유 문자열
 *
 * crawlResult는 quality_rejected 시 v3.2가 보내지 않으므로 optional.
 * → refine으로 "non-rejected는 crawlResult 필수" 검증.
 *
 * ※ Schema↔SQL 설계 주의 (Phase 2 모니터링 도입):
 *   findably_crawl_executions 테이블의 request_id UNIQUE INDEX와 error_details JSONB
 *   컬럼은 n8n 워크플로우 v3.2의 "Save to crawl_executions" 노드가 직접 INSERT한다.
 *   → 이 라우트는 requestId/errorDetails를 파싱만 하고 DB 저장은 하지 않는다.
 *   → 멱등성은 diagnoses.status('completed'/'failed') 기반 가드로 처리 (line 137~).
 *   → /admin/monitor 대시보드(Phase 4)는 findably_crawl_executions에서 직접 조회.
 */
const completePayloadSchema = z
  .object({
    diagnosisId: z.string().uuid('diagnosisId must be a valid UUID'),
    url: z.string().url('url must be a valid URL'),
    dataCompleteness: z.number().min(0).max(100),
    successSources: z.array(z.string()),
    failedSources: z.array(z.string()),
    crawlResult: z.record(z.string(), z.unknown()).optional(),
    // v3.2 신규 (v2 호환: 모두 optional)
    // ─ 아래 5개 필드는 검증/로깅 용도로만 사용. DB 저장은 n8n이 직접 수행.
    requestId: z.string().optional(),
    status: z.enum(['success', 'partial', 'quality_rejected']).optional(),
    durationSec: z.number().optional(),
    errorDetails: z
      .array(
        z.object({
          source: z.string(),
          error: z.string(),
        })
      )
      .optional(),
    reason: z.string().optional(),
  })
  .refine((data) => data.status === 'quality_rejected' || !!data.crawlResult, {
    message: 'crawlResult is required unless status is quality_rejected',
    path: ['crawlResult'],
  })

type CompletePayload = z.infer<typeof completePayloadSchema>

/**
 * n8n v2 워크플로우 완료 콜백 — 공통 핸들러
 *
 * 1. 웹훅 시크릿 검증 (Authorization 헤더)
 * 2. 페이로드 파싱 + Zod 검증
 * 3. raw crawlResult → CrawlData 정규화
 * 4. Supabase 저장
 * 5. 진단 엔진 실행
 *
 * 인증: 사용자 세션이 아닌 웹훅 시크릿으로 검증 (서버 간 통신)
 */
async function handleCallback(request: NextRequest): Promise<Response> {
  // 1. 웹훅 시크릿 검증
  const authHeader = request.headers.get('authorization')
  const expectedSecret = crawlingConfig.webhookSecret

  if (!expectedSecret) {
    console.error('[crawl/complete] N8N_WEBHOOK_SECRET 미설정')
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

  // 1.5. Monitor probe 필터 (n8n Monitor v2.1 Health Check)
  // 인증된 모니터가 'X-Monitor-Probe: true' 헤더로 liveness만 확인할 때
  // 실제 크롤링 처리/DB write 없이 즉시 200 반환.
  // → monitor 대시보드에서 healthy 표시 (400 warning 우회).
  if (request.headers.get('x-monitor-probe') === 'true') {
    return successResponse({
      status: 'probe_ok',
      route: '/api/crawl/complete',
      timestamp: new Date().toISOString(),
    })
  }

  // 2. 페이로드 파싱
  let payload: CompletePayload
  try {
    const body = (await request.json()) as Record<string, unknown>
    payload = completePayloadSchema.parse(body)
  } catch (error) {
    console.error(
      '[crawl/complete] 페이로드 검증 실패:',
      error instanceof Error ? error.message : error
    )
    return errorResponse('잘못된 요청', 400)
  }

  const startTime = Date.now()

  // 2.5 멱등성 가드 (2026-04-06 미스터리 1 fix):
  // n8n이 같은 진단에 콜백을 여러 번 보내는 케이스 차단.
  // 이미 completed/failed면 무료 분석 재실행 + DB update 폭주를 막는다.
  // 증상: 7c0a7f6d 진단이 5분간 score가 50→53→... 매번 변함.
  // 원인: handleCallback이 멱등성 가드 없이 saveCrawlResult+enrichCrawlData+runDiagnosis를 매번 실행.
  try {
    const guardClient = createAdminClient()
    const { data: existing } = await guardClient
      .from('diagnoses')
      .select('status')
      .eq('id', payload.diagnosisId)
      .single()

    if (existing?.status === 'completed') {
      console.log(
        '[crawl/complete] 이미 completed — 중복 콜백 무시:',
        payload.diagnosisId
      )
      return successResponse({
        skipped: true,
        reason: 'already_completed',
        diagnosisId: payload.diagnosisId,
      })
    }

    if (existing?.status === 'failed') {
      console.warn(
        '[crawl/complete] failed 상태에 콜백 — 무시:',
        payload.diagnosisId
      )
      return successResponse({
        skipped: true,
        reason: 'already_failed',
        diagnosisId: payload.diagnosisId,
      })
    }
  } catch (guardError) {
    // 가드 자체 실패는 차단하지 않고 진행 (DB 접근 일시 장애 시 정상 흐름 유지)
    console.warn(
      '[crawl/complete] 멱등성 가드 조회 실패 — 정상 흐름 진행:',
      guardError instanceof Error ? guardError.message : 'unknown'
    )
  }

  // 2.6. 품질 게이트 실패 처리 (v3.2 Quality Gate → Fail Callback)
  // Firecrawl 스크랩 실패 또는 dataCompleteness < 30 시 quality_rejected.
  // crawlResult가 없거나 불완전하므로 진단 엔진 실행하지 않고 즉시 failed 마킹.
  if (payload.status === 'quality_rejected') {
    const reason =
      payload.reason ??
      `크롤링 품질 미달 (completeness ${payload.dataCompleteness}%)`
    console.warn('[crawl/complete] quality_rejected:', {
      diagnosisId: payload.diagnosisId,
      dataCompleteness: payload.dataCompleteness,
      failedSources: payload.failedSources,
      reason,
    })

    await markDiagnosisFailed(payload.diagnosisId, reason)

    // markDiagnosisFailed는 silent failure 패턴 (Promise<void> + 내부 try/catch).
    // DB 장애로 마킹이 실패하면 진단이 'crawling'에 영구 고착되므로
    // 직접 status를 재조회하여 검증. 실패 시 500 반환 → n8n retry 유도.
    try {
      const verifyClient = createAdminClient()
      const { data: postMark } = await verifyClient
        .from('diagnoses')
        .select('status')
        .eq('id', payload.diagnosisId)
        .single()

      if (postMark?.status !== 'failed') {
        console.error('[crawl/complete] markDiagnosisFailed silent failure:', {
          diagnosisId: payload.diagnosisId,
          currentStatus: postMark?.status,
        })
        return errorResponse('진단 실패 마킹 실패 — retry 필요', 500)
      }
    } catch (verifyError) {
      console.error(
        '[crawl/complete] mark 검증 조회 실패:',
        verifyError instanceof Error ? verifyError.message : 'unknown'
      )
      return errorResponse('진단 실패 마킹 검증 실패 — retry 필요', 500)
    }

    return successResponse({
      saved: false,
      diagnosed: false,
      status: 'quality_rejected',
      dataCompleteness: payload.dataCompleteness,
      failedSources: payload.failedSources,
      reason,
    })
  }

  // 여기 도달 시 refine() 보장으로 crawlResult 존재. TS 좁히기 용 방어.
  if (!payload.crawlResult) {
    console.error(
      '[crawl/complete] crawlResult missing (refine bypass):',
      payload.diagnosisId
    )
    return errorResponse('잘못된 페이로드 구조', 400)
  }
  const crawlResultInput = payload.crawlResult

  try {
    // 3. raw crawlResult → CrawlData 정규화
    const parsedCrawlData: CrawlData = parseCrawlV2Result({
      url: payload.url,
      crawlResult: crawlResultInput,
      dataCompleteness: payload.dataCompleteness,
      failedSources: payload.failedSources,
    })

    // 4. Supabase 저장 (먼저 저장 후 보강)
    const result = await saveCrawlResult({
      diagnosisId: payload.diagnosisId,
      crawlData: parsedCrawlData,
    })

    if (!result.success) {
      console.error('[crawl/complete] 저장 실패:', result.error)
      return errorResponse('크롤링 결과 저장에 실패했습니다', 500)
    }

    // 4.5. Layer 2/3 데이터 보강 (PageSpeed, SSL, Observatory, SafeBrowsing)
    await enrichCrawlData(payload.diagnosisId, payload.url)

    // 4.6. 보강된 crawl_data 재조회 (진단 엔진에 전달)
    const { data: enrichedDiag } = await createAdminClient()
      .from('diagnoses')
      .select('crawl_data')
      .eq('id', payload.diagnosisId)
      .single()
    const crawlData =
      (enrichedDiag?.crawl_data as unknown as CrawlData) ?? parsedCrawlData

    // 5. 진단 엔진 실행
    const diagnosisResult = await runDiagnosis({
      diagnosisId: payload.diagnosisId,
      crawlData,
      dataCompleteness: payload.dataCompleteness,
    })

    if (!diagnosisResult.success) {
      console.error('[crawl/complete] 진단 실패:', diagnosisResult.error)
      await markDiagnosisFailed(
        payload.diagnosisId,
        diagnosisResult.error ?? '진단 엔진 실행 실패'
      )
      return errorResponse('진단 처리에 실패했습니다', 500)
    }

    // 6. 이메일 발송 (응답 반환 후 비동기 — after())
    after(async () => {
      try {
        const supabase = createAdminClient()
        const { data: diagnosis } = await supabase
          .from('diagnoses')
          .select('user_id, total_score, grade')
          .eq('id', payload.diagnosisId)
          .single()

        if (!diagnosis?.user_id) return

        const { data: userData } = await supabase.auth.admin.getUserById(
          diagnosis.user_id
        )
        const email = userData?.user?.email
        if (!email) return

        const score = diagnosis.total_score ?? 0
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? 'https://findably.kr'

        await sendDiagnosisCompleteEmail({
          to: email,
          score,
          grade: SCORING.getScoreLabel(score),
          reportUrl: `${siteUrl}/dashboard`,
          siteUrl: payload.url,
        })
      } catch (error) {
        console.error('[crawl/complete] 이메일 발송 실패:', error)
      }
    })

    return successResponse({
      saved: true,
      diagnosed: true,
      dataCompleteness: payload.dataCompleteness,
      successSources: payload.successSources,
      failedSources: payload.failedSources,
      duration_ms: Date.now() - startTime,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[crawl/complete] 처리 중 예외:', message)

    await markDiagnosisFailed(payload.diagnosisId, message)

    return errorResponse('크롤링 처리 중 오류가 발생했습니다', 500)
  }
}

/**
 * POST — 정상 콜백
 * GET  — n8n이 trailing slash 308 리다이렉트 따라가면서 POST→GET 변환되는 케이스 대응
 */
export const POST = handleCallback
export const GET = handleCallback
