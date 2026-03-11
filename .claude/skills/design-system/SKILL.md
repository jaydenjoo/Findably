---
name: design-system
description: >
  shadcn/ui + Tailwind CSS v4 디자인 시스템 패턴과 컴포넌트 사용법.
  UI 구현, 컴포넌트 선택, 레이아웃 설계, 테마 설정 시 자동 로드.
---

# 디자인 시스템 (shadcn/ui + Tailwind v4)

## 컴포넌트 설치
```bash
pnpm dlx shadcn@latest add [컴포넌트명]
pnpm dlx shadcn@latest add [컴포넌트명] --dry-run  # 미리보기
```

## Tailwind v4 주의사항
- 설정: `tailwind.css`의 `@theme` 디렉티브 (config.js 없음)
- 그라데이션: `bg-linear-to-r` (O), `bg-gradient-to-r` (X)
- 다크모드: `@media prefers-color-scheme` 기본 (class 전략은 명시 설정 필요)
- 새 색상 (v4.2): mauve, olive, mist, taupe

## 페이지 레이아웃 패턴
- 대시보드: `Sidebar` (모바일은 `Sheet`) + 메인 콘텐츠
- 설정: `Tabs` + 폼 섹션
- 목록: `DataTable` + 검색/필터 바
- 상세: `Breadcrumb` → 헤더 → 콘텐츠 → 액션
- 폼: 진행 표시 → 그룹 필드 → 하단 액션
- 빈 상태: 일러스트 + 메시지 + CTA 버튼

## Anti-AI-Slop 규칙
- 의미 없는 그라데이션 배경 금지
- "Welcome to our platform!" 같은 플레이스홀더 카피 금지
- 정보 전달 없는 장식 요소 금지
- 모든 시각 요소는 존재 이유가 있어야 함
