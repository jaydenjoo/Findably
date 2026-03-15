'use server'

import { createClient } from '@/lib/supabase/server'
import type { UserTier } from '@/lib/access-control/get-user-tier'
import {
  parseAnalysisData,
  parsePartialInfo,
} from '@/lib/utils/diagnosis-parser'
import type { AnalysisData } from '@/lib/utils/diagnosis-parser'

/** Server Action 응답 */
export interface DiagnosisResult {
  analysisData: AnalysisData
  url: string
  tier: UserTier
  diagnosisId: string
  isPartial: boolean
  blockedReason?: string
}

/**
 * 진단 ID로 전체 analysis_data 조회
 * - RLS로 소유자만 조회 가능
 * - searchParams에 id가 없으면 최신 진단 조회
 */
export async function getDiagnosisAction(
  diagnosisId?: string
): Promise<{ data: DiagnosisResult | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: '인증이 필요합니다.' }
    }

    let query = supabase
      .from('diagnoses')
      .select('id, url, analysis_data, payment_status, crawl_data, status')
      .eq('user_id', user.id)

    if (diagnosisId) {
      query = query.eq('id', diagnosisId)
    } else {
      query = query.order('created_at', { ascending: false }).limit(1)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('[getDiagnosisAction]', error)
      return { data: null, error: '진단 데이터를 불러올 수 없습니다.' }
    }

    if (!data) {
      return { data: null, error: '진단 정보를 찾을 수 없습니다.' }
    }

    if (data.status !== 'completed') {
      return { data: null, error: '진단이 아직 완료되지 않았습니다.' }
    }

    const analysisData = parseAnalysisData(data.analysis_data)
    if (!analysisData) {
      return { data: null, error: '진단 데이터를 파싱할 수 없습니다.' }
    }

    const partialInfo = parsePartialInfo(data.crawl_data)
    const tier: UserTier = data.payment_status === 'paid' ? 'paid' : 'free'

    return {
      data: {
        analysisData,
        url: data.url,
        tier,
        diagnosisId: data.id,
        isPartial: partialInfo.isPartial,
        blockedReason: partialInfo.blockedReason,
      },
      error: null,
    }
  } catch (err) {
    console.error('[getDiagnosisAction]', err)
    return { data: null, error: '서버 오류가 발생했습니다.' }
  }
}
