import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Service Role Supabase 클라이언트
 *
 * RLS를 우회하여 서버 전용 뮤테이션(UPDATE, DELETE)을 수행.
 * - diagnoses 테이블에 UPDATE RLS 정책이 없으므로 crawl_data 저장 시 필수
 * - 웹훅 핸들러, 백그라운드 작업 등 서버 전용 코드에서만 사용
 *
 * ⚠ 절대 클라이언트 코드에서 import 금지
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      '[createAdminClient] NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 미설정'
    )
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
