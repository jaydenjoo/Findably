import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { successResponse, errorResponse } from '@/lib/api/response'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/payment/redeem-code
 *
 * 선물 코드 검증 + 유료 진단 레코드 생성
 * 유효한 코드 → createPayment과 동일하게 유료 레코드 생성
 */

const redeemSchema = z.object({
  code: z.string().min(1, '코드를 입력해주세요').max(50),
  diagnosisId: z.string().uuid('잘못된 진단 ID입니다'),
})

export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (user) => {
    // 1. 페이로드 검증
    let body: z.infer<typeof redeemSchema>
    try {
      const raw = (await request.json()) as Record<string, unknown>
      body = redeemSchema.parse(raw)
    } catch (error) {
      const message = error instanceof Error ? error.message : '잘못된 요청'
      return errorResponse(message, 400)
    }

    const supabase = createAdminClient()
    const codeUpper = body.code.trim().toUpperCase()

    // 2. 코드 조회 + 유효성 검증
    const { data: giftCode, error: codeError } = await supabase
      .from('gift_codes')
      .select('*')
      .eq('code', codeUpper)
      .eq('is_active', true)
      .single()

    if (codeError || !giftCode) {
      return errorResponse('유효하지 않은 코드입니다', 400)
    }

    // 만료 확인
    if (
      giftCode.expires_at &&
      new Date(giftCode.expires_at as string) < new Date()
    ) {
      return errorResponse('만료된 코드입니다', 400)
    }

    // 사용 횟수 초과 확인
    if ((giftCode.used_count as number) >= (giftCode.max_uses as number)) {
      return errorResponse('사용 횟수를 초과한 코드입니다', 400)
    }

    // 3. 중복 사용 확인 (같은 유저가 같은 코드)
    const { data: existingUse } = await supabase
      .from('gift_code_uses')
      .select('id')
      .eq('gift_code_id', giftCode.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingUse) {
      return errorResponse('이미 사용한 코드입니다', 400)
    }

    // 4. 무료 진단 조회 + 소유권 확인
    const { data: freeDiag, error: diagError } = await supabase
      .from('diagnoses')
      .select(
        'id, user_id, tier, url, crawl_data, analysis_data, total_score, grade, target_keywords, competitor_urls, industry'
      )
      .eq('id', body.diagnosisId)
      .eq('user_id', user.id)
      .single()

    if (diagError || !freeDiag) {
      return errorResponse('진단을 찾을 수 없습니다', 400)
    }

    if (freeDiag.tier === 'paid') {
      return errorResponse('이미 유료 분석이 완료된 진단입니다', 400)
    }

    // 5. 유료 진단 레코드 생성 (createPayment과 동일 로직)
    const { data: paidDiag, error: createError } = await supabase
      .from('diagnoses')
      .insert({
        user_id: user.id,
        url: freeDiag.url,
        status: 'analyzing',
        tier: 'paid',
        crawl_data: freeDiag.crawl_data,
        analysis_data: freeDiag.analysis_data,
        total_score: freeDiag.total_score,
        grade: freeDiag.grade,
        target_keywords: freeDiag.target_keywords,
        competitor_urls: freeDiag.competitor_urls,
        industry: freeDiag.industry,
      })
      .select('id')
      .single()

    if (createError || !paidDiag) {
      console.error('[redeem-code] 유료 레코드 생성 실패:', createError)
      return errorResponse('유료 분석 생성에 실패했습니다', 500)
    }

    // 6. 코드 사용 기록 + used_count 증가
    await supabase.from('gift_code_uses').insert({
      gift_code_id: giftCode.id,
      user_id: user.id,
      diagnosis_id: paidDiag.id,
    })

    await supabase
      .from('gift_codes')
      .update({ used_count: (giftCode.used_count as number) + 1 })
      .eq('id', giftCode.id)

    return successResponse({
      diagnosisId: paidDiag.id,
      code: codeUpper,
      message: '선물 코드가 적용되었습니다',
    })
  })
}
