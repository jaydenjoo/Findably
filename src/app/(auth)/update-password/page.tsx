import type { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UpdatePasswordForm } from '@/features/auth/components'

/**
 * 새 비밀번호 설정 페이지 (/update-password)
 *
 * 비밀번호 재설정 이메일의 링크 클릭 후 도착하는 페이지
 * 흐름: 이메일 링크 → /auth/callback?type=recovery → /update-password
 *
 * 이 시점에 recovery 세션이 이미 활성화된 상태이므로
 * UpdatePasswordForm에서 supabase.auth.updateUser()로 비밀번호 변경 가능
 */
export const metadata: Metadata = {
  title: '새 비밀번호 설정',
  description: '새 비밀번호를 설정합니다.',
}

export default function UpdatePasswordPage(): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">새 비밀번호 설정</CardTitle>
        <CardDescription>새로운 비밀번호를 입력해주세요</CardDescription>
      </CardHeader>

      <CardContent>
        <UpdatePasswordForm />
      </CardContent>
    </Card>
  )
}
