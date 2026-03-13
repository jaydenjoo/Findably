import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase 클라이언트 팩토리
 * - Server Components, Server Actions, Route Handlers에서 사용
 * - 쿠키 기반 세션 관리 (getAll/setAll 패턴)
 * - Server Components에서는 쿠키 쓰기 불가 → try-catch로 안전 처리
 */
export async function createClient(): Promise<
  ReturnType<typeof createServerClient>
> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출 시 쿠키 쓰기 불가 — 무시 가능
            // Middleware에서 세션 갱신(proxy refresh)이 이를 보완함
          }
        },
      },
    }
  )
}
