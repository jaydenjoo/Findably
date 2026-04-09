'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACCESS } from '@/config/access-control'
import { maintenanceNoticeSchema } from '@/features/admin/maintenance/types'
import { MAINTENANCE_NOTICE_TAG } from '@/features/admin/maintenance/queries/get-maintenance-notice'

interface ActionResult {
  message: string
  success?: boolean
}

/**
 * 점검 공지 수정 Server Action
 *
 * 1. admin 인증 (ACCESS.ADMIN_EMAILS allowlist)
 * 2. Zod 검증
 * 3. service_role로 단일 row(id=1) UPDATE
 * 4. 캐시 무효화 → 랜딩 즉시 반영
 */
export async function updateMaintenanceNoticeAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  // 1. admin 인증
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user ||
    !(ACCESS.ADMIN_EMAILS as readonly string[]).includes(user.email ?? '')
  ) {
    return { message: '관리자 권한이 필요합니다' }
  }

  // 2. 폼 데이터 파싱 (빈 문자열 → null 변환)
  const rawEmail = formData.get('contactEmail')?.toString().trim() ?? ''
  const rawEta = formData.get('etaText')?.toString().trim() ?? ''

  const raw = {
    isActive: formData.get('isActive') === 'on',
    title: formData.get('title')?.toString() ?? '',
    body: formData.get('body')?.toString() ?? '',
    contactEmail: rawEmail.length > 0 ? rawEmail : null,
    etaText: rawEta.length > 0 ? rawEta : null,
  }

  // 3. Zod 검증
  const parsed = maintenanceNoticeSchema.safeParse(raw)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return { message: firstIssue?.message ?? '입력값을 확인해주세요' }
  }

  // 4. service_role로 UPDATE
  const admin = createAdminClient()
  const { error } = await admin
    .from('findably_maintenance_notices')
    .update({
      is_active: parsed.data.isActive,
      title: parsed.data.title,
      body: parsed.data.body,
      contact_email: parsed.data.contactEmail,
      eta_text: parsed.data.etaText,
      updated_by: user.id,
    })
    .eq('id', 1)

  if (error) {
    console.error('[updateMaintenanceNoticeAction]', error)
    return { message: `저장 실패: ${error.message}` }
  }

  // 5. 캐시 무효화 (랜딩 페이지 + Admin 페이지 둘 다)
  // Next.js 16: revalidateTag는 두 번째 인자로 cacheLife profile 필수. 'max' = stale-while-revalidate 권장값
  revalidateTag(MAINTENANCE_NOTICE_TAG, 'max')
  revalidatePath('/')
  revalidatePath('/admin')

  return {
    message: parsed.data.isActive
      ? '✓ 공지 저장 완료 (노출 ON)'
      : '✓ 공지 저장 완료 (노출 OFF)',
    success: true,
  }
}
