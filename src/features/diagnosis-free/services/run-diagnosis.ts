import { createAdminClient } from '@/lib/supabase/admin'
import { evaluate } from '../engine'
import { calculateAICitationPossibility } from '../rules/ai-citation-helpers'
import { aggregateScores } from './score-aggregator'
import type { CrawlData } from '@/features/crawling'
import type { Json } from '@/types/database'

/** 진단 상태 상수 */
const DIAGNOSIS_STATUS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

/** 기본 데이터 완성도 (v1 호환 — dataCompleteness 미전달 시) */
const DEFAULT_DATA_COMPLETENESS = 100

interface RunDiagnosisParams {
  diagnosisId: string
  crawlData: CrawlData
  /** 데이터 완성도 (0-100) — n8n v2 콜백에서 전달 */
  dataCompleteness?: number
}

interface RunDiagnosisResult {
  success: boolean
  error?: string
}

/**
 * 크롤링 데이터로 진단 엔진 실행 + 결과 저장
 *
 * 1. evaluate() — 67개 룰 평가 → 종합 점수 (7개 카테고리)
 * 2. calculateAICitationPossibility() — AI 인용 가능성 점수
 * 3. aggregateScores() — 7개 카테고리 → 5개 매크로 점수 집계
 * 4. analysis_data + total_score + grade + status=completed 저장
 */
export async function runDiagnosis(
  params: RunDiagnosisParams
): Promise<RunDiagnosisResult> {
  const {
    diagnosisId,
    crawlData,
    dataCompleteness = DEFAULT_DATA_COMPLETENESS,
  } = params

  try {
    // 1. 진단 엔진 실행 (67개 룰 평가)
    const overallScore = evaluate(crawlData)

    // 2. AI 인용 가능성 점수 계산
    const aiCitation = calculateAICitationPossibility(crawlData)

    // 3. 5-Score 매크로 점수 집계
    const aggregated = aggregateScores({
      overallScore,
      aiCitation,
      dataCompleteness,
    })

    // 4. analysis_data 조립
    const analysisData = {
      overallScore,
      aiCitation,
      aggregated,
    }

    // 5. Supabase 업데이트 (service_role)
    //    tier='paid'이면 유료 분석이 진행 중(analyzing)일 수 있으므로
    //    status를 'completed'로 덮어쓰지 않고 analysis_data + 점수만 저장
    const supabase = createAdminClient()

    const { data: currentDiag } = await supabase
      .from('diagnoses')
      .select('tier, status')
      .eq('id', diagnosisId)
      .single()

    // tier='paid'일 때만 유료 플로우로 판단
    // (status='analyzing'은 무료 크롤링 완료 후에도 설정되므로 조건에서 제외)
    const isPaidFlow = currentDiag?.tier === 'paid'

    const updatePayload: Record<string, unknown> = {
      analysis_data: analysisData as unknown as Json,
      total_score: aggregated.totalScore,
      grade: aggregated.totalGrade,
    }

    // 유료 플로우가 아닐 때만 status를 completed로 변경
    if (!isPaidFlow) {
      updatePayload.status = DIAGNOSIS_STATUS.COMPLETED
      updatePayload.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('diagnoses')
      .update(updatePayload)
      .eq('id', diagnosisId)

    if (error) {
      console.error(
        `[runDiagnosis] Supabase UPDATE 실패 (diagnosisId=${diagnosisId}):`,
        error.message
      )
      // DB 저장 실패 시 status를 'failed'로 명시 업데이트 (상태 고착 방지)
      await supabase
        .from('diagnoses')
        .update({ status: DIAGNOSIS_STATUS.FAILED })
        .eq('id', diagnosisId)
      return { success: false, error: 'DB 저장 실패' }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error(
      `[runDiagnosis] 예외 발생 (diagnosisId=${diagnosisId}):`,
      message
    )
    // 예외 발생 시 status를 'failed'로 명시 업데이트 (상태 고착 방지)
    try {
      const supabase = createAdminClient()
      await supabase
        .from('diagnoses')
        .update({ status: DIAGNOSIS_STATUS.FAILED })
        .eq('id', diagnosisId)
    } catch (dbError: unknown) {
      console.error('[runDiagnosis] 상태 복구 실패:', dbError)
    }
    return { success: false, error: '진단 처리 중 오류가 발생했습니다' }
  }
}
