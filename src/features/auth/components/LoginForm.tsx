'use client'

import { useActionState, useState } from 'react'
import { loginAction } from '../actions/login'
import { loginSchema } from '../schemas'
import type { AuthActionState } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * 로그인 폼 컴포넌트
 *
 * 이메일+비밀번호 입력 → Zod 클라이언트 검증 → loginAction 서버 호출
 * 성공 시 /dashboard (또는 redirectTo 경로)로 리다이렉트
 *
 * 보안: 에러 메시지 통일 (NFR-6, 계정 존재 여부 노출 방지)
 *       redirectTo는 상대 경로('/')만 허용 (오픈 리다이렉트 방지)
 */
interface LoginFormProps {
  /** middleware가 설정한 원래 접근 URL. 로그인 후 복귀용 */
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps): React.JSX.Element {
  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(loginAction, {})
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    const formData = new FormData(e.currentTarget)
    const result = loginSchema.safeParse({
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
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      {state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-email">이메일</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          aria-label="이메일 주소"
          aria-describedby={
            clientErrors.email ? 'login-email-error' : undefined
          }
          disabled={isPending}
        />
        {clientErrors.email && (
          <p
            id="login-email-error"
            className="text-sm text-danger-500"
            role="alert"
          >
            {clientErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">비밀번호</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-label="비밀번호"
          aria-describedby={
            clientErrors.password ? 'login-password-error' : undefined
          }
          disabled={isPending}
        />
        {clientErrors.password && (
          <p
            id="login-password-error"
            className="text-sm text-danger-500"
            role="alert"
          >
            {clientErrors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인 →'}
      </Button>
    </form>
  )
}
