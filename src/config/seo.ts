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
  ogImage: `${SITE_URL}/og`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  // 랜딩 페이지 전용
  landing: {
    title: '마케팅에 돈 쓰는데, 어디서 새고 있는지 모르겠다면',
    description:
      '웹사이트에서 새는 마케팅 비용부터 찾아드립니다. SEO, AI 검색(GEO) 통합 진단.',
    ogImage: `${SITE_URL}/og`,
  },
  // JSON-LD Organization 데이터
  organization: {
    name: 'Findably',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'AI 기반 SEO + GEO 통합 마케팅 진단 서비스',
    email: 'hello@findably.kr',
    foundingDate: '2026',
    sameAs: [] as readonly string[], // SNS 계정 추가 시 여기에 URL 삽입
  },
} as const

// site.ts 하위 호환
export const SITE_NAME = SEO.siteName
export const SITE_VERSION = SEO.siteVersion
