'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase 클라이언트 팩토리
 * - Client Components에서 사용
 * - document.cookie 자동 연동
 * - 싱글턴 패턴: 여러 번 호출해도 동일 인스턴스 반환
 */
export function createClient(): ReturnType<typeof createBrowserClient> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
