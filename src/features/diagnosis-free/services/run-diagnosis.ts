import { createAdminClient } from '@/lib/supabase/admin'
import { transitionStatus } from '@/lib/diagnosis/transition-status'
import { evaluate } from '../engine'
import { calculateAICitationPossibility } from '../rules/ai-citation-helpers'
import { aggregateScores } from './score-aggregator'
import type { CrawlData } from '@/features/crawling'
import type { Json } from '@/types/database'

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
 * 4. analysis_data + total_score + grade 저장
 * 5. transitionStatus로 completed 전이 (유료 플로우면 자동 차단됨)
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

    // 5. analysis_data + 점수만 저장 (status는 transitionStatus에 위임)
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('diagnoses')
      .update({
        analysis_data: analysisData as unknown as Json,
        total_score: aggregated.totalScore,
        grade: aggregated.totalGrade,
      })
      .eq('id', diagnosisId)

    if (error) {
      console.error(
        `[runDiagnosis] Supabase UPDATE 실패 (diagnosisId=${diagnosisId}):`,
        error.message
      )
      await transitionStatus(diagnosisId, 'failed', { caller: 'runDiagnosis' })
      return { success: false, error: 'DB 저장 실패' }
    }

    // 6. status 전이: analyzing → completed
    //    tier='paid'이면 completed → analyzing 역전이가 불필요하므로
    //    transitionStatus가 현재 status='completed'(유료 결제 후)를 analyzing으로
    //    바꾸려 하지 않음. 단순히 analyzing → completed만 시도.
    //    이미 completed(유료 결제 전)이면 동일 상태 스킵됨.
    await transitionStatus(diagnosisId, 'completed', {
      caller: 'runDiagnosis',
    })

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error(
      `[runDiagnosis] 예외 발생 (diagnosisId=${diagnosisId}):`,
      message
    )
    await transitionStatus(diagnosisId, 'failed', {
      caller: 'runDiagnosis:catch',
    })
    return { success: false, error: '진단 처리 중 오류가 발생했습니다' }
  }
}
