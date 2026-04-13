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
    images: [
      {
        url: `/og?title=${encodeURIComponent('그린테크 마케팅 진단 리포트')}&desc=${encodeURIComponent('종합 72점 — SEO/GEO/콘텐츠 통합 분석 샘플')}`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '샘플 리포트 — 그린테크 | Findably',
    description: '그린테크 SEO + GEO 통합 진단 샘플 리포트.',
  },
}

export default function ReportsSamplePage(): React.JSX.Element {
  return <SampleReport />
}
