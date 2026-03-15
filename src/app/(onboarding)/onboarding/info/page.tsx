import type { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { InfoForm } from './_components/InfoForm'

/**
 * 선택 정보 입력 페이지 (/onboarding/info)
 *
 * F-001 흐름: 회원가입 → URL 입력 → [선택 정보] → 분석 대기
 * 타겟 키워드, 경쟁사 URL, 업종 — 모두 선택 사항
 * 건너뛰기 가능 (URL만으로도 진단 가능)
 */
export const metadata: Metadata = {
  title: '추가 정보 | Findably',
  description:
    '타겟 키워드, 경쟁사, 업종 정보를 입력하면 더 정확한 진단이 가능합니다.',
}

export default async function OnboardingInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}): Promise<React.JSX.Element> {
  const { id } = await searchParams

  if (!id) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl tracking-[-0.02em]">
            잘못된 접근입니다
          </CardTitle>
          <CardDescription>
            URL 입력 단계부터 다시 시작해주세요.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="relative shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary-500">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-xl tracking-[-0.02em]">
          추가 정보 (선택)
        </CardTitle>
        <CardDescription>
          아래 정보를 입력하면 더 정확한 진단 결과를 받을 수 있습니다.
          건너뛰어도 분석은 정상적으로 진행됩니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <InfoForm diagnosisId={id} />
      </CardContent>
    </Card>
  )
}
