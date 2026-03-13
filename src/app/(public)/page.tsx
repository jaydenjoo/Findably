import type { Metadata } from 'next'
import { JsonLd } from '@/components/shared/JsonLd'
import { LANDING_JSON_LD, SEO } from '@/config/seo'
import { Hero } from './_components/Hero'
import { ProblemSection } from './_components/ProblemSection'
import { HowItWorks } from './_components/HowItWorks'
import { Features } from './_components/Features'
import { SamplePreview } from './_components/SamplePreview'
import { Pricing } from './_components/Pricing'
import { FinalCTA } from './_components/FinalCTA'

export const metadata: Metadata = {
  title: SEO.landing.title,
  description: SEO.landing.description,
  alternates: { canonical: SEO.siteUrl },
  openGraph: {
    title: SEO.landing.title,
    description: SEO.landing.description,
    url: SEO.siteUrl,
    siteName: SEO.siteName,
    images: [
      {
        url: SEO.landing.ogImage,
        width: SEO.ogImageWidth,
        height: SEO.ogImageHeight,
        alt: SEO.landing.title,
      },
    ],
    locale: SEO.locale,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.landing.title,
    description: SEO.landing.description,
    images: [SEO.landing.ogImage],
  },
}

export default function HomePage(): React.JSX.Element {
  return (
    <>
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <SamplePreview />
      <Pricing />
      <FinalCTA />
      <JsonLd data={LANDING_JSON_LD} />
    </>
  )
}
