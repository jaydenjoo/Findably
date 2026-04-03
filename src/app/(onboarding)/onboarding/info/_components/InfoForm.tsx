'use client'

import { useActionState, useRef, useState } from 'react'
import { submitInfoAction } from '@/features/onboarding/actions/submit-info'
import type { OnboardingActionState } from '@/features/onboarding/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FIELD_LABELS: Record<string, string> = {
  targetKeywords: '타겟 키워드',
  industry: '업종',
}

/**
 * 선택 정보 입력 폼
 *
 * 타겟 키워드, 경쟁사 URL, 업종 — 모두 선택 사항
 * 입력하면 진단 정확도 향상, 건너뛰어도 분석 가능
 * 미입력 항목이 있으면 면책 고지 후 확인받고 진행
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

  const formRef = useRef<HTMLFormElement>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [pendingAction, setPendingAction] = useState<'skip' | 'submit' | null>(
    null
  )

  const errorMessage = state.error

  /** 폼에서 비어있는 필드 이름 목록 반환 */
  function getMissingFields(): string[] {
    if (!formRef.current) return Object.values(FIELD_LABELS)
    const formData = new FormData(formRef.current)
    const missing: string[] = []
    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      const value = formData.get(key)
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missing.push(label)
      }
    }
    return missing
  }

  function handleSkipClick(): void {
    const missing = getMissingFields()
    if (missing.length > 0) {
      setMissingFields(missing)
      setPendingAction('skip')
      setShowDisclaimer(true)
    } else {
      window.location.href = `/onboarding/analyzing?id=${diagnosisId}`
    }
  }

  function handleSubmitClick(): void {
    const missing = getMissingFields()
    if (missing.length > 0) {
      setMissingFields(missing)
      setPendingAction('submit')
      setShowDisclaimer(true)
    } else {
      formRef.current?.requestSubmit()
    }
  }

  function handleConfirmProceed(): void {
    setShowDisclaimer(false)
    if (pendingAction === 'skip') {
      window.location.href = `/onboarding/analyzing?id=${diagnosisId}`
    } else if (pendingAction === 'submit') {
      formRef.current?.requestSubmit()
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
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

      {/* 미입력 항목 면책 고지 */}
      {showDisclaimer && (
        <div
          className="rounded-lg border border-warning-200 bg-warning-50 p-4"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-warning-700 mb-2">
            아래 정보가 입력되지 않았습니다
          </p>
          <ul className="list-disc list-inside text-sm text-warning-600 mb-3 space-y-0.5">
            {missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            입력하지 않은 정보가 있으면 해당 항목의 분석이 제한되어 리포트의
            정확도가 낮아질 수 있습니다. 그래도 진행하시겠습니까?
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmProceed}
              disabled={isPending}
            >
              {isPending ? '처리 중...' : '계속 진행 →'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDisclaimer(false)}
              disabled={isPending}
            >
              돌아가서 입력하기
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button
          type="button"
          className="flex-1 cursor-pointer"
          disabled={isPending}
          onClick={handleSubmitClick}
        >
          {isPending ? '저장 중...' : '분석 시작 →'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 cursor-pointer"
          disabled={isPending}
          onClick={handleSkipClick}
        >
          건너뛰기
        </Button>
      </div>
    </form>
  )
}
