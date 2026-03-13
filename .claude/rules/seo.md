---
globs:
  - src/app/**/page.tsx
  - src/app/**/layout.tsx
---

# SEO/GEO 규칙 (Findably 핵심)

- 모든 page.tsx: export const metadata 또는 generateMetadata 필수
- title: "[페이지명] | Findably" (60자 이내)
- description: 155자 이내, 핵심 내용
- H1: 페이지당 정확히 1개
- 이미지: next/image + alt 필수
- 링크: next/link 사용
- Schema Markup: 해당 타입 JSON-LD 포함
- OG 태그: og:title, og:description, og:image
- robots.txt + sitemap.xml 자동 생성
- llms.txt: AI 크롤러용 사이트 요약 제공
