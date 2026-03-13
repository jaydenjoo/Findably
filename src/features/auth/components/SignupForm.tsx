'use client'

import { useActionState, useState } from 'react'
import { signupAction } from '../actions/signup'
import { signupSchema } from '../schemas'
import type { AuthActionState } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * 회원가입 폼 컴포넌트
 *
 * 이메일+비밀번호 입력 → Zod 클라이언트 검증 → signupAction 서버 호출
 * 성공 시 /signup/confirm (이메일 인증 안내) 페이지로 리다이렉트
 */
export function SignupForm(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(signupAction, {})
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const formData = new FormData(e.currentTarget)
    const result = signupSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!result.success) {
      e.preventDefault()
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString()
        if (field && !errors[field]) {
          errors[field] = issue.message
        }
      })
      setClientErrors(errors)
      return
    }

    setClientErrors({})
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
        <Label htmlFor="signup-email">이메일</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          aria-label="이메일 주소"
          aria-describedby={
            clientErrors.email ? 'signup-email-error' : undefined
          }
          disabled={isPending}
        />
        {clientErrors.email && (
          <p
            id="signup-email-error"
            className="text-sm text-red-500"
            role="alert"
          >
            {clientErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">비밀번호</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          placeholder="8자 이상"
          autoComplete="new-password"
          aria-label="비밀번호"
          aria-describedby={
            clientErrors.password ? 'signup-password-error' : undefined
          }
          disabled={isPending}
        />
        {clientErrors.password && (
          <p
            id="signup-password-error"
            className="text-sm text-red-500"
            role="alert"
          >
            {clientErrors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '처리 중...' : '가입하기 →'}
      </Button>
    </form>
  )
}
