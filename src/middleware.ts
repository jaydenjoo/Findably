import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Middleware — 모든 페이지 요청 전에 실행되는 "경비원"
 *
 * 역할 3가지:
 * 1. 세션 갱신: 매 요청마다 로그인 상태(쿠키)를 자동 연장
 * 2. 보호 라우트 차단: 비로그인 사용자가 /dashboard 등에 접근 → /login으로 보냄
 * 3. 인증 라우트 리다이렉트: 이미 로그인한 사용자가 /login에 가면 → /dashboard로 보냄
 *
 * @supabase/ssr 공식 패턴: middleware 전용 클라이언트 (request/response 쿠키 핸들링)
 */

// ─── 라우트 분류 ───

/** 비로그인 사용자가 접근 불가한 보호 라우트 */
const PROTECTED_PATHS = [
  '/dashboard',
  '/onboarding',
  '/diagnosis',
  '/reports/my',
  '/actions',
  '/settings',
]

/** 이미 로그인한 사용자를 /dashboard로 보내는 인증 라우트 */
const AUTH_PATHS = ['/login', '/signup', '/reset-password', '/update-password']

/**
 * 요청 경로가 보호 라우트에 해당하는지 확인
 * /dashboard, /onboarding/url, /diagnosis/seo 등 하위 경로도 포함
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

/** 요청 경로가 인증 라우트에 해당하는지 확인 */
function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // 1. middleware 전용 Supabase 클라이언트 생성 (request/response 쿠키 핸들링)
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // request 쿠키에 먼저 반영 (후속 처리를 위해)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // response 재생성 (갱신된 request 쿠키 포함)
          supabaseResponse = NextResponse.next({ request })
          // response 쿠키에도 반영 (브라우저에 전달)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. 세션 갱신 — getUser()가 쿠키를 자동 갱신 (getSession보다 안전)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 3. 보호 라우트: 비로그인 → /login?redirectTo=원래URL
  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 4. 인증 라우트: 이미 로그인 → /dashboard
  if (user && isAuthPath(pathname)) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

// ─── Matcher 설정 ───
// 정적 파일, 이미지, favicon은 middleware 실행 제외 (성능 최적화)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
