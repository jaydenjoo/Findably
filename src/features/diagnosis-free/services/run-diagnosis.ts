import { createAdminClient } from '@/lib/supabase/admin'
import { evaluate } from '../engine'
import { calculateAICitationPossibility } from '../rules/ai-citation-helpers'
import type { CrawlData } from '@/features/crawling'
import type { Json } from '@/types/database'

/** 진단 상태 상수 */
const DIAGNOSIS_STATUS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

interface RunDiagnosisResult {
  success: boolean
  error?: string
}

/**
 * 크롤링 데이터로 진단 엔진 실행 + 결과 저장
 *
 * 1. evaluate() — 67개 룰 평가 → 종합 점수
 * 2. calculateAICitationPossibility() — AI 인용 가능성 점수
 * 3. analysis_data + total_score + grade + status=completed 저장
 */
export async function runDiagnosis(
  diagnosisId: string,
  crawlData: CrawlData
): Promise<RunDiagnosisResult> {
  try {
    // 1. 진단 엔진 실행 (67개 룰 평가)
    const overallScore = evaluate(crawlData)

    // 2. AI 인용 가능성 점수 계산
    const aiCitation = calculateAICitationPossibility(crawlData)

    // 3. analysis_data 조립
    const analysisData = {
      overallScore,
      aiCitation,
    }

    // 4. Supabase 업데이트 (service_role)
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('diagnoses')
      .update({
        analysis_data: analysisData as unknown as Json,
        total_score: overallScore.score,
        grade: overallScore.grade,
        status: DIAGNOSIS_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
      })
      .eq('id', diagnosisId)

    if (error) {
      console.error(
        `[runDiagnosis] Supabase UPDATE 실패 (diagnosisId=${diagnosisId}):`,
        error.message
      )
      return { success: false, error: 'DB 저장 실패' }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error(
      `[runDiagnosis] 예외 발생 (diagnosisId=${diagnosisId}):`,
      message
    )
    return { success: false, error: '진단 처리 중 오류가 발생했습니다' }
  }
}
