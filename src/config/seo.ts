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
  // JSON-LD Organization 데이터
  organization: {
    name: 'Findably',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'AI 기반 SEO + GEO 통합 마케팅 진단 서비스',
  },
} as const

// site.ts 하위 호환
export const SITE_NAME = SEO.siteName
export const SITE_VERSION = SEO.siteVersion
