'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { infoSchema } from '../schemas'
import type { DiagnosisUpdateData, OnboardingActionState } from '../types'

/** 쉼표 구분 문자열 → 트림된 배열 (빈 문자열 제거) */
function parseCommaSeparated(value: string | undefined): string[] | undefined {
  if (!value) return undefined
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

/**
 * 선택 정보 제출 Server Action
 *
 * 타겟 키워드·경쟁사 URL·업종 → Zod 검증 → diagnoses UPDATE → /onboarding/analyzing 리다이렉트
 * 모든 필드 선택이므로 빈 제출도 허용 (건너뛰기와 동일)
 */
export async function submitInfoAction(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const diagnosisId = formData.get('diagnosisId')?.toString() ?? ''

  if (!diagnosisId) {
    return {
      error: '진단 정보를 찾을 수 없습니다. URL 입력부터 다시 시도해주세요.',
    }
  }

  const raw = {
    targetKeywords: formData.get('targetKeywords')?.toString() || undefined,
    competitorUrls: formData.get('competitorUrls')?.toString() || undefined,
    industry: formData.get('industry')?.toString() || undefined,
  }

  const validated = infoSchema.safeParse(raw)
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

  const targetKeywords = parseCommaSeparated(validated.data.targetKeywords)
  const competitorUrls = parseCommaSeparated(validated.data.competitorUrls)

  const updateData: DiagnosisUpdateData = {}
  if (targetKeywords?.length) updateData.target_keywords = targetKeywords
  if (competitorUrls?.length) updateData.competitor_urls = competitorUrls
  if (validated.data.industry) updateData.industry = validated.data.industry

  // 업데이트할 데이터가 있을 때만 UPDATE
  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabase
      .from('diagnoses')
      .update(updateData)
      .eq('id', diagnosisId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[submitInfoAction]', updateError)
      return { error: '정보 저장에 실패했습니다. 잠시 후 다시 시도해주세요.' }
    }
  }

  redirect(`/onboarding/analyzing?id=${diagnosisId}`)
}
