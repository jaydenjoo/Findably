# Task 1.7: 공통 컴포넌트 (ErrorBoundary, Skeleton, EmptyState, BlurOverlay)

## 목표

Findably의 모든 페이지가 5+2 상태 패턴(로딩/정상/빈/에러/오프라인 + 404/500)을 일관되게 처리해야 한다. 현재 라우트별 error.tsx/loading.tsx가 있지만 재사용 가능한 공유 컴포넌트가 없다. Epic 2(랜딩+온보딩) 진입 전 이 인프라를 완성해야 한다.

BlurOverlay는 무료→유료 전환의 핵심 UI이고, ScoreGauge는 대시보드의 중심 요소.

## 변경 파일 (10개 신규 + 2개 수정)

### 신규 파일

| #   | 파일                                      | 타입         | 설명                                            |
| --- | ----------------------------------------- | ------------ | ----------------------------------------------- |
| 1   | `src/types/ui.ts`                         | 타입         | 공통 컴포넌트 Props 타입 (OST)                  |
| 2   | `src/config/scoring.ts`                   | config 보강  | 점수 등급 기준 + 색상 매핑 (현재 빈 객체)       |
| 3   | `src/components/shared/ErrorBoundary.tsx` | 'use client' | React Error Boundary (class)                    |
| 4   | `src/components/shared/Skeleton.tsx`      | Server       | 재사용 스켈레톤 변형 (card, text, gauge, table) |
| 5   | `src/components/shared/EmptyState.tsx`    | Server       | 빈 상태 (아이콘 + 제목 + 설명 + CTA)            |
| 6   | `src/components/shared/ErrorCard.tsx`     | 'use client' | 에러 표시 (retry 버튼 + aria-live)              |
| 7   | `src/components/shared/OfflineBanner.tsx` | 'use client' | navigator.onLine 감지 + 고정 배너               |
| 8   | `src/components/shared/BlurOverlay.tsx`   | Server       | 유료 전환 블러 + CTA                            |
| 9   | `src/components/shared/ScoreGauge.tsx`    | 'use client' | SVG 원형 게이지 + 카운트업                      |
| 10  | `src/components/ui/badge-variants.ts`     | 유틸         | CVA 뱃지 변형 (score/status)                    |

### 수정 파일

| 파일                                      | 변경                                 |
| ----------------------------------------- | ------------------------------------ |
| `src/app/(onboarding)/error.tsx`          | ErrorCard 컴포넌트 사용으로 리팩토링 |
| `src/app/(dashboard)/diagnosis/error.tsx` | ErrorCard 컴포넌트 사용으로 리팩토링 |

## 컴포넌트 상세 설계

### 1. `src/types/ui.ts` — 공통 타입 (OST)

```ts
type ScoreGrade = 'excellent' | 'good' | 'warning' | 'critical'
type SkeletonVariant = 'card' | 'text' | 'gauge' | 'table-row'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: { label: string; href: string }
}

interface ErrorCardProps {
  message?: string
  onRetry?: () => void
}

interface BlurOverlayProps {
  children: React.ReactNode
  visiblePercent?: number // default 25
  ctaLabel?: string // "상세 분석 받기 — 9.9만원"
  ctaHref?: string // 결제 트리거
  sampleLabel?: string // "샘플 먼저 보기 →"
  sampleHref?: string // "/reports/sample"
}

interface ScoreGaugeProps {
  score: number // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean // default true
  animated?: boolean // default true
}
```

### 2. `src/config/scoring.ts` — 점수 기준 보강

현재 빈 객체 → 등급 기준 + 색상 매핑 추가:

- `GRADE_THRESHOLDS`: excellent(80+), good(60+), warning(40+), critical(0+)
- `GRADE_LABELS`: 양호/보통/주의/심각
- `GRADE_COLORS`: Tailwind 클래스 매핑 (text/bg/stroke)
- `getScoreGrade(score)`: 점수 → 등급
- `getScoreColor(score)`: 점수 → 색상 객체

### 3. ErrorBoundary — React Class Component

- `'use client'` (class component 필수)
- Props: `children`, `fallback?: ReactNode`
- 기본 fallback: ErrorCard 사용
- `componentDidCatch`에서 에러 로깅 (Sentry 슬롯은 Task 1.9)
- 접근성: fallback에 `role="alert"`

### 4. Skeleton — 재사용 스켈레톤

- Server Component (CSS만으로 애니메이션)
- variant: `card`(200px rect) | `text`(3줄) | `gauge`(원형) | `table-row`(4칸 행)
- 기존 loading.tsx 패턴: `animate-pulse bg-slate-200 rounded-lg`
- `aria-busy="true"` `aria-label="로딩 중"`

### 5. EmptyState — 빈 상태

- Server Component
- 중앙 정렬: 아이콘(48px, slate-300) + 제목(text-lg) + 설명(text-sm) + CTA(Button)
- CTA: Button `render={<Link href={...} />}` (기존 GNB 패턴)
- 기본 아이콘: `Inbox` (lucide-react)

