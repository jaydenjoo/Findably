'use client'

import { useActionState, useState } from 'react'
import { submitUrlAction } from '@/features/onboarding/actions/submit-url'
import { urlSchema } from '@/features/onboarding/schemas'
import type { OnboardingActionState } from '@/features/onboarding/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * URL 입력 폼
 *
 * 진단할 웹사이트 URL을 입력받아 submitUrlAction으로 제출
 * 클라이언트 검증(safeParse) + 서버 검증(Action) 이중 구조
 */
export function UrlForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState<
    OnboardingActionState,
    FormData
  >(submitUrlAction, {})
  const [clientError, setClientError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const formData = new FormData(e.currentTarget)
    const result = urlSchema.safeParse({
      url: formData.get('url'),
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
        <Label htmlFor="diagnosis-url">웹사이트 URL</Label>
        <Input
          id="diagnosis-url"
          name="url"
          type="url"
          placeholder="https://example.com"
          autoComplete="url"
          aria-label="진단할 웹사이트 URL"
          aria-describedby={errorMessage ? 'url-error' : 'url-hint'}
          disabled={isPending}
        />
        {errorMessage ? (
          <p id="url-error" className="text-sm text-danger-500" role="alert">
            {errorMessage}
          </p>
        ) : (
          <p id="url-hint" className="text-sm text-slate-500">
            분석할 웹사이트의 전체 주소를 입력해주세요.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '확인 중...' : '다음 단계 →'}
      </Button>
    </form>
  )
}
