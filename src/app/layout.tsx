import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { TooltipProvider } from '@/components/ui/tooltip'
import { JsonLd } from '@/components/shared/JsonLd'
import { SkipLink } from '@/components/shared/SkipLink'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { GoogleAnalytics } from '@/components/shared/GoogleAnalytics'
import { SEO } from '@/config/seo'

import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SEO.siteUrl),
  title: {
    template: '%s | Findably',
    default: SEO.defaultTitle,
  },
  description: SEO.defaultDescription,
  openGraph: {
    type: 'website',
    locale: SEO.locale,
    siteName: SEO.siteName,
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    images: [
      {
        url: SEO.ogImage,
        width: SEO.ogImageWidth,
        height: SEO.ogImageHeight,
        alt: SEO.siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    images: [SEO.ogImage],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: SEO.siteUrl,
  },
  // 검색엔진 인증 — 각 env가 있을 때만 해당 항목 활성화
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    }),
    ...(process.env.NEXT_PUBLIC_NAVER_VERIFICATION && {
      other: {
        'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_VERIFICATION,
      },
    }),
  },
}

const globalJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SEO.siteUrl}/#organization`,
      name: SEO.organization.name,
      url: SEO.organization.url,
      logo: SEO.organization.logo,
      description: SEO.organization.description,
      email: SEO.organization.email,
      foundingDate: SEO.organization.foundingDate,
      ...(SEO.organization.sameAs.length > 0 && {
        sameAs: SEO.organization.sameAs,
      }),
      knowsAbout: [
        'SEO 진단',
        'GEO 최적화',
        'AI 검색 최적화',
        'Generative Engine Optimization',
        '마케팅 분석',
        'Core Web Vitals',
        '구조화 데이터',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: SEO.organization.email,
        contactType: 'customer service',
        availableLanguage: 'Korean',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SEO.siteUrl}/#website`,
      name: SEO.siteName,
      url: SEO.siteUrl,
      publisher: { '@id': `${SEO.siteUrl}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '홈',
          item: SEO.siteUrl,
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang="ko">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <SkipLink />
        <TooltipProvider>
          <ErrorBoundary>
            <div>{children}</div>
          </ErrorBoundary>
        </TooltipProvider>
        <JsonLd data={globalJsonLd} />
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
