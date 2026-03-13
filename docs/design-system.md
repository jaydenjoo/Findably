# Findably Design System

> 디자인기획서 v2.1 + Dashboard Sample v2.1 기반
> AI는 이 규칙을 따라 UI를 구현한다
> Light mode 전용 (Dark mode는 Phase 2)

---

## 1. 컬러 토큰

### Primary (신뢰감 블루)

| 토큰        | HEX     | 용도                          | Tailwind                |
| ----------- | ------- | ----------------------------- | ----------------------- |
| primary-50  | #EFF6FF | 배경 틴트, 사이드바 활성 배경 | `bg-primary-50`         |
| primary-100 | #DBEAFE | 호버 배경                     | `bg-primary-100`        |
| primary-200 | #BFDBFE | 보더 강조                     | `border-primary-200`    |
| primary-300 | #93C5FD | 비활성 요소                   | `text-primary-300`      |
| primary-400 | #60A5FA | 보조 액센트                   | `text-primary-400`      |
| primary-500 | #3B82F6 | **메인 CTA, 링크**            | `bg-primary-500`        |
| primary-600 | #2563EB | 호버 상태                     | `hover:bg-primary-600`  |
| primary-700 | #1D4ED8 | 액티브(클릭)                  | `active:bg-primary-700` |
| primary-800 | #1E40AF | 강조 텍스트                   | `text-primary-800`      |

### Semantic (신호등 시스템: 점수 0-100)

| 등급           | 점수   | 메인 HEX | 배경 HEX | 텍스트 라벨 |
| -------------- | ------ | -------- | -------- | ----------- |
| 양호 (Success) | 70-100 | #22C55E  | #F0FDF4  | "양호"      |
| 주의 (Warning) | 40-69  | #F59E0B  | #FFFBEB  | "주의"      |
| 심각 (Danger)  | 0-39   | #EF4444  | #FEF2F2  | "심각"      |

```
success: { 50: #F0FDF4, 100: #DCFCE7, 500: #22C55E, 600: #16A34A, 700: #15803D }
warning: { 50: #FFFBEB, 100: #FEF3C7, 500: #F59E0B, 600: #D97706, 700: #B45309 }
danger:  { 50: #FEF2F2, 100: #FEE2E2, 500: #EF4444, 600: #DC2626, 700: #B91C1C }
info:    { 50: #EFF6FF, 500: #3B82F6 }
```

### Neutral (배경/텍스트/보더)

| 토큰           | HEX     | 용도              | Tailwind           |
| -------------- | ------- | ----------------- | ------------------ |
| bg-primary     | #FFFFFF | 메인 배경         | `bg-white`         |
| bg-secondary   | #F8FAFC | 페이지 배경       | `bg-slate-50`      |
| bg-tertiary    | #F1F5F9 | 카드 호버         | `bg-slate-100`     |
| surface        | #FFFFFF | 카드 배경         | `bg-white`         |
| border         | #E2E8F0 | 기본 보더         | `border-slate-200` |
| border-strong  | #CBD5E1 | 강조 보더         | `border-slate-300` |
| text-primary   | #0F172A | 제목              | `text-slate-900`   |
| text-secondary | #334155 | 본문              | `text-slate-700`   |
| text-tertiary  | #64748B | 보조 (날짜, 캡션) | `text-slate-500`   |
| text-disabled  | #94A3B8 | 비활성            | `text-slate-400`   |
| text-inverse   | #FFFFFF | 어두운 배경 위    | `text-white`       |

---

## 2. 타이포그래피

### 폰트 패밀리

| 용도                | 폰트           | CSS Variable     | Tailwind       |
| ------------------- | -------------- | ---------------- | -------------- |
| 본문 (한국어)       | Pretendard     | `--font-sans`    | `font-sans`    |
| 점수/숫자 (Display) | DM Sans        | `--font-display` | `font-display` |
| 코드                | JetBrains Mono | `--font-mono`    | `font-mono`    |

