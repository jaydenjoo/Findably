'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '../schemas'
import { AUTH_ERROR_GENERIC } from '../types'
import type { AuthActionState } from '../types'

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
  }

  const validated = loginSchema.safeParse(raw)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    return { error: firstIssue?.message ?? '입력값을 확인해주세요' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return { error: AUTH_ERROR_GENERIC }
  }

  // middleware에서 redirectTo 쿼리파라미터로 원래 URL 전달 시 복귀
  // 오픈 리다이렉트 방지: 상대 경로('/')만 허용
  const redirectTo = formData.get('redirectTo')?.toString() || '/dashboard'
  const safeRedirect =
    redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/dashboard'
  redirect(safeRedirect)
}
