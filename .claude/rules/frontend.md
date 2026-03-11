---
paths:
  - src/app/**/*.tsx
  - src/app/**/*.ts
  - src/components/**/*.tsx
  - src/hooks/**/*.ts
---

# 프론트엔드 규칙

- Server Component 기본. `"use client"` 는 useState/useEffect/onClick 등 필요 시만 추가
- shadcn/ui 컴포넌트 우선. 직접 만들기 전에 `pnpm dlx shadcn@latest add` 확인
- `next/image` 필수. `<img>` 태그 사용 금지
- `next/link` 필수. `<a>` 태그 사용 금지
- Tailwind v4 클래스만 사용. 인라인 스타일 금지. `style={}` 금지
- 그라데이션: `bg-linear-to-r` (v4 문법). `bg-gradient-to-r` 아님
- 데이터 페칭: Server Component에서 직접 fetch 또는 TanStack Query. `useEffect`로 fetch 금지
- 라우트별 전용 컴포넌트는 `_components/`에 배치
- 공유 컴포넌트는 `src/components/`에 배치
- 모든 컴포넌트는 명시적 Props 인터페이스 정의. `any` 금지
