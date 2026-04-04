import type { Metadata } from 'next'
import Navbar from '@/components/landing/navbar'
import Hero from '@/components/landing/hero-section'
import PainPoints from '@/components/landing/pain-points'
import ScorePreview from '@/components/landing/score-preview'
import FeatureTabs from '@/components/landing/features-section'
import ComparisonTable from '@/components/landing/comparison-table'
import HowItWorks from '@/components/landing/how-it-works-section'
import CustomerConcerns from '@/components/landing/customer-concerns'
import Pricing from '@/components/landing/pricing'
import BottomCTA from '@/components/landing/cta-section'
import Footer from '@/components/landing/footer'

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

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background font-satoshi selection:bg-findably-cyan/30">
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
        <BottomCTA />
      </main>
      <Footer />
    </div>
  )
}
