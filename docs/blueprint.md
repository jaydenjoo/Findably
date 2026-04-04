# Phase 0 Blueprint — 홈페이지 프레이밍 + SEO 기반 파일

> PRD: docs/Findably-PRD-홈페이��-리포트-정합성-v1_2.md
> 브랜치: feature/phase-0
> 총 5개 Task, 예상 ~3.5시간

---

## 목표

Phase 0 완료 시 상태:

1. 홈페이지 H1/서브카피가 "마케팅 누수" 프레이밍으로 변경됨
2. 비교 ��이블이 "기초체력 진단" 포지셔���으로 리프레이밍됨
3. 리포트 90일 로드맵에 우선순위 산정 근거 설명이 추가됨
4. robots.txt + llms.txt가 PRD ��준으로 보강됨
5. OG 메타 + canonical + twitter card가 완성됨

---

## Task A-01 (8.10): 모토/서브카피 수정

### 수정 파일

| 파일                                           | 변경 내용                                     |
| ---------------------------------------------- | --------------------------------------------- |
| `src/components/landing/hero-section.tsx`      | H1, 서브카피 텍스트 변경                      |
| `src/components/landing/customer-concerns.tsx` | 고민카드 1번 텍스트 변경                      |
| `src/config/landing.ts`                        | hero.title, hero.description 상수 변경        |
| `src/app/(marketing)/page.tsx`                 | metadata.title, metadata.openGraph.title 변경 |

### AS-IS → TO-BE

**H1** (`hero-section.tsx:69-70`, 하드코딩):

```
AS: "마케팅에 돈 쓰는데 / 뭘 먼저 고쳐야 하는지 모르겠다면"
TO: "마케팅에 돈을 쓰는데, / 어디서 새고 있는지 모르겠다면"
```

**서브카피** (`hero-section.tsx:79-81`, 하드코딩):

```
AS: "SEO, GEO, 콘텐츠, 기술 — 60초 만에 진단하고, / 뭘 먼저 고��야 ROI가 올라가는지 우선순위로 알려드립니다."
TO: "웹사이트에서 새는 마케팅 비용부터 찾아드립니다. / SEO, AI 검색(GEO), 콘텐츠, 기술 인프라 — 60개 항목을 진단하고 / 가장 돈이 많이 새는 곳부터 고치는 순서를 알려드립니다."
```

**config/landing.ts hero 섹션** (`landing.ts:3-18`):

```
AS: title.line1="URL 하나로", highlight="마케팅 건강검진"
    description="60개 이상 항목을 자동 검사하고..."
TO: title.line1="URL 하나로", highlight="마케팅 누수 진단"
    description="웹사이트에서 새는 마케팅 비용부터 찾아드립니다..."
```

> 참고: hero-section.tsx의 H1은 config를 사용하지 않고 하드코딩. 두 곳 모두 수정 필요.

**고민카드 1번** (`customer-concerns.tsx:6-10`):

```
AS: q="SEO 대행사한테 매달 돈 내는데, 효과가 있는 건지 판단이 안 돼요"
    a="Findably는 진단 항목별 비즈니스 영향도를 표시하여..."
TO: q="마케팅비 쓰는데 어디서 새는지 모르겠다"
    a="항목별 매출 영향 금액 환산 + 가장 큰 구멍부터 막는 순서 제공"
```

**OG 태그** (`(marketing)/page.tsx:14-23`):

```
AS: title="Findably — AI 마케팅 진단, URL 하나로 시작"
TO: title="마케팅에 돈 쓰는데, 어디서 새고 있는지 모르겠다면 | Findably"
    description="웹사이트에서 새는 마케팅 비용부터 찾아드립니다. SEO, AI 검색(GEO) 통합 진단."
```

### 검증

- [ ] 모바일(375px)에서 H1 줄바꿈 자연스러운지 확인
- [ ] `pnpm build` 통과

---

## Task A-02 (8.11): 비교 테이블 리프레이밍

### 수정 파일

