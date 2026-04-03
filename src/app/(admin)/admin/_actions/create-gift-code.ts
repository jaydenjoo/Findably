'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACCESS } from '@/config/access-control'

export async function createGiftCodeAction(
  _prev: { message: string },
  formData: FormData
): Promise<{ message: string }> {
  // 1. admin 인증
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !ACCESS.ADMIN_EMAILS.includes(user.email ?? '')) {
    return { message: '관리자 권한이 필요합니다' }
  }

  // 2. 폼 데이터 추출
  const code = (formData.get('code') as string)?.trim().toUpperCase()
  const maxUses = parseInt(formData.get('maxUses') as string, 10) || 1
  const expiresInDays =
    parseInt(formData.get('expiresInDays') as string, 10) || 30
  const description = (formData.get('description') as string)?.trim() || null

  if (!code) {
    return { message: '코드를 입력해주세요' }
  }

  const admin = createAdminClient()

  // 3. 중복 확인
  const { data: existing } = await admin
    .from('gift_codes')
    .select('id')
    .eq('code', code)
    .maybeSingle()

  if (existing) {
    return { message: '이미 존재하는 코드입니다' }
  }

  // 4. 생성
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const { error } = await admin.from('gift_codes').insert({
    code,
    max_uses: maxUses,
    expires_at: expiresAt.toISOString(),
    description,
    is_active: true,
  })

  if (error) {
    console.error('[createGiftCodeAction]', error)
    return { message: `생성 실패: ${error.message}` }
  }

  revalidatePath('/admin')
  return { message: `✓ ${code} 생성 완료!` }
}
