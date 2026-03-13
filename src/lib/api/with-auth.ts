import { type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { errorResponse } from './response'

/**
 * API Route 인증 래퍼
 * 모든 보호 API Route에서 사용하는 인증 검증 함수
 *
 * 사용 예시:
 * export async function GET(request: NextRequest) {
 *   return withAuth(request, async (user) => {
 *     return successResponse({ userId: user.id })
 *   })
 * }
 */
export async function withAuth(
  _request: NextRequest,
  handler: (user: User) => Promise<Response>
): Promise<Response> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return errorResponse('인증이 필요합니다', 401)
  }

  return handler(user)
}
