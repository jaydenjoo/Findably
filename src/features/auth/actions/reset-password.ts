'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { resetPasswordSchema } from '../schemas'
import type { AuthActionState } from '../types'

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
  }

  const validated = resetPasswordSchema.safeParse(raw)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    return { error: firstIssue?.message ?? '입력값을 확인해주세요' }
  }

  const headersList = await headers()
  const origin =
    headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(validated.data.email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  })

  // NFR-6: 이메일 존재 여부와 무관하게 항상 동일 메시지
  return {
    message: '비밀번호 재설정 링크를 보냈습니다. 메일함을 확인해주세요.',
  }
}
