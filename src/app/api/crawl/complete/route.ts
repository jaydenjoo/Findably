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
 * n8n v2 콜백 페이로드 스키마
 *
 * dataCompleteness: 0-100 (성공 소스 / 전체 소스 × 100)
 * successSources: 성공한 소스 이름 배열
 * failedSources: 실패한 소스 이름 배열
 * crawlResult: 각 소스의 raw 응답 (정규화 전)
 */
const completePayloadSchema = z.object({
  diagnosisId: z.string().uuid('diagnosisId must be a valid UUID'),
  url: z.string().url('url must be a valid URL'),
  dataCompleteness: z.number().min(0).max(100),
  successSources: z.array(z.string()),
  failedSources: z.array(z.string()),
  crawlResult: z.record(z.string(), z.unknown()),
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

  try {
    // 3. raw crawlResult → CrawlData 정규화
    const parsedCrawlData: CrawlData = parseCrawlV2Result({
      url: payload.url,
      crawlResult: payload.crawlResult,
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