```css
--font-sans:
  'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-display: 'DM Sans', var(--font-sans);
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 타입 스케일

| 용도          | 크기            | Weight | Line Height  | Tailwind                                  |
| ------------- | --------------- | ------ | ------------ | ----------------------------------------- |
| 게이지 점수   | 56px (3.5rem)   | 800    | 1            | `text-[56px] font-extrabold font-display` |
| 페이지 타이틀 | 30px (1.875rem) | 700    | 1.25         | `text-3xl font-bold`                      |
| 섹션 타이틀   | 24px (1.5rem)   | 700    | 1.25         | `text-2xl font-bold`                      |
| 카드 타이틀   | 20px (1.25rem)  | 600    | 1.25         | `text-xl font-semibold`                   |
| 서브헤딩      | 18px (1.125rem) | 600    | 1.25         | `text-lg font-semibold`                   |
| 본문          | 16px (1rem)     | 400    | 1.7 (한국어) | `text-base`                               |
| 보조 텍스트   | 14px (0.875rem) | 400    | 1.5          | `text-sm`                                 |
| 캡션/뱃지     | 12px (0.75rem)  | 600    | 1            | `text-xs font-semibold`                   |

> 한국어 본문 line-height: 1.7 (영문보다 넓게)

---

## 3. 간격 (4px 리듬)

| 토큰     | 값   | 용도                 | Tailwind        |
| -------- | ---- | -------------------- | --------------- |
| space-1  | 4px  | 아이콘-텍스트 간격   | `gap-1`         |
| space-2  | 8px  | 관련 요소 최소 간격  | `gap-2`         |
| space-3  | 12px | 리스트 항목 간       | `gap-3`         |
| space-4  | 16px | 카드 내부 요소 간    | `gap-4` / `p-4` |
| space-5  | 20px | 카드 패딩 (모바일)   | `p-5`           |
| space-6  | 24px | 카드 패딩 (데스크톱) | `p-6`           |
| space-8  | 32px | 카드 그룹 간         | `gap-8`         |
| space-10 | 40px | 섹션 간 (모바일)     | `gap-10`        |
| space-16 | 64px | 섹션 간 (데스크톱)   | `gap-16`        |
| space-20 | 80px | 랜딩 섹션 간         | `gap-20`        |

### 규격 토큰

| 용도             | 데스크톱             | 모바일        |
| ---------------- | -------------------- | ------------- |
| 카드 패딩        | 24px (`p-6`)         | 16px (`p-4`)  |
| 섹션 간격        | 64px                 | 40px          |
| 페이지 최대 너비 | 1280px (`max-w-7xl`) | —             |
| 페이지 좌우 패딩 | 16px (`px-4`)        | 16px (`px-4`) |

---

## 4. 모서리 / 그림자

### Border Radius

| 토큰          | 값      | 용도                        | Tailwind         |
| ------------- | ------- | --------------------------- | ---------------- |
| radius-sm     | 4px     | 뱃지 내부 작은 요소         | `rounded`        |
| **radius-md** | **8px** | **기본 — 버튼, 카드, 인풋** | **`rounded-lg`** |
| radius-lg     | 12px    | 큰 카드, 모달               | `rounded-xl`     |
| radius-full   | 9999px  | 원형 (뱃지, 아바타)         | `rounded-full`   |

> radius-md(8px)가 통일 기준. shadcn/ui 기본값과 일치.

### Shadow (2단계만)

| 토큰      | 값                                                                 | 용도      | Tailwind    |
| --------- | ------------------------------------------------------------------ | --------- | ----------- |
| shadow-sm | `0 1px 2px 0 rgba(0,0,0,0.05)`                                     | 카드 기본 | `shadow-sm` |
| shadow-md | `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)` | 카드 호버 | `shadow-md` |

> shadow-lg 이상 금지.

---

## 5. 반응형 Breakpoints

| 토큰 | 값     | 용도                      | Tailwind |
| ---- | ------ | ------------------------- | -------- |
| sm   | 375px  | iPhone SE (최소 타겟)     | `sm:`    |
| md   | 768px  | iPad (2컬럼 시작)         | `md:`    |
| lg   | 1024px | 데스크톱 (사이드바 표시)  | `lg:`    |
| xl   | 1280px | 와이드 (최대 콘텐츠 너비) | `xl:`    |

> 모바일 퍼스트 (한국 모바일 트래픽 82%)

---

## 6. 애니메이션

### 허용 애니메이션

| 이름             | 트리거    | 지속 시간 | 비고                           |
| ---------------- | --------- | --------- | ------------------------------ |
| 점수 카운트업    | 화면 진입 | 1.5s      | easeOutCubic                   |
| 카드 호버 lift   | hover     | 200ms     | `translateY(-1px)` + shadow-md |
| 페이지 전환 fade | 라우팅    | 200ms     | opacity 0→1                    |
| 프로그레스바     | 실시간    | 연속      | SSE/WebSocket                  |
| 토스트 슬라이드  | 이벤트    | 300ms     | —                              |
| Skeleton pulse   | 로딩      | 연속      | `animate-pulse`                |

### Transition 토큰

| 토큰              | 값         | 용도           |
| ----------------- | ---------- | -------------- |
| transition-fast   | 150ms ease | 버튼 호버      |
| transition-normal | 200ms ease | 카드 변화      |
| transition-slow   | 300ms ease | 모달/패널 등장 |

### 금지 애니메이션

- 전체 페이지 패럴랙스 (CLS 악화)
- 자동 재생 비디오 배경 (LCP 악화)
- 5개+ 동시 스크롤 트리거 (CPU 부하)
- 텍스트 타이핑 효과 (읽기 속도 제한)
- 깜빡임 (WCAG 위반 — 광과민성 위험)

### prefers-reduced-motion 대응 (필수)

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Anti-AI-Slop 규칙

### 금지

- ❌ 보라색 그라데이션 (AI 클리셰)
- ❌ Inter / Roboto / Arial / Space Grotesk 폰트
- ❌ text-opacity 사용 → 전용 색상 토큰 사용
- ❌ 인라인 스타일 (`style="..."`) → Tailwind 클래스만
- ❌ 하드코딩 색상 → CSS Variable만
- ❌ 한 페이지에 다크 배경 섹션 2개+
- ❌ 과도한 둥글림 (rounded-2xl+)
- ❌ 과도한 그림자 (shadow-lg+)
- ❌ 순백 #FFFFFF 단독 배경 → 미세 텍스처 또는 bg-secondary 병행

### 필수

- CSS Variable 기반 색상만 사용
- Tailwind 클래스만 사용 (CSS 모듈 / 인라인 금지)
- radius: 8px (`rounded-lg`) 통일
- shadow: sm + md 2단계만
- 2레이어 그림자 (가까운 + 먼 조합)

---

## 8. 컴포넌트 매핑 (shadcn/ui)

### shadcn/ui 기반 (토큰만 커스텀)

| UI 요소  | shadcn 컴포넌트 | 커스텀 수준                                     |
| -------- | --------------- | ----------------------------------------------- |
| Button   | `<Button>`      | 색상 토큰 적용                                  |
| Card     | `<Card>`        | border + shadow 토큰                            |
| Input    | `<Input>`       | 크기 조정                                       |
| Badge    | `<Badge>`       | 점수 등급 variant 추가 (success/warning/danger) |
| Skeleton | `<Skeleton>`    | 기본 사용                                       |
| Progress | `<Progress>`    | 색상 토큰 적용                                  |
| Table    | `<Table>`       | 모바일: 카드 변환 추가                          |

### 커스텀 컴포넌트 (완전 자체 개발)

| 컴포넌트            | 용도             | 핵심 스펙                                  |
| ------------------- | ---------------- | ------------------------------------------ |
| **ScoreGauge**      | 원형 점수 게이지 | SVG circle + 카운트업 + `role="meter"`     |
| **QuickWinCard**    | 처방전 카드      | 난이도 뱃지 + 시간 + 임팩트                |
| **BlurOverlay**     | 유료 전환 유도   | 상단 25-30% 선명 + gradient blur + CTA 2개 |
| **AICitationCard**  | AI 인용 현황판   | 플랫폼별 Y/N 뱃지 + 경쟁사 비교            |
| **AnalyzingScreen** | 분석 대기 화면   | progress + 체크리스트 + 카운트다운         |

### ScoreGauge 상세

```
Props: score(0-100), size(sm|md|lg|xl), showLabel(boolean), animated(boolean)
접근성: role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}
         aria-label="종합 마케팅 점수 {n}점, {등급} 등급"
