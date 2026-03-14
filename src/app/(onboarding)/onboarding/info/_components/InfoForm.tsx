'use client'

import { useActionState, useState } from 'react'
import { submitInfoAction } from '@/features/onboarding/actions/submit-info'
import { infoSchema } from '@/features/onboarding/schemas'
import type { OnboardingActionState } from '@/features/onboarding/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * 선택 정보 입력 폼
 *
 * 타겟 키워드, 경쟁사 URL, 업종 — 모두 선택 사항
 * 입력하면 진단 정확도 향상, 건너뛰어도 분석 가능
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
  const [clientError, setClientError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const formData = new FormData(e.currentTarget)
    const result = infoSchema.safeParse({
      targetKeywords: formData.get('targetKeywords') || undefined,
      competitorUrls: formData.get('competitorUrls') || undefined,
      industry: formData.get('industry') || undefined,
    })

    if (!result.success) {
      e.preventDefault()
      setClientError(result.error.issues[0]?.message ?? '입력값을 확인해주세요')
      return
    }

    setClientError('')
  }

  const errorMessage = clientError || state.error

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
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
            window.location.href = '/onboarding/analyzing'
          }}
        >
          건너뛰기
        </Button>
      </div>
    </form>
  )
}
