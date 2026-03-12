import type { MetadataRoute } from "next";
import { APP_URL, PUBLIC_ROUTES } from "@/constants/app";

/**
 * sitemap.xml 생성 핸들러
 * SEO를 위한 공개 페이지 목록 제공
 *
 * 포함 페이지:
 * - / (홈페이지)
 * - /login (로그인)
 * - /signup (회원가입)
 *
 * 제외 페이지:
 * - /dashboard/* (인증 필요)
 * - /onboarding/* (인증 필요)
 * - /api/* (API 엔드포인트)
 */
export async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL;

  // 공개 라우트에서 sitemap 엔트리 생성
  const publicSitemapEntries = PUBLIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changefreq as
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never"
      | undefined,
    priority: route.priority,
  }));

  return publicSitemapEntries;
}

export default sitemap;
