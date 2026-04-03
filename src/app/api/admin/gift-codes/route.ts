import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse } from '@/lib/api/response'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ACCESS } from '@/config/access-control'

/**
 * POST /api/admin/gift-codes
 *
 * 선물 코드 생성 (admin 전용)
 */

const createSchema = z.object({
  code: z.string().min(1).max(50),
  maxUses: z.number().int().min(1).max(1000).default(1),
  expiresInDays: z.number().int().min(1).max(365).default(30),
  description: z.string().max(200).default(''),
})

export async function POST(request: NextRequest): Promise<Response> {
  // admin 인증
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !ACCESS.ADMIN_EMAILS.includes(user.email ?? '')) {
    return errorResponse('관리자 권한이 필요합니다', 403)
  }

  // 페이로드 검증
  let body: z.infer<typeof createSchema>
  try {
    const raw = (await request.json()) as Record<string, unknown>
    body = createSchema.parse(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : '잘못된 요청'
    return errorResponse(message, 400)
  }

  const admin = createAdminClient()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + body.expiresInDays)

  // 코드 중복 확인
  const { data: existing } = await admin
    .from('gift_codes')
    .select('id')
    .eq('code', body.code.toUpperCase())
    .maybeSingle()

  if (existing) {
    return errorResponse('이미 존재하는 코드입니다', 400)
  }

  // 생성
  const { error: insertError } = await admin.from('gift_codes').insert({
    code: body.code.toUpperCase(),
    max_uses: body.maxUses,
    expires_at: expiresAt.toISOString(),
    description: body.description || null,
    is_active: true,
  })

  if (insertError) {
    console.error('[admin/gift-codes] 생성 실패:', insertError)
    return errorResponse('코드 생성에 실패했습니다', 500)
  }

  return successResponse({ code: body.code.toUpperCase(), created: true })
}
