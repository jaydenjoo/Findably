'use client'

import { useActionState, useState } from 'react'
import { resetPasswordAction } from '../actions/reset-password'
import { resetPasswordSchema } from '../schemas'
import type { AuthActionState } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * 비밀번호 재설정 요청 폼
 *
 * 이메일 입력 → resetPasswordAction → 재설정 링크 이메일 발송
 * 보안: 이메일 존재 여부와 무관하게 항상 동일 메시지 표시 (NFR-6)
 *       "비밀번호 재설정 링크를 보냈습니다"
 */
export function PasswordResetRequestForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(resetPasswordAction, {})
  const [clientError, setClientError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const formData = new FormData(e.currentTarget)
    const result = resetPasswordSchema.safeParse({
      email: formData.get('email'),
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

      {state.message && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600"
        >
          {state.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reset-email">이메일</Label>
        <Input
          id="reset-email"
          name="email"
          type="email"
          placeholder="가입한 이메일 주소"
          autoComplete="email"
          aria-label="비밀번호 재설정용 이메일 주소"
          aria-describedby={clientError ? 'reset-email-error' : undefined}
          disabled={isPending}
        />
        {clientError && (
          <p
            id="reset-email-error"
            className="text-sm text-red-500"
            role="alert"
          >
            {clientError}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '발송 중...' : '재설정 링크 보내기 →'}
      </Button>
    </form>
  )
}
