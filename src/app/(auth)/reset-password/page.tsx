import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PasswordResetRequestForm } from '@/features/auth/components'

/**
 * 비밀번호 재설정 요청 페이지 (/reset-password)
 *
 * 이메일 입력 → 재설정 링크 발송
 * 보안: 이메일 존재 여부와 무관하게 항상 "링크를 보냈습니다" 표시 (NFR-6)
 */
export const metadata: Metadata = {
  title: '비밀번호 재설정 | Findably',
  description: '비밀번호를 재설정합니다.',
}

export default function ResetPasswordPage(): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">비밀번호 재설정</CardTitle>
        <CardDescription>
          가입한 이메일 주소를 입력하시면 재설정 링크를 보내드립니다
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <PasswordResetRequestForm />

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
