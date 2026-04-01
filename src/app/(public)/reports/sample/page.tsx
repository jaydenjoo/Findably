import type { Metadata } from 'next'
import { SampleReport } from './_components/SampleReport'

export const metadata: Metadata = {
  title: '샘플 리포트 — 그린테크',
  description:
    '가상 회사 그린테크의 SEO + GEO 통합 진단 리포트 샘플입니다. 종합 점수, 카테고리 분석, AI 인용 가능성, Quick Win 처방전을 확인하세요.',
  openGraph: {
    title: '샘플 리포트 — 그린테크 | Findably',
    description:
      'URL 하나로 SEO + GEO 통합 진단. 그린테크 샘플 리포트로 실제 결과를 미리 확인하세요.',
    type: 'website',
  },
}

export default function ReportsSamplePage(): React.JSX.Element {
  return <SampleReport />
}
