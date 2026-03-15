'use server'

import { createClient } from '@/lib/supabase/server'

export type UserTier = 'free' | 'paid'

interface UserTierResult {
  tier: UserTier
  diagnosisId: string
}

/**
 * 진단 ID 기반 사용자 티어 판별
 * - diagnoses.payment_status 컬럼으로 판단
 * - RLS로 소유자만 조회 가능
 */
export async function getUserTier(
  diagnosisId: string
): Promise<{ data: UserTierResult | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: '인증이 필요합니다.' }
    }

    const { data, error } = await supabase
      .from('diagnoses')
      .select('id, payment_status')
      .eq('id', diagnosisId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[getUserTier]', error)
      return { data: null, error: '티어 정보를 불러올 수 없습니다.' }
    }

    if (!data) {
      return { data: null, error: '진단 정보를 찾을 수 없습니다.' }
    }

    const tier: UserTier = data.payment_status === 'paid' ? 'paid' : 'free'

    return { data: { tier, diagnosisId: data.id }, error: null }
  } catch (err) {
    console.error('[getUserTier]', err)
    return { data: null, error: '서버 오류가 발생했습니다.' }
  }
}

/**
 * 최근 진단의 티어 조회 (diagnosisId 없을 때 사용)
 */
export async function getLatestUserTier(): Promise<{
  data: UserTierResult | null
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: '인증이 필요합니다.' }
    }

    const { data, error } = await supabase
      .from('diagnoses')
      .select('id, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[getLatestUserTier]', error)
      return { data: null, error: '티어 정보를 불러올 수 없습니다.' }
    }

    if (!data) {
      return { data: null, error: '진단 정보를 찾을 수 없습니다.' }
    }

    const tier: UserTier = data.payment_status === 'paid' ? 'paid' : 'free'

    return { data: { tier, diagnosisId: data.id }, error: null }
  } catch (err) {
    console.error('[getLatestUserTier]', err)
    return { data: null, error: '서버 오류가 발생했습니다.' }
  }
}
