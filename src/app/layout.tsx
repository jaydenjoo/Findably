import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { JsonLd } from '@/components/shared/JsonLd'
import { SkipLink } from '@/components/shared/SkipLink'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
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
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: SEO.siteUrl,
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
      knowsAbout: ['SEO 진단', 'GEO 최적화', '마케팅 분석', 'AI 검색 최적화'],
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
      </body>
    </html>
  )
}
