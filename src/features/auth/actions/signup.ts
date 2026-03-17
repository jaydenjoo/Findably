'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { signupSchema } from '../schemas'
import { AUTH_ERROR_GENERIC } from '../types'
import type { AuthActionState } from '../types'

export async function signupAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
  }

  const validated = signupSchema.safeParse(raw)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    return { error: firstIssue?.message ?? '입력값을 확인해주세요' }
  }

  const headersList = await headers()
  const origin =
    headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error(
      '[signupAction] Supabase error:',
      error.message,
      error.status,
      error.code
    )
    return { error: AUTH_ERROR_GENERIC }
  }

  redirect('/signup/confirm')
}
