'use client'

import { useActionState, useState } from 'react'
import { updatePasswordAction } from '../actions/update-password'
import { updatePasswordSchema } from '../schemas'
import type { AuthActionState } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * 새 비밀번호 설정 폼
 *
 * 비밀번호 재설정 이메일 링크 → /auth/callback?type=recovery → /update-password 페이지에서 사용
 * 새 비밀번호 입력 → updatePasswordAction → supabase.auth.updateUser → /login 리다이렉트
 *
 * 이 폼이 표시되는 시점에는 recovery 세션이 이미 활성화된 상태
 */
export function UpdatePasswordForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(updatePasswordAction, {})
  const [clientError, setClientError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const formData = new FormData(e.currentTarget)
    const result = updatePasswordSchema.safeParse({
      password: formData.get('password'),
    })

    if (!result.success) {
      e.preventDefault()
      setClientError(result.error.issues[0]?.message ?? '입력값을 확인해주세요')
      return
    }

    setClientError('')
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      {state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="new-password">새 비밀번호</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          placeholder="8자 이상"
          autoComplete="new-password"
          aria-label="새 비밀번호"
          aria-describedby={clientError ? 'new-password-error' : undefined}
          disabled={isPending}
        />
        {clientError && (
          <p
            id="new-password-error"
            className="text-sm text-red-500"
            role="alert"
          >
            {clientError}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '변경 중...' : '비밀번호 변경 →'}
      </Button>
    </form>
  )
}
