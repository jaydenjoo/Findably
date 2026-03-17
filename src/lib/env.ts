import { z } from 'zod'

/**
 * 환경변수 검증 — 앱 시작 시 필수 환경변수 누락을 즉시 감지
 *
 * 사용법: import { env } from '@/lib/env'
 * env.NEXT_PUBLIC_SUPABASE_URL 처럼 타입 안전하게 접근
 */

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  FIRECRAWL_API_KEY: z.string().min(1).optional(),
})

export type ServerEnv = z.infer<typeof serverSchema>

export const env: ServerEnv = serverSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
})
