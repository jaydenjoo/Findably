const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3600'

export const SEO = {
  siteName: 'Findably',
  siteVersion: '0.1.0',
  siteUrl: SITE_URL,
  defaultTitle: 'AI 마케팅 진단, URL 하나로 시작 — Findably',
  defaultDescription:
    '웹사이트에서 새는 마케팅 비용부터 찾아드립니다. SEO, AI 검색(GEO) 통합 진단. 60개 항목 자동 분석, 가장 돈이 많이 새는 곳부터 고치는 순서를 알려드립니다.',
  locale: 'ko_KR',
  // OG 기본값
  ogImage: `${SITE_URL}/og/default.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  // 랜딩 페이지 전용
  landing: {
    title: '마케팅에 돈 쓰는데, 어디서 새고 있는지 모르겠다면 | Findably',
    description:
      '웹사이트에서 새는 마케팅 비용부터 찾아드립니다. SEO, AI 검색(GEO) 통합 진단.',
    ogImage: `${SITE_URL}/og/landing.png`,
  },
  // JSON-LD Organization 데이터
  organization: {
    name: 'Findably',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'AI 기반 SEO + GEO 통합 마케팅 진단 서비스',
  },
} as const

/** 랜딩 페이지 JSON-LD (SoftwareApplication) */
export const LANDING_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SEO.siteName,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: SEO.landing.description,
  url: SEO.siteUrl,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
    description: '무료 간단 진단',
  },
  featureList: [
    'SEO 종합 진단 (메타태그, 구조화 데이터, robots.txt)',
    'GEO(Generative Engine Optimization) 분석',
    'AI 인용 가능성 점수 (ChatGPT, Perplexity, Gemini)',
    'Core Web Vitals 성능 분석',
    'Quick Win 자동 식별 및 우선순위 추천',
    'Schema Markup 자동 생성',
    '메타태그 최적화 추천',
    '경쟁사 비교 분석',
  ],
  publisher: {
    '@type': 'Organization',
    name: SEO.organization.name,
    url: SEO.organization.url,
  },
} as const

// site.ts 하위 호환
export const SITE_NAME = SEO.siteName
export const SITE_VERSION = SEO.siteVersion
