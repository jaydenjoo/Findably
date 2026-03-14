import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button-variants'
/**
 * 이메일 인증 안내 페이지 (/signup/confirm)
 *
 * 이메일 회원가입 성공 후 리다이렉트되는 안내 페이지
 * "메일함에서 인증 링크를 클릭해주세요" 안내
 *
 * 이 페이지는 정적 (Server Component, 폼 없음)
 */
export const metadata: Metadata = {
  title: '이메일 확인 | Findably',
  description: '가입 인증 이메일을 확인해주세요.',
}

export default function SignupConfirmPage(): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">이메일을 확인해주세요</CardTitle>
        <CardDescription>가입이 거의 완료되었습니다</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 text-center">
        {/* 메일 아이콘 */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-primary"
            aria-hidden="true"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-foreground">
            입력하신 이메일 주소로 인증 링크를 보냈습니다.
          </p>
          <p className="text-sm text-muted-foreground">
            메일함에서 인증 링크를 클릭하면 가입이 완료됩니다. 메일이 보이지
            않으면 스팸 폴더도 확인해주세요.
          </p>
        </div>

        <Link
          href="/login"
          className={buttonVariants({
            variant: 'outline',
            className: 'w-full',
          })}
        >
          로그인으로 돌아가기 →
        </Link>
      </CardContent>
    </Card>
  )
}
