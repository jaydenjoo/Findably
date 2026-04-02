'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACCESS } from '@/config/access-control'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
}

/** 관리자 권한 확인 */
async function verifyAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { isAdmin: false, error: '로그인 필요' }
  if (!ACCESS.ADMIN_EMAILS.includes(user.email ?? ''))
    return { isAdmin: false, error: '관리자 권한 없음' }

  return { isAdmin: true }
}

/** 진단 status 수동 변경 */
export async function adminUpdateStatus(
  diagnosisId: string,
  newStatus: string
): Promise<ActionResult> {
  const auth = await verifyAdmin()
  if (!auth.isAdmin) return { success: false, error: auth.error }

  const validStatuses = [
    'pending',
    'crawling',
    'analyzing',
    'completed',
    'failed',
  ]
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: `유효하지 않은 상태: ${newStatus}` }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('diagnoses')
    .update({
      status: newStatus,
      ...(newStatus === 'completed'
        ? { completed_at: new Date().toISOString() }
        : {}),
    })
    .eq('id', diagnosisId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

/** 유료 분석 재트리거 */
export async function adminRetriggerPaid(
  diagnosisId: string
): Promise<ActionResult> {
  const auth = await verifyAdmin()
  if (!auth.isAdmin) return { success: false, error: auth.error }

  const supabase = createAdminClient()

  // status를 analyzing으로 리셋
  const { error: updateError } = await supabase
    .from('diagnoses')
    .update({ status: 'analyzing', updated_at: new Date().toISOString() })
    .eq('id', diagnosisId)

  if (updateError) return { success: false, error: updateError.message }

  // trigger-analysis API 호출
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.CRAWL_EXECUTE_SECRET

  if (!baseUrl || !secret) {
    return {
      success: false,
      error: '환경변수 미설정 (SITE_URL 또는 CRAWL_EXECUTE_SECRET)',
    }
  }

  try {
    const res = await fetch(`${baseUrl}/api/payment/trigger-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify({ diagnosisId }),
    })

    if (!res.ok) {
      return { success: false, error: `트리거 HTTP ${res.status}` }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '트리거 실패',
    }
  }

  revalidatePath('/admin')
  return { success: true }
}

/** 진단 삭제 */
export async function adminDeleteDiagnosis(
  diagnosisId: string
): Promise<ActionResult> {
  const auth = await verifyAdmin()
  if (!auth.isAdmin) return { success: false, error: auth.error }

  const supabase = createAdminClient()

  // 관련 payments 먼저 삭제
  await supabase.from('payments').delete().eq('diagnosis_id', diagnosisId)

  const { error } = await supabase
    .from('diagnoses')
    .delete()
    .eq('id', diagnosisId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
