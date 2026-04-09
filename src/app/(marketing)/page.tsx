import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { JsonLd } from '@/components/shared/JsonLd'
import { LANDING } from '@/config/landing'
import { SEO } from '@/config/seo'
import { getMaintenanceNotice } from '@/features/admin/maintenance/queries/get-maintenance-notice'

// 첫 화면 (즉시 로드)
import Navbar from '@/components/landing/navbar'
import Hero from '@/components/landing/hero-section'
import MaintenanceNotice from '@/components/landing/maintenance-notice'

// 비첫화면 (lazy load — LCP 개선)
const PainPoints = dynamic(() => import('@/components/landing/pain-points'))
const ScorePreview = dynamic(() => import('@/components/landing/score-preview'))
const FeatureTabs = dynamic(
  () => import('@/components/landing/features-section')
)
const ComparisonTable = dynamic(
  () => import('@/components/landing/comparison-table')
)
const HowItWorks = dynamic(
  () => import('@/components/landing/how-it-works-section')
)
const CustomerConcerns = dynamic(
  () => import('@/components/landing/customer-concerns')
)
const Pricing = dynamic(() => import('@/components/landing/pricing'))
const FaqSection = dynamic(() => import('@/components/landing/faq-section'))
const BottomCTA = dynamic(() => import('@/components/landing/cta-section'))
const Footer = dynamic(() => import('@/components/landing/footer'))

// 점검 공지(admin에서 수정)가 즉시 반영되도록 dynamic rendering.
// DB 조회 자체는 unstable_cache + revalidateTag('max')로 부담 최소화.
export const revalidate = 0

export const metadata: Metadata = {
  title: '마케팅에 돈 쓰는데, 어디서 새고 있는지 모르겠다면 | Findably',
  description:
    '웹사이트에서 새는 마케팅 비용부터 찾아드립니다. SEO, AI 검색(GEO) 통합 진단. 60개 항목 자동 분석, 가장 돈이 많이 새는 곳부터 고치는 순서를 알려드립니다.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '마케팅에 돈 쓰는데, 어디서 새고 있는지 모르겠다면 | Findably',
    description:
      '웹사이트에서 새는 마케팅 비용부터 찾아드립니다. SEO, AI 검색(GEO) 통합 진단.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '마케팅에 돈 쓰는데, 어디서 새고 있는지 모르겠다면 | Findably',
    description:
      '웹사이트에서 새는 마케팅 비용부터 찾아드립니다. SEO, AI 검색(GEO) 통합 진단.',
  },
}

const landingJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${SEO.siteUrl}/#application`,
      name: 'Findably AI 마케팅 진단',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      provider: { '@id': `${SEO.siteUrl}/#organization` },
      description: 'URL 하나로 SEO+GEO 통합 진단, 60개+ 항목 자동 분석',
      offers: [
        {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'KRW',
          name: '무료 진단',
        },
        {
          '@type': 'Offer',
          price: '99000',
          priceCurrency: 'KRW',
          name: '상세 분석',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${SEO.siteUrl}/#faq`,
      mainEntity: LANDING.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    },
  ],
}

export default async function MarketingPage() {
  const maintenanceNotice = await getMaintenanceNotice()

  return (
    <div className="min-h-screen bg-background font-satoshi selection:bg-findably-cyan/30">
      <JsonLd data={landingJsonLd} />
      <MaintenanceNotice notice={maintenanceNotice} />
      <header>
        <Navbar />
      </header>
      <main id="main-content">
        <Hero />
        <PainPoints />
        <ScorePreview />
        <FeatureTabs />
        <ComparisonTable />
        <HowItWorks />
        <CustomerConcerns />
        <Pricing />
        <FaqSection />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  )
}
