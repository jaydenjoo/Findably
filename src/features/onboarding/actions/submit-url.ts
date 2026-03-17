'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { urlSchema } from '../schemas'
import type { OnboardingActionState } from '../types'

const CRAWL_EXECUTE_SECRET = process.env.CRAWL_EXECUTE_SECRET

/**
 * URL 제출 Server Action
 *
 * URL 입력 → Zod 검증 → diagnoses 테이블 INSERT → 크롤링+진단 트리거 → /onboarding/info 리다이렉트
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

  // 크롤링+진단 직접 실행 (fire-and-forget: redirect() 사용하므로 await 불가)
  // Layer 2+3만 실행 (~60% 데이터) — Layer 1(Playwright/n8n)은 별도 설정 시 활성화
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (baseUrl && CRAWL_EXECUTE_SECRET) {
    void fetch(`${baseUrl}/api/crawl/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': CRAWL_EXECUTE_SECRET,
      },
      body: JSON.stringify({
        diagnosisId: data.id,
        url: validated.data.url,
      }),
    }).catch((triggerError: unknown) => {
      console.error('[submitUrlAction] execute trigger failed:', triggerError)
    })
  } else {
    console.error(
      '[submitUrlAction] 환경변수 미설정: NEXT_PUBLIC_SITE_URL 또는 CRAWL_EXECUTE_SECRET'
    )
  }

  redirect(`/onboarding/info?id=${data.id}`)
}