### 6. ErrorCard — 에러 표시

- `'use client'` (onRetry 핸들러)
- `border-l-4 border-danger-500` + `bg-danger-50`
- `aria-live="polite"` + `role="alert"`
- 재시도 버튼: Button variant="outline"
- 기존 error.tsx 스타일 통합

### 7. OfflineBanner — 네트워크 감지

- `'use client'` (navigator.onLine + event listeners)
- `useEffect`에서 online/offline 이벤트 구독 (SSR 안전)
- 고정 배너: `fixed top-0 z-50 w-full`
- `bg-warning-50 text-warning-700`
- 온라인 복구 시 자동 숨김

### 8. BlurOverlay — 유료 전환 (핵심 전환 UI)

- Server Component (CTA는 Link)
- 구조: `relative` 래퍼 > children(`aria-hidden`) + 블러 오버레이 + CTA
- 블러: `bg-gradient-to-b from-transparent via-white/70 to-white/95` + `backdrop-blur-sm`
- 상단 25-30% 선명 (데이터 존재 증거)
- CTA 2개: primary + ghost
- 블러 영역 `aria-hidden="true"`, CTA에 가격 포함 aria-label
- 반응형: 모바일에서 CTA 세로 스택

### 9. ScoreGauge — SVG 원형 게이지

- `'use client'` (카운트업 애니메이션)
- SVG `<circle>`: 배경 원(slate-200) + 점수 원(color-coded)
- `strokeDasharray = 2πr`, `strokeDashoffset = (1 - score/100) * circumference`
- 카운트업: `requestAnimationFrame` 1.5s easeOutCubic
- `prefers-reduced-motion`: 즉시 표시
- 접근성: `role="meter"` `aria-valuenow` `aria-valuemin={0}` `aria-valuemax={100}`
- 폰트: `font-display font-extrabold tabular-nums`
- 색상: `getScoreColor(score)` from scoring.ts

| size | 전체  | 텍스트 |
| ---- | ----- | ------ |
| sm   | 80px  | 20px   |
| md   | 120px | 32px   |
| lg   | 160px | 40px   |
| xl   | 200px | 56px   |

### 10. badge-variants.ts — CVA 뱃지 변형

button-variants.ts 패턴:

- variant: default/success/warning/danger/info/pro
- size: sm/md
- 시맨틱 색상 토큰 사용

## 구현 순서 (4 Phase)

### Phase 1: 기반 (타입 + Config + UI유틸)

1. `src/types/ui.ts`
2. `src/config/scoring.ts` 보강
3. `src/components/ui/badge-variants.ts`

### Phase 2: 상태 컴포넌트 (Tier 1) — 병렬 가능

4. `Skeleton.tsx`
5. `EmptyState.tsx`
6. `ErrorCard.tsx`
7. `ErrorBoundary.tsx` (ErrorCard 의존)
8. `OfflineBanner.tsx`

### Phase 3: 비즈니스 컴포넌트 (Tier 2)

9. `BlurOverlay.tsx`
10. `ScoreGauge.tsx` (scoring.ts 의존)

### Phase 4: 통합 + 검증

11. 기존 error.tsx 2개 → ErrorCard 사용 리팩토링
12. `pnpm tsc --noEmit && pnpm lint && pnpm build`

## 기존 코드 재사용

| 재사용 대상        | 위치                                   | 용도                      |
| ------------------ | -------------------------------------- | ------------------------- |
| CVA 패턴           | `src/components/ui/button-variants.ts` | badge-variants 참고       |
| Button render 패턴 | `src/components/shared/GNB.tsx:56`     | BlurOverlay CTA Link 래핑 |
| error.tsx 스타일   | `src/app/(onboarding)/error.tsx`       | ErrorCard 기본 스타일     |
| loading.tsx 스타일 | `src/app/(onboarding)/loading.tsx`     | Skeleton 기본 스타일      |
| 색상 토큰          | `src/app/globals.css:54-72`            | success/warning/danger    |

## 리스크

| 리스크                   | 대응                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| SVG 원형 게이지 수학     | strokeDasharray = 2πr, offset = (1 - score/100) \* circumference |
| 카운트업 rAF 메모리 누수 | useEffect cleanup → cancelAnimationFrame                         |
| OfflineBanner SSR 충돌   | useEffect에서만 이벤트 구독, 초기값 true                         |
| BlurOverlay 접근성       | aria-hidden + CTA에 가격 포함 aria-label                         |
| prefers-reduced-motion   | 모든 애니메이션에 미디어 쿼리 대응                               |

## 검증 방법

1. `pnpm tsc --noEmit` — 타입 에러 0
2. `pnpm lint` — 에러 0 (기존 경고 4개 허용)
3. `pnpm build` — 성공
4. 파일 수: 10개 신규 + 2개 수정 = 12개 이내
