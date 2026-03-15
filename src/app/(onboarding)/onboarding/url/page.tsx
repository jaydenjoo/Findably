import type { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UrlForm } from './_components/UrlForm'

/**
 * URL 입력 페이지 (/onboarding/url)
 *
 * F-001 핵심 흐름: 회원가입 → [URL 입력] → 선택 정보 → 분석 대기
 * 진단할 웹사이트 URL 1개를 입력받아 diagnoses 테이블에 저장
 */
export const metadata: Metadata = {
  title: 'URL 입력 | Findably',
  description: '진단할 웹사이트 URL을 입력해주세요.',
}

export default function OnboardingUrlPage(): React.JSX.Element {
  return (
    <Card className="relative shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary-500">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-xl tracking-[-0.02em]">
          진단할 URL을 입력하세요
        </CardTitle>
        <CardDescription>
          분석할 웹사이트 주소를 입력하면 SEO + AI 검색 통합 진단을 시작합니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <UrlForm />
      </CardContent>
    </Card>
  )
}
