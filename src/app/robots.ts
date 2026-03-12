import type { MetadataRoute } from "next";
import { APP_URL } from "@/constants/app";

/**
 * robots.txt 생성 핸들러
 * SEO 크롤러를 위한 접근 규칙 정의
 *
 * 규칙:
 * - 모든 크롤러: / (홈페이지), /login, /signup 접근 허용
 * - 모든 크롤러: /api/*, /dashboard/*, /onboarding/* 접근 금지
 * - sitemap.xml 경로 제공
 */
export function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/*", "/onboarding/*", "/_next/*"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/dashboard/*", "/onboarding/*"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/dashboard/*", "/onboarding/*"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
