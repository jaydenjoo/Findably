'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { triggerCrawl } from '@/lib/adapters/crawler'
import { urlSchema } from '../schemas'
import type { OnboardingActionState } from '../types'
import { resolveWithWwwFallback } from '../utils/dns-resolve'

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

  // DNS 해석 + www 폴백 (apex 도메인에 A 레코드 없는 케이스 대응)
  // 예: monthlycheck.kr → A 레코드 없음, www.monthlycheck.kr만 존재
  const dnsResult = await resolveWithWwwFallback(validated.data.url)
  if (!dnsResult) {
    return {
      error:
        '도메인을 찾을 수 없습니다. URL을 다시 확인해주세요. (DNS 해석 실패)',
    }
  }

  const finalUrl = dnsResult.url
  const usedWwwFallback = dnsResult.fallback === 'www'

  const { data, error: insertError } = await supabase
    .from('diagnoses')
    .insert({
      user_id: user.id,
      url: finalUrl,
      status: 'pending',
      tier: 'free',
    })
    .select('id')
    .single()

  if (insertError || !data) {
    console.error('[submitUrlAction]', insertError)
    return { error: '진단 요청에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }

  // n8n 웹훅으로 크롤링 트리거 (await — Vercel 서버리스에서 void fire-and-forget 불가)
  // n8n v2: 10 노드 병렬 크롤링 → /api/crawl/complete 콜백 → 진단 엔진
  // n8n 미설정 시 폴백: /api/crawl/execute (Layer 2+3, ~60% 데이터)
  try {
    const triggerResult = await triggerCrawl({
      diagnosisId: data.id,
      url: finalUrl,
      userId: user.id,
    })

    if (triggerResult.success) {
      // n8n 트리거 성공 → status를 crawling으로 업데이트
      await supabase
        .from('diagnoses')
        .update({ status: 'crawling' })
        .eq('id', data.id)
    } else {
      // n8n 미설정 또는 실패 → /api/crawl/execute 폴백
      console.warn('[submitUrlAction] n8n 실패, 폴백:', triggerResult.error)
      if (CRAWL_EXECUTE_SECRET) {
        const headersList = await headers()
        const host = headersList.get('host') ?? 'localhost:3600'
        const proto = headersList.get('x-forwarded-proto') ?? 'http'
        const fallbackBaseUrl = `${proto}://${host}`

        await fetch(`${fallbackBaseUrl}/api/crawl/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': CRAWL_EXECUTE_SECRET,
          },
          body: JSON.stringify({
            diagnosisId: data.id,
            url: finalUrl,
          }),
        })
      } else {
        console.error(
          '[submitUrlAction] 폴백 불가: CRAWL_EXECUTE_SECRET 미설정'
        )
      }
    }
  } catch (triggerError: unknown) {
    console.error('[submitUrlAction] 크롤링 트리거 실패:', triggerError)
  }

  const redirectParams = new URLSearchParams({ id: data.id })
  if (usedWwwFallback) {
    redirectParams.set('wwwFallback', '1')
  }
  // Phase D (2026-04-09): /info로 리다이렉트 (업종 선택 + 선택 정보 입력).
  // 크롤링은 위에서 이미 백그라운드 트리거됨. /info에서 사용자가 업종 선택 후
  // "분석 시작"을 누르면 /analyzing으로 이동. "건너뛰기"도 동일하게 /analyzing.
  redirect(`/onboarding/info?${redirectParams.toString()}`)
}
