'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { urlSchema } from '../schemas'
import type { OnboardingActionState } from '../types'

/**
 * URL 제출 Server Action
 *
 * URL 입력 → Zod 검증 → diagnoses 테이블 INSERT → /onboarding/info 리다이렉트
 * RLS: findably_diagnoses_insert_own 정책으로 본인만 INSERT 가능
 */
export async function submitUrlAction(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const raw = {
    url: formData.get('url')?.toString() ?? '',
  }

  const validated = urlSchema.safeParse(raw)
  if (!validated.success) {
    const firstIssue = validated.error.issues[0]
    return { error: firstIssue?.message ?? '입력값을 확인해주세요' }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: '로그인이 필요합니다. 다시 로그인해주세요.' }
  }

  const { data, error: insertError } = await supabase
    .from('diagnoses')
    .insert({
      user_id: user.id,
      url: validated.data.url,
      status: 'pending',
      tier: 'free',
    })
    .select('id')
    .single()

  if (insertError || !data) {
    console.error('[submitUrlAction]', insertError)
    return { error: '진단 요청에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }

  redirect(`/onboarding/info?id=${data.id}`)
}
