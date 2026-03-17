const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3600'

export const SEO = {
  siteName: 'Findably',
  siteVersion: '0.1.0',
  siteUrl: SITE_URL,
  defaultTitle: 'Findably — AI 마케팅 진단',
  defaultDescription:
    'URL 하나로 SEO + GEO 통합 진단. AI가 검색 노출 문제를 찾고 실행 가능한 개선안을 제시합니다.',
  locale: 'ko_KR',
  // OG 기본값
  ogImage: `${SITE_URL}/og/default.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  // 랜딩 페이지 전용
  landing: {
    title: 'AI 마케팅 진단 — SEO + GEO 통합 분석 | Findably',
    description:
      'URL 하나로 SEO + GEO 통합 진단. AI가 마케팅 점수를 매기고 실행 계획까지 제시합니다. 무료로 시작하세요.',
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
