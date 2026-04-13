import { createAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/api/response'
import { CANARY_URL, CANARY_EXPECTED_RULES } from '@/config/canary'
import type { RuleResult } from '@/features/diagnosis-free/types'

export const dynamic = 'force-dynamic'

interface CanaryMismatch {
  ruleId: string
  name: string
  expected: 'passed'
  actual: 'failed' | 'skipped' | 'not_found'
}

/**
 * GET /api/canary
 *
 * findably.kr 최신 진단 결과를 기대값과 비교.
 * 불일치 항목이 있으면 ok: false + mismatches 반환.
 */
export async function GET(): Promise<Response> {
  try {
    const supabase = createAdminClient()

    // findably.kr 최신 completed 진단 조회
    const { data: diagnosis, error } = await supabase
      .from('diagnoses')
      .select('id, analysis_data, total_score, created_at')
      .eq('status', 'completed')
      .like('url', `%findably.kr%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !diagnosis) {
      return errorResponse('findably.kr 진단 결과를 찾을 수 없습니다', 404)
    }

    // analysis_data에서 룰 결과 추출
    const analysisData = diagnosis.analysis_data as Record<
      string,
      unknown
    > | null
    if (!analysisData) {
      return errorResponse('analysis_data가 비어있습니다', 500)
    }

    const overallScore = analysisData.overallScore as
      | {
          categories?: { rules?: RuleResult[] }[]
        }
      | undefined

    const allRules: RuleResult[] = []
    if (overallScore?.categories) {
      for (const cat of overallScore.categories) {
        if (cat.rules) allRules.push(...cat.rules)
      }
    }

    // 기대값 비교
    const mismatches: CanaryMismatch[] = []

    for (const expected of CANARY_EXPECTED_RULES) {
      const rule = allRules.find((r) => r.id === expected.ruleId)

      if (!rule) {
        mismatches.push({
          ruleId: expected.ruleId,
          name: expected.name,
          expected: 'passed',
          actual: 'not_found',
        })
        continue
      }

      if (rule.skipped && expected.allowSkipped) {
        continue // SSL 등 외부 의존성은 skipped 허용
      }

      if (!rule.passed) {
        mismatches.push({
          ruleId: expected.ruleId,
          name: expected.name,
          expected: 'passed',
          actual: rule.skipped ? 'skipped' : 'failed',
        })
      }
    }

    return successResponse({
      ok: mismatches.length === 0,
      canaryUrl: CANARY_URL,
      diagnosisId: diagnosis.id,
      totalScore: diagnosis.total_score,
      checkedAt: new Date().toISOString(),
      diagnosedAt: diagnosis.created_at,
      totalChecked: CANARY_EXPECTED_RULES.length,
      mismatches,
    })
  } catch (err) {
    console.error('[canary] 검증 실패:', err)
    return errorResponse('카나리 검증 중 오류가 발생했습니다', 500)
  }
}
