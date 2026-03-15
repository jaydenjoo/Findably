import type { Metadata } from 'next'
import { DashboardContent } from './_components/DashboardContent'
import { MOCK_OVERALL_SCORE, MOCK_AI_CITATION } from './_data/mock'

export const metadata: Metadata = {
  title: '대시보드 | Findably',
  description: 'SEO + GEO 종합 마케팅 진단 결과를 확인하세요.',
}

export default function DashboardPage(): React.JSX.Element {
  return (
    <DashboardContent
      overallScore={MOCK_OVERALL_SCORE}
      citation={MOCK_AI_CITATION}
    />
  )
}
