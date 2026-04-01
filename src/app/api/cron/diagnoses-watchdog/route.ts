import { type NextRequest } from 'next/server'
import type { Json } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'
import { successResponse } from '@/lib/api/response'

/**
 * GET /api/cron/diagnoses-watchdog
 *
 * Vercel Cron이 5분마다 호출하여 stuck 진단을 자동 복구.
 *
 * 1. pending/crawling 5분+ → 크롤링 재시도 (n8n 웹훅 or fallback)
 * 2. analyzing 10분+ → AI 분석 재시도
 * 3. retry 3회 초과 → failed 마킹
 */
export async function GET(request: NextRequest): Promise<Response> {
  // Vercel Cron 인증 검증
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // 로컬 개발 시에는 CRON_SECRET 없을 수 있으므로 경고만
    console.warn('[watchdog] CRON_SECRET 불일치, 계속 진행')
  }

  const supabase = createAdminClient()
  const results: string[] = []

  try {
    // 1. 크롤링 stuck: pending/crawling 5분 이상
    const { data: crawlStuck } = await supabase
      .from('diagnoses')
      .select('id, url, status, crawl_data')
      .in('status', ['pending', 'crawling'])
      .lt('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(10)

    for (const diag of crawlStuck ?? []) {
      const retryCount = getRetryCount(diag.crawl_data)

      if (retryCount >= 3) {
        await supabase
          .from('diagnoses')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', diag.id)
        results.push(`${diag.id}: failed (max retries)`)
        continue
      }

      // n8n 웹훅 재시도
      const retriggered = await retriggerCrawl(diag.id, diag.url)
      await incrementRetryCount(supabase, diag.id, diag.crawl_data)

      results.push(
        `${diag.id}: crawl retry ${retryCount + 1} — ${retriggered ? 'ok' : 'failed'}`
      )
    }

    // 2. AI 분석 stuck: analyzing 10분 이상
    const { data: analyzeStuck } = await supabase
      .from('diagnoses')
      .select('id, url, status, crawl_data, tier')
      .eq('status', 'analyzing')
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .limit(10)

    for (const diag of analyzeStuck ?? []) {
      const retryCount = getRetryCount(diag.crawl_data)

      if (retryCount >= 3) {
        await supabase
          .from('diagnoses')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', diag.id)
        results.push(`${diag.id}: failed (max retries)`)
        continue
      }

      if (diag.tier === 'paid') {
        const retriggered = await retriggerAnalysis(diag.id)
        await incrementRetryCount(supabase, diag.id, diag.crawl_data)
        results.push(
          `${diag.id}: analysis retry ${retryCount + 1} — ${retriggered ? 'ok' : 'failed'}`
        )
      } else {
        // 무료 진단 analyzing stuck → failed
        await supabase
          .from('diagnoses')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', diag.id)
        results.push(`${diag.id}: free analyzing → failed`)
      }
    }
  } catch (error) {
    console.error('[watchdog] 예외:', error)
    results.push(`error: ${error instanceof Error ? error.message : 'unknown'}`)
  }

  if (results.length > 0) {
    console.log('[watchdog] 처리 결과:', results)
  }

  // 항상 200 반환 (Cron이 에러 재시도하지 않도록)
  return successResponse({
    processed: results.length,
    results,
    timestamp: new Date().toISOString(),
  })
}

/** crawl_data JSON에서 _retryCount 추출 */
function getRetryCount(crawlData: unknown): number {
  if (
    typeof crawlData === 'object' &&
    crawlData !== null &&
    '_retryCount' in crawlData
  ) {
    const count = (crawlData as Record<string, unknown>)._retryCount
    return typeof count === 'number' ? count : 0
  }
  return 0
}

/** _retryCount 증가 */
async function incrementRetryCount(
  supabase: ReturnType<typeof createAdminClient>,
  diagnosisId: string,
  crawlData: unknown
): Promise<void> {
  const current = getRetryCount(crawlData)
  const base =
    typeof crawlData === 'object' && crawlData !== null ? crawlData : {}
  await supabase
    .from('diagnoses')
    .update({
      crawl_data: {
        ...(base as Record<string, unknown>),
        _retryCount: current + 1,
      } as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', diagnosisId)
}

/** n8n 웹훅 재호출 */
async function retriggerCrawl(
  diagnosisId: string,
  url: string
): Promise<boolean> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/crawl/complete`

  if (!webhookUrl || !webhookSecret) {
    console.error('[watchdog] N8N 환경변수 미설정')
    return false
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify({ diagnosisId, url, callbackUrl }),
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok
  } catch (error) {
    console.error('[watchdog] n8n 재시도 실패:', error)
    return false
  }
}

/** AI 분석 재트리거 */
async function retriggerAnalysis(diagnosisId: string): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.CRAWL_EXECUTE_SECRET

  if (!baseUrl || !secret) {
    console.error('[watchdog] 분석 트리거 환경변수 미설정')
    return false
  }

  try {
    const res = await fetch(`${baseUrl}/api/payment/trigger-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify({ diagnosisId }),
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok
  } catch (error) {
    console.error('[watchdog] 분석 재시도 실패:', error)
    return false
  }
}