| 파일                                          | 변경 내용                             |
| --------------------------------------------- | ------------------------------------- |
| `src/components/landing/comparison-table.tsx` | 제목, 부제, 컬럼 헤더, 하단 주석 변경 |

### AS-IS → TO-BE

**섹션 제목** (`comparison-table.tsx:31`):

```
AS: "마케팅 진단, 어디서 받으시나요?"
TO: "마케팅 진단의 첫 번째 단계, 어떻게 시작하시나요?"
```

**부제** (`comparison-table.tsx:33-34`):

```
AS: "같은 '마케팅 감사'도 범위와 방식이 다릅니다"
TO: "전략을 세우기 전에, 먼저 새는 곳을 찾아야 합니다"
```

**컬럼 헤더** (`comparison-table.tsx:43-49`):

```
AS: "대형 컨설팅펌*" | "마케팅 에이전시*" | "Findably"
TO: "마케팅 전략 컨설팅*" | "마케팅 실행 대행*" | "마케팅 기초체력 진단 (Findably)"
```

**하단 주석** (`comparison-table.tsx:78-87`): 기존 2개 유지 + 1개 추가:

```
추가: "💡 컨설팅은 전략을, 에이전시는 실행을, Findably는 그 전에 새고 ��는 구멍을 찾아드립니다.
      전략과 실행이 효과를 내려면, 먼저 기초체력이 갖춰져야 합니다."
```

### 검증

- [ ] 테이블 모바일 가로 스크롤 정상
- [ ] `pnpm build` 통과

---

## Task B-02 (7.13): 우선순위 산정 로직 설명 추가

### 수정 파일

| 파일                                                                 | 변경 내용                             |
| -------------------------------------------------------------------- | ------------------------------------- |
| `src/app/(dashboard)/reports/my/[id]/_components/RoadmapSection.tsx` | 로드맵 상단에 우선순위 설명 블록 추가 |
| `src/features/report/pdf/sections/PdfRoadmap.tsx`                    | PDF에도 동일 블록 추가                |

### 추가할 콘텐츠

RoadmapSection.tsx의 로드맵 아이템 렌더링 위에 정적 텍스트 블록 삽입:

```
📐 이 순서로 고치면 가장 빠르게 효과를 봅니다

우선순위는 3가지 기준으로 산정했습니다:
① 매출 영향 크기 — 이 문제가 얼마나 많은 돈을 새게 하는가
② 실행 난이도 — 얼마나 빨리, 쉽게 고칠 수 있는가
③ 복합 효과 — 이걸 고치면 다른 문제도 함께 해결되는가

→ 한마디로, "적은 노력으로 가장 큰 돈을 아끼는 순서"입니다.

| 🔴 높음 (즉시 실행) | 매출 영향 크고 + 난이도 쉬움~보통 |
| 🟡 보통 (1~2개월)   | 매출 영향 중간 또는 난이도 보통    |
| ⚪ 낮음 (여유)       | 매출 영향 작거나 난이도 높음       |
```

### 설계 원칙

- 정적 텍스트만. 별도 로직/데이터 불필요
- 기존 RoadmapSection 구조(주차별 그룹핑) 앞에 삽입
- 유료(isPaid=true)일 때만 표시

### 검증

- [ ] `/reports/my/[id]` 페이지에서 로드맵 위에 설명 블록 렌더링
- [ ] PDF 다운로드 시 동일 블록 포함
- [ ] `pnpm build` 통과

---

## Task E-01 (8.12): robots.txt + llms.txt 보강

### 수정 파일

| 파일                | 변경 내용                                                                  |
| ------------------- | -------------------------------------------------------------------------- |
| `src/app/robots.ts` | AI 봇 추가 (ChatGPT-User, Google-Extended, anthropic-ai, Claude-Web, Yeti) |
| `public/llms.txt`   | PRD v1.2 기준으로 전체 재작성 ("누수" 프레이밍 반영)                       |

### robots.ts 변경

현재 3개 봇(GPTBot, ClaudeBot, PerplexityBot)만 명시 → 8개로 확장:

```typescript
rules: [
  { userAgent: '*', allow: '/', disallow: [...] },
  {
    userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot',
                'Google-Extended', 'anthropic-ai', 'Claude-Web', 'Yeti'],
    allow: '/',
  },
],
```

### llms.txt 재작성

현재 llms.txt는 기본적인 내용. PRD v1.2 기준으로 전체 재작성:

- "새는 마케팅 비용" 프레이밍 반영
- 건당 9.9만원만 기재 (월 구독은 Phase 2이므로 제외)
- 차별점에 "원화 환산 우선순위" 추가

### sitemap.ts

현재 이미 5개 URL 포함. 변경 불필요.

### 검증

- [ ] `pnpm build` 후 /robots.txt, /llms.txt 응답 확인
- [ ] robots.txt에 8개 봇 허용 확인

---

## Task E-02 (8.13): Canonical URL + OG 메타 완성

### 수정 파일

| 파일                           | 변경 내용                                                |
| ------------------------------ | -------------------------------------------------------- |
| `src/config/seo.ts`            | defaultTitle, defaultDescription, landing 섹션 문구 변경 |
| `src/app/(marketing)/page.tsx` | A-01에서 OG 수정 + twitter card 추가 + canonical 추가    |

### 현재 상태

- `layout.tsx`: canonical ✅, OG ✅, twitter ✅ — 변경 불필요
- `(marketing)/page.tsx`: OG 있으나 twitter card 없음, canonical 없음
- `config/seo.ts`: 문구가 이전 프레이밍

### seo.ts 변경

```
AS: defaultTitle="Findably — AI 마케팅 진단"
TO: defaultTitle="AI 마케팅 진단, URL 하나로 시작 — Findably"

AS: defaultDescription="URL 하나로 SEO + GEO 통합 진단..."
TO: defaultDescription="웹사이트에서 새는 마케팅 비용부터 찾아드립니다..."

AS: landing.title="AI 마케팅 진단 — SEO + GEO 통합 분석 | Findably"
TO: landing.title="마케팅에 돈 쓰는데, 어디서 새고 있는지 모르겠다면 | Findably"

AS: landing.description="URL 하나로 SEO + GEO 통합 진단..."
TO: landing.description="웹사이트에서 새는 마케팅 비용부터 찾아드립니다. SEO, AI 검색(GEO) 통합 진단."
```

### (marketing)/page.tsx 보완

A-01에서 OG 변경 + 추가로:

- `alternates: { canonical: '/' }` 추가
- `twitter: { card: 'summary_large_image', ... }` 추가

### 검증

- [ ] `<link rel="canonical">` 랜딩에서 확인
- [ ] og:title이 A-01 H1 프레이밍과 일관
- [ ] twitter:card 메타 태그 존재
- [ ] `pnpm build` 통과

---

## 리스크

| 리스크                                              | 대응                                                |
| --------------------------------------------------- | --------------------------------------------------- |
| hero-section.tsx H1이 config 미참조 (하드코딩)      | config와 컴포넌트 두 곳 모두 수정. 불일치 주의      |
| OG 이미지 미존재 (/og/default.png, /og/landing.png) | E-06 (Phase 2)에서 제작 예정. 현재는 기존 경로 유지 |
| llms.txt에 월 구독 가격 기재 시 Phase 1과 불일치    | 건당 9.9만원만 기재. 월 구독은 Phase 2              |
| 모바일 H1 줄바꿈 어색할 수 있음                     | A-01 수정 후 375px에서 확인                         |

---

## 실행 순서

```
1. A-01 (모토/서브카피) — 프레이밍 기준 확정 (다른 Task가 참조)
2. A-02 (비교 테이블) — A-01 프레이밍과 일관
3. E-02 (OG 메타) — A-01 문구를 seo.ts에 반영
4. E-01 (봇 파일) — 독립 작업
5. B-02 (우선순위 설명) — 독립 작업
→ 커밋 → tsc → lint → build 검증
```

---

## 검증 게이트

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build
```

통과 시 → PR 생성 → main 머지 요청
