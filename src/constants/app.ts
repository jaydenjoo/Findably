/**
 * Findably 애플리케이션 전역 상수
 * 앱 이름, 도메인, 메타데이터 등 설정값 정의
 */

export const APP_NAME = "Findably";

/**
 * 애플리케이션 URL (환경변수에서 로드)
 * 도메인 설정 시 이 값 업데이트됨
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const APP_DESCRIPTION =
  "URL 하나로 마케팅 전체를 진단받으세요. AI가 SEO, 콘텐츠, 검색 노출을 분석하고 즉시 실행 가능한 개선안을 제공합니다.";

export const APP_TAGLINE = "AI 마케팅 자동화 플랫폼";

/**
 * 기본 메타데이터
 */
export const DEFAULT_METADATA = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  keywords: ["마케팅", "SEO", "AI", "자동화", "진단", "GEO", "검색 최적화"],
};

/**
 * Open Graph 메타데이터
 */
export const DEFAULT_OG_METADATA = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  type: "website",
  locale: "ko_KR",
};

/**
 * Twitter Card 메타데이터
 */
export const DEFAULT_TWITTER_METADATA = {
  card: "summary_large_image",
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
};

/**
 * 공개 페이지 목록 (SEO 크롤링 대상)
 * sitemap.xml에 포함될 라우트
 */
export const PUBLIC_ROUTES = [
  {
    path: "/",
    priority: 1,
    changefreq: "weekly" as const,
  },
  {
    path: "/login",
    priority: 0.8,
    changefreq: "monthly" as const,
  },
  {
    path: "/signup",
    priority: 0.9,
    changefreq: "monthly" as const,
  },
];

/**
 * 비공개 페이지 목록 (SEO 크롤링 제외)
 * robots.txt에서 Disallow됨
 */
export const PRIVATE_ROUTES = [
  "/api/*",
  "/dashboard/*",
  "/onboarding/*",
  "/_next/*",
  "/admin/*",
];
