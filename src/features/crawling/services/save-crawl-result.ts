import { createAdminClient } from '@/lib/supabase/admin'
import { transitionStatus } from '@/lib/diagnosis/transition-status'
import { crawlDataSchema } from '../schemas'
import type { CrawlData } from '../types'
import type { Json } from '@/types/database'

interface SaveCrawlResultParams {
  diagnosisId: string
  crawlData: CrawlData
}

interface SaveCrawlResultResponse {
  success: boolean
  error?: string
}

/**
 * 크롤링 결과를 Supabase diagnoses 테이블에 저장
 *
 * 1. Zod 스키마로 crawlData 검증
 * 2. service_role 클라이언트로 UPDATE (RLS 우회)
 * 3. status를 'analyzing'으로 변경 (다음 단계: 진단 엔진)
 *
 * @param params - { diagnosisId, crawlData }
 * @returns { success, error? }
 */
export async function saveCrawlResult(
  params: SaveCrawlResultParams
): Promise<SaveCrawlResultResponse> {
  const { diagnosisId, crawlData } = params

  // 1. Zod 검증
  const parseResult = crawlDataSchema.safeParse(crawlData)
  if (!parseResult.success) {
    const errorMessage = parseResult.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    console.error(
      `[saveCrawlResult] Zod 검증 실패 (diagnosisId=${diagnosisId}):`,
      errorMessage
    )
    return { success: false, error: `데이터 검증 실패: ${errorMessage}` }
  }

  // 2. Supabase UPDATE (service_role)
  try {
    const supabase = createAdminClient()

    // crawl_data만 저장 (status는 transitionStatus로 분리)
    const { error } = await supabase
      .from('diagnoses')
      .update({
        crawl_data: parseResult.data as unknown as Json,
      })
      .eq('id', diagnosisId)

    if (error) {
      console.error(
        `[saveCrawlResult] Supabase UPDATE 실패 (diagnosisId=${diagnosisId}):`,
        error.message
      )
      return { success: false, error: 'DB 저장 실패' }
    }

    // status 전이: pending/crawling → analyzing
    await transitionStatus(diagnosisId, 'analyzing', {
      caller: 'saveCrawlResult',
    })

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error(
      `[saveCrawlResult] 예외 발생 (diagnosisId=${diagnosisId}):`,
      message
    )
    return { success: false, error: '데이터 저장 중 오류가 발생했습니다' }
  }
}

/**
 * 진단 상태를 'failed'로 업데이트
 *
 * 크롤링 실패 시 호출 — 사유를 crawl_data에 기록
 */
export async function markDiagnosisFailed(
  diagnosisId: string,
  reason: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    await transitionStatus(diagnosisId, 'failed', {
      caller: 'markDiagnosisFailed',
    })

    const { error } = await supabase
      .from('diagnoses')
      .update({
        crawl_data: {
          crawled_at: new Date().toISOString(),
          duration_ms: 0,
          is_partial: true,
          blocked_reason: reason,
          layer1: null,
          robots_txt: null,
          sitemap: null,
          llms_txt: null,
          cms: null,
          mobile: null,
          layer2: null,
          layer3: null,
        } as unknown as Json,
      })
      .eq('id', diagnosisId)

    if (error) {
      console.error(
        `[markDiagnosisFailed] Supabase UPDATE 실패 (diagnosisId=${diagnosisId}):`,
        error.message
      )
    }
  } catch (error) {
    console.error('[markDiagnosisFailed] 예외:', error)
  }
}
