import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'
import { JsonLd } from '@/components/shared/JsonLd'
import { SITE_NAME } from '@/config/site'
import { SEO } from '@/config/seo'

export const metadata: Metadata = {
  title: 'AI 마케팅 진단 — SEO + GEO 통합 분석 | Findably',
  description: SEO.defaultDescription,
  alternates: { canonical: SEO.siteUrl },
}

const softwareAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SEO.siteName,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: SEO.defaultDescription,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
    description: '무료 간단 진단',
  },
}

export default function HomePage(): React.JSX.Element {
  return (
    <section className="flex flex-col items-center justify-center gap-8 px-4 py-24 text-center md:py-32">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display md:text-5xl">
        URL 하나로
        <br />
        <span className="text-primary-500">AI 마케팅 진단</span>
      </h1>
      <p className="max-w-lg text-lg text-slate-500">
        {SITE_NAME}가 SEO + GEO 통합 진단으로 마케팅 점수를 매기고, 실행
        계획까지 제시합니다.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className={buttonVariants({
            size: 'lg',
            className: 'h-11 px-6 font-semibold',
          })}
        >
          무료 진단 시작 →
        </Link>
        <Link
          href="/reports/sample"
          className={buttonVariants({
            variant: 'outline',
            size: 'lg',
            className: 'h-11 px-6 font-semibold',
          })}
        >
          샘플 리포트 보기
        </Link>
      </div>
      <JsonLd data={softwareAppJsonLd} />
    </section>
  )
}
