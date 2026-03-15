import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm, GoogleAuthButton } from '@/features/auth/components'

/**
 * 로그인 페이지 (/login)
 *
 * 구성: Google 간편 로그인 + 구분선 + 이메일/비밀번호 폼
 *
 * middleware가 비로그인 사용자를 /login?redirectTo=/dashboard 로 보내면,
 * searchParams.redirectTo를 LoginForm에 전달 → 로그인 후 원래 페이지로 복귀
 */
export const metadata: Metadata = {
  title: '로그인 | Findably',
  description: 'Findably에 로그인하여 AI 마케팅 진단을 시작하세요.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}): Promise<React.JSX.Element> {
  const { redirectTo } = await searchParams

  return (
    <Card className="relative shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary-500">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-xl tracking-[-0.02em]">
          로그인
        </CardTitle>
        <CardDescription>Findably에 오신 것을 환영합니다</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google 간편 로그인 */}
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

        {/* 이메일/비밀번호 로그인 */}
        <LoginForm redirectTo={redirectTo} />

        {/* 하단 링크 */}
        <div className="space-y-2 text-center text-sm">
          <Link
            href="/reset-password"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
          <p className="text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link
              href="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              가입하기
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