색상: getScoreColor(score) → ≥70 success, ≥40 warning, <40 danger
폰트: DM Sans, 800 weight, tabular-nums
필수: 색상 + 텍스트 등급 이중 전달 (색약 대응)
```

### BlurOverlay 상세

```
구조: 실제 콘텐츠(aria-hidden) + 블러 그라데이션 + CTA 영역
블러: gradient(transparent 0% → white/0.7 20% → white/0.95 50%) + backdrop-blur(6px)
상단 25-30% 선명하게 노출 (데이터 존재 증거)
CTA 2개: "상세 분석 받기 — 9.9만원" (primary) + "샘플 먼저 보기 →" (ghost)
접근성: 블러 영역 aria-hidden="true" / CTA에 aria-label 포함 가격
```

---

## 9. 대시보드 레이아웃

### F-패턴 배치

```
┌───────────────────────────────────────────────┐
│ 1순위(좌상단) = 종합 점수  │ 2순위(우상단) = AI 인용  │
├────────────────────────────┴──────────────────┤
│ 3순위(중앙) = Quick Win 카드 (가로 스크롤)     │
├───────────────────────────────────────────────┤
│ 4순위(하단) = 카테고리 상세 or BlurOverlay     │
└───────────────────────────────────────────────┘
```

### 구조

- **사이드바**: 220px 고정, lg 이상에서 표시
- **헤더**: 56px 고정, 모바일에서 햄버거 메뉴
- **메인**: `max-w-[1200px]` 중앙 정렬
- **그리드**: `grid grid-cols-1 md:grid-cols-2 gap-4`

### 점진 공개 (Progressive Disclosure)

토스 패턴 적용: 총점 → 등급 라벨 → 카테고리 분석 → 상세 항목

---

## 10. 상태별 UI 패턴 (5가지 필수)

| 상태     | 컴포넌트             | 규칙                                             |
| -------- | -------------------- | ------------------------------------------------ |
| 로딩     | `<Skeleton>`         | `animate-pulse`, 카드 구조 유지                  |
| 정상     | 데이터 + 차트 + 카드 | 기본 상태                                        |
| 빈 상태  | `<EmptyState>`       | 친근한 안내 + CTA ("아직 진단 결과가 없어요")    |
| 에러     | `<ErrorCard>`        | danger 보더 + 재시도 버튼 + `aria-live="polite"` |
| 오프라인 | `<OfflineBanner>`    | 상단 고정, warning 배경, "인터넷 연결 확인"      |

---

## 11. 접근성 (WCAG 2.2 AA)

- [ ] 색상 대비 4.5:1+ (WebAIM Contrast Checker)
- [ ] 점수 색상 + 텍스트 등급 이중 전달 (색약 대응)
- [ ] 키보드 네비게이션 (Tab/Enter/Space)
- [ ] `focus-visible` 스타일: `outline: 2px solid #3B82F6; outline-offset: 2px`
- [ ] 이미지 alt 텍스트 100%
- [ ] 폼 라벨 연결
- [ ] 에러 메시지 `aria-live="polite"`
- [ ] 차트/게이지 `aria-label` 필수
- [ ] 터치 타겟 최소 44x44px
- [ ] `prefers-reduced-motion` 대응

