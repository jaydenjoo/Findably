import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth Callback Route Handler
 *
 * Supabase Auth가 리다이렉트하는 3가지 케이스를 처리:
 * 1. OAuth code 교환 (Google 로그인 등) — ?code=...
 * 2. 이메일 인증 (verifyOtp) — ?token_hash=...&type=email
 * 3. 비밀번호 재설정 — ?token_hash=...&type=recovery 또는 ?code=...&type=recovery
 *
 * 에러 시 /login?error=... 로 리다이렉트
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createClient()

  // Case 1: code 파라미터가 있는 경우 (OAuth 또는 PKCE flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('인증에 실패했습니다. 다시 시도해주세요.')}`
      )
    }

    // recovery type이면 비밀번호 변경 페이지로
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/update-password`)
    }

    // 신규/기존 사용자 분기: profiles에 display_name이 있으면 기존 사용자
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      // 프로필이 있고 display_name이 이메일이 아니면 → 기존 사용자 (대시보드)
      // 트리거가 자동 생성하므로 profile은 항상 존재하나, display_name이 이메일과 같으면 신규
      const isNewUser =
        !profile || !profile.display_name || profile.display_name === user.email

      if (isNewUser) {
        return NextResponse.redirect(`${origin}/onboarding/url`)
      }
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Case 2: token_hash 파라미터가 있는 경우 (이메일 인증 또는 recovery)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'email' | 'recovery' | 'signup',
    })

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('인증 링크가 만료되었거나 유효하지 않습니다.')}`
      )
    }

    // recovery면 비밀번호 변경 페이지로
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/update-password`)
    }

    // 이메일 인증 완료 → 온보딩으로
    return NextResponse.redirect(`${origin}/onboarding/url`)
  }

  // 파라미터가 없는 경우 → 에러
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('잘못된 인증 요청입니다.')}`
  )
}
