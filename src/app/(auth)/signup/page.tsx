import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SignupForm, GoogleAuthButton } from '@/features/auth/components'

/**
 * 회원가입 페이지 (/signup)
 *
 * 구성: Google 간편 가입 + 구분선 + 이메일/비밀번호 폼
 *
 * 가입 성공 → signupAction이 /signup/confirm으로 리다이렉트
 * Google 가입 → OAuth 완료 후 /auth/callback → /onboarding/url
 */
export const metadata: Metadata = {
  title: '회원가입 | Findably',
  description: 'Findably에 가입하여 무료 AI 마케팅 진단을 받아보세요.',
}

export default function SignupPage(): React.JSX.Element {
  return (
    <Card className="relative shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary-500">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-xl tracking-[-0.02em]">
          회원가입
        </CardTitle>
        <CardDescription>
          URL 하나로 AI 마케팅 진단을 시작하세요
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google 간편 가입 */}
        <GoogleAuthButton />

        {/* 구분선 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        {/* 이메일/비밀번호 가입 */}
        <SignupForm />

        {/* 하단 링크 */}
        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
