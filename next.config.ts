import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // 도메인 설정: 커스텀 도메인 및 Vercel 서브도메인 허용
  // NEXT_PUBLIC_APP_URL 환경변수로 설정되는 도메인 사용
  // 예: findably.com, findably-production.vercel.app
  assetPrefix: process.env.ASSET_PREFIX || undefined,

  // Image optimization configuration
  images: {
    // 허용된 이미지 도메인 (커스텀 도메인 및 외부 이미지 호스팅)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // Supabase 이미지 호스팅
      },
      {
        protocol: "https",
        hostname: "**.vercel.app", // Vercel 서브도메인
      },
      {
        protocol: "https",
        hostname: "findably.com", // 커스텀 도메인
      },
      {
        protocol: "https",
        hostname: "*.findably.com", // 커스텀 도메인 서브도메인
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
    qualities: [75, 80], // Allow both 75 and 80 quality settings
  },

  // Enable compression (Vercel default, but explicit for clarity)
  compress: true,

  // React strict mode for development
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "findably",
  project: "findably-mvp",
  silent: false, // Logs all the project and release names

  // An auth token is required for uploading source maps.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  telemetry: false,
});
