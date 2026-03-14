'use server'

import { createClient } from '@/lib/supabase/server'
import type { DiagnosisStatusResult } from '../types'

/**
 * 진단 상태 조회 Server Action (폴링용)
 *
 * diagnosisId로 특정 진단 조회 또는 id 없이 가장 최근 pending 진단 조회
 * RLS + user_id 쿼리 이중 보호
 */
export async function getDiagnosisStatus(
  diagnosisId?: string
): Promise<DiagnosisStatusResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: '로그인이 필요합니다.' }
  }

  // id가 있으면 해당 진단 조회, 없으면 가장 최근 진행 중 진단 조회
  if (diagnosisId) {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('id, status, url')
      .eq('id', diagnosisId)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      console.error('[getDiagnosisStatus]', error)
      return { error: '진단 정보를 찾을 수 없습니다.' }
    }

    return { status: data.status, url: data.url, id: data.id }
  }

  // fallback: 가장 최근 진행 중(pending/crawling/analyzing) 진단
  const { data, error } = await supabase
    .from('diagnoses')
    .select('id, status, url')
    .eq('user_id', user.id)
    .in('status', ['pending', 'crawling', 'analyzing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return { error: '진행 중인 분석이 없습니다.' }
  }

  return { status: data.status, url: data.url, id: data.id }
}