---

## 12. 성능 목표

| 지표   | 목표                        |
| ------ | --------------------------- |
| LCP    | < 2.0s                      |
| CLS    | < 0.1                       |
| FID    | < 100ms                     |
| 폰트   | Pretendard subset (2,350자) |
| 이미지 | WebP, 적절 크기             |

---

## 13. CSS Variable → globals.css 매핑

```css
:root {
  /* Primary */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  /* Semantic */
  --color-success-50: #f0fdf4;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-warning-50: #fffbeb;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-danger-50: #fef2f2;
  --color-danger-500: #ef4444;
  --color-danger-600: #dc2626;

  /* Neutral */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-text-primary: #0f172a;
  --color-text-secondary: #334155;
  --color-text-tertiary: #64748b;
  --color-border: #e2e8f0;

  /* Font */
  --font-sans:
    'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-display: 'DM Sans', var(--font-sans);
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Radius — 8px 통일 기준 */
  --radius: 0.5rem;

  /* Shadow — 2단계만 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md:
    0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);

  /* Transition */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

## 완성 체크리스트

```
□ 2레이어 그림자 적용
□ 배경 텍스처/블롭/교차 1개+ 적용
□ 타이포 3단 위계 (제목/설명/보조) 명확
□ 순차 등장 애니메이션 적용
□ 모든 인터랙티브 요소에 호버 효과
□ 뱃지/상태 표시 등 생동감 요소
□ 비대칭 레이아웃 또는 카드 강약
□ CTA 구체적 문구 + → 화살표
□ 한국어 제목 자간 (-0.02em~) 조정
□ 반응형 (768px, 480px) 대응
→ 9개 이상 = 출시 가능 / 7개 미만 = 재작업
```
