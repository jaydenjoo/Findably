'use client'

import { useActionState } from 'react'
import { submitInfoAction } from '@/features/onboarding/actions/submit-info'
import type { OnboardingActionState } from '@/features/onboarding/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * 선택 정보 입력 폼
 *
 * 타겟 키워드, 경쟁사 URL, 업종 — 모두 선택 사항
 * 입력하면 진단 정확도 향상, 건너뛰어도 분석 가능
 * 검증은 서버 액션(submit-info)에서 일원화 (클라이언트 중복 검증 제거)
 */
export function InfoForm({
  diagnosisId,
}: {
  diagnosisId: string
}): React.JSX.Element {
  const [state, formAction, isPending] = useActionState<
    OnboardingActionState,
    FormData
  >(submitInfoAction, {})

  const errorMessage = state.error

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="diagnosisId" value={diagnosisId} />

      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600"
        >
          {errorMessage}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="target-keywords">타겟 키워드</Label>
        <Input
          id="target-keywords"
          name="targetKeywords"
          type="text"
          placeholder="SEO, 마케팅 자동화, AI 진단"
          aria-label="타겟 키워드"
          aria-describedby="keywords-hint"
          disabled={isPending}
        />
        <p id="keywords-hint" className="text-sm text-slate-500">
          쉼표로 구분해서 입력해주세요. 검색에 노출되고 싶은 키워드를
          적어주세요.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="competitor-urls">경쟁사 URL</Label>
        <Input
          id="competitor-urls"
          name="competitorUrls"
          type="text"
          placeholder="https://competitor1.com, https://competitor2.com"
          aria-label="경쟁사 URL"
          aria-describedby="competitors-hint"
          disabled={isPending}
        />
        <p id="competitors-hint" className="text-sm text-slate-500">
          쉼표로 구분해서 입력해주세요. 비교 분석에 활용됩니다.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">업종</Label>
        <Input
          id="industry"
          name="industry"
          type="text"
          placeholder="B2B SaaS, 쇼핑몰, 병원 등"
          aria-label="업종"
          aria-describedby="industry-hint"
          disabled={isPending}
        />
        <p id="industry-hint" className="text-sm text-slate-500">
          업종에 맞는 맞춤 진단을 제공합니다.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? '저장 중...' : '분석 시작 →'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isPending}
          onClick={() => {
            window.location.href = `/onboarding/analyzing?id=${diagnosisId}`
          }}
        >
          건너뛰기
        </Button>
      </div>
    </form>
  )
}
