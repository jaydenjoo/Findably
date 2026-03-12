# Design System — [프로젝트명]
> /design-system 또는 /init-prd 실행 시 채워짐
> AI는 이 규칙을 따라 UI를 만든다

## 컬러 토큰
| 용도 | Light | Dark | Tailwind |
|------|-------|------|----------|

## 타이포그래피
| 용도 | 크기 | Weight | Class |
|------|------|--------|-------|

## Anti-AI-Slop
- ❌ 보라색 그라데이션 금지
- ❌ 텍스트 opacity 금지 (muted-foreground 사용)
- ❌ 인라인 스타일 금지
- ❌ 커스텀 색상 하드코딩 금지
- ❌ dark background 한 페이지 2개+ 금지

## 컴포넌트 매핑 (shadcn/ui)
| UI 요소 | shadcn 컴포넌트 | 사용 규칙 |
|---------|----------------|----------|

## 상태별 UI 패턴
| 상태 | 컴포넌트 | 규칙 |
|------|---------|------|
| 로딩 | Skeleton | animate-pulse |
| 빈 상태 | EmptyState | 아이콘+설명+CTA |
| 에러 | ErrorCard | danger 테두리+재시도 |
| 오프라인 | OfflineBanner | 상단 고정 |
