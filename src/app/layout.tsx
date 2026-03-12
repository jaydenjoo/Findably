import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { SentryProvider } from "@/components/sentry-provider";
import { PostHogProviderComponent } from "@/components/posthog-provider";
import {
  APP_NAME,
  APP_URL,
  APP_DESCRIPTION,
  APP_TAGLINE,
  DEFAULT_METADATA,
  DEFAULT_OG_METADATA,
  DEFAULT_TWITTER_METADATA,
} from "@/constants/app";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: DEFAULT_METADATA.title,
  description: DEFAULT_METADATA.description,
  keywords: DEFAULT_METADATA.keywords,
  openGraph: {
    title: DEFAULT_OG_METADATA.title,
    description: DEFAULT_OG_METADATA.description,
    type: DEFAULT_OG_METADATA.type as "website",
    locale: DEFAULT_OG_METADATA.locale,
    url: APP_URL,
  },
  twitter: {
    card: DEFAULT_TWITTER_METADATA.card as "summary_large_image",
    title: DEFAULT_TWITTER_METADATA.title,
    description: DEFAULT_TWITTER_METADATA.description,
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Preload critical resources for performance */}
        <link
          rel="preconnect"
          href="https://<NEXT_PUBLIC_SUPABASE_URL>"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://cdn.posthog.com" />
        <link
          rel="dns-prefetch"
          href="https://o<SENTRY_ORG_ID>.ingest.sentry.io"
        />

        {/* Performance: Enable faster page transitions */}
        <link rel="prefetch" href="/" />
      </head>
      <body
        className={`${dmSans.variable} ${geistMono.variable} antialiased font-sans bg-gradient-to-b from-[#fafbfc] to-white`}
      >
        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:p-4"
        >
          메인 콘텐츠로 이동
        </a>

        <PostHogProviderComponent>
          <SentryProvider>{children}</SentryProvider>
        </PostHogProviderComponent>
      </body>
    </html>
  );
}
