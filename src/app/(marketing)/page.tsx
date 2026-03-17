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
  title: 'Findably — AI 마케팅 진단, URL 하나로 시작',
  description:
    'URL만 입력하면 AI가 SEO + GEO 통합 진단. 60개+ 항목 자동 분석, 비즈니스 영향도 기반 실행 계획까지. 무료로 시작하세요.',
  openGraph: {
    title: 'Findably — AI 마케팅 진단, URL 하나로 시작',
    description:
      'URL만 입력하면 AI가 SEO + GEO 통합 진단. 60개+ 항목 자동 분석, 비즈니스 영향도 기반 실행 계획까지.',
    type: 'website',
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
