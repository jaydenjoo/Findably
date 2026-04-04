# Phase 1 Blueprint — 리포트 프레이밍 + 홈페이지 콘텐츠

> PRD: docs/Findably-PRD-홈페이지-리포트-정합성-v1_2.md
> 브랜치: feature/phase-1
> 총 4개 Task, 예상 ~5시간

---

## 목표

Phase 1 완료 시 상태:

1. 유료 리포트 최상단에 "마케팅 누수 브릿지" 섹션이 추가됨 (4개 영역 점수 테이블 포함)
2. CMO 경영진 요약이 비즈니스 언어로 생성됨 (기술 용어 → 비유 기반)
3. 랜딩 H1 아래에 SEO 보조 키워드 블록이 추가됨
4. 랜딩에 FAQ 7개 + Quick Answer가 추가됨 (FAQPage Schema 준비)

---

## Task B-01 (7.12): 리포트 도입부 "마케팅 누수 브릿지" 섹션

### 수정 파일

| 파일                                                                        | 변경 내용                              |
| --------------------------------------------------------------------------- | -------------------------------------- |
| `src/app/(dashboard)/reports/my/[id]/_components/BridgeSection.tsx`         | **신규** — 브릿지 컴포넌트             |
| `src/app/(dashboard)/reports/my/[id]/_components/DetailedReportContent.tsx` | BridgeSection 삽입 (CmoSummary 위)     |
| `src/features/report/pdf/sections/PdfBridgeSection.tsx`                     | **신규** — PDF용 브릿지                |
| `src/features/report/pdf/ReportDocument.tsx`                                | PdfBridgeSection 삽입 (커버 페이지 뒤) |

### BridgeSection 설계

```
Props: {
  categoryScores: CategoryScore[]  ← PaidAnalysisData.categoryScores
  isPaid: boolean
}
```

**렌더링 구조:**

```
┌─────────────────────────────────────────────────────┐
│ 🔍 마케팅 비용이 새는 곳을 찾았습니다                    │
│                                                      │
│ 광고를 돌려도, SNS를 해도, 콘텐츠를 만들어도 —          │
│ 고객이 당신의 웹사이트를 검색에서 찾을 수 없거나...      │
│                                                      │
│ ┌──────────────┬──────────────────────┬───────┐      │
│ │ 진단 영역     │ 마케팅에서의 의미     │ 점수  │      │
│ ├──────────────┼──────────────────────┼───────┤      │
│ │ SEO          │ Google에서 찾을 수..  │ 68/100│      │
│ │ GEO          │ AI가 추천하는가      │ 45/100│      │
│ │ 콘텐츠       │ 신뢰하고 행동하는가  │ 72/100│      │
│ │ 기술 인프라   │ 떠나지 않을 만큼..   │ 55/100│      │
│ └──────────────┴──────────────────────┴───────┘      │
│                                                      │
│ * 업종 평균 벤치마크 기준 추정치이며, 실제와 다를 수 있음 │
└─────────────────────────────────────────────────────┘
```

**카테고리 매핑** — `categoryScores`에서 ID 기준:

- `seo` → "SEO (검색 최적화)" / "Google에서 고객이 당신을 찾을 수 있는가"
- `geo` → "GEO (AI 검색 최적화)" / "ChatGPT, Perplexity가 당신을 추천하는가"
- `content` → "콘텐츠" / "방문한 고객이 신뢰하고 행동하는가"
- `technical` → "기술 인프라" / "고객이 떠나지 않을 만큼 빠르고 안정적인가"

**원화 환산**: C-01 (Phase 4) 완료 전이므로 총 매출 영향 금액은 표시하지 않음. 면책 문구만 포함.

**DetailedReportContent.tsx 삽입 위치:**

```
ReportHeader
→ BridgeSection (신규)     ← 여기
→ CmoSummarySection
→ SwotSection
→ RoadmapSection
→ ...
```

### 검증

- [ ] BridgeSection이 ReportHeader 바로 아래에 렌더링
- [ ] 4개 영역 점수가 실제 categoryScores와 일치
- [ ] isPaid=false면 BlurOverlay 적용
- [ ] PDF에도 동일 브릿지 섹션 포함
- [ ] 면책 문구 포함

---

## Task B-03 (7.14): 경영진 요약 문구 수정

### 수정 파일

| 파일                           | 변경 내용                   |
| ------------------------------ | --------------------------- |
| `src/config/diagnosis-paid.ts` | CMO_AGENT systemPrompt 수정 |

### CMO 프롬프트 변경

현재 프롬프트(`diagnosis-paid.ts:523-540`)의 `<context>` 섹션에 추가:

```
AS-IS context:
- 이 리포트가 전체 진단의 "최종 요약"이자 "실행 계획서".
- 단순 숫자 나열 절대 금지
- 전략적 서사 ...

TO-BE context (추가):
- 첫 문장은 반드시 "마케팅 비용이 새고 있는 구멍이 N개 발견되었습니다" 패턴.
- 기술 용어(LCP, Canonical, Core Web Vitals 등) 사용 금지. 대신 비유 기반 설명.
  예: "페이지가 너무 느려서 방문자 절반이 떠남", "AI 검색에서 추천받지 못하고 있음"
- 마지막 문장에 반드시 다음 행동 안내: "아래 90일 로드맵의 '즉시 실행' 항목부터 시작하세요."
- 원화 환산이 가능하면 포함하되, 불가능하면 정성적 표현 사용.
```

### 설계 원칙

- CMO 에이전트의 프롬프트만 수정. 코드 로직 변경 없음.
- 기존 output 구조(executive_summary + quality_score + issues_found) 변경 없음.
- 이미 생성된 리포트는 영향 없음. 신규 유료 분석부터 적용.

### 검증

- [ ] `pnpm build` 통과 (프롬프트 변경만이라 타입 에러 없음)
- [ ] 프롬프트 내 "비즈니스 언어 우선" 지시 포함
- [ ] "다음 행동" 안내 지시 포함

---

## Task E-04 (8.15): H1 키워드 최적화 + Title 태그 조정

### 수정 파일

| 파일                                      | 변경 내용                       |
| ----------------------------------------- | ------------------------------- |
| `src/components/landing/hero-section.tsx` | H1 아래에 보조 키워드 블록 추가 |
| `src/app/(marketing)/page.tsx`            | Title 태그 50자 이내 조정       |

### hero-section.tsx 변경

현재 badge(`line:54-61`): "마케팅 진단부터 실행 우선순위까지, 한 번에 끝내는 마케팅 진단"

이 badge를 SEO 키워드 보조 블록으로 활용:

```
AS: "마케팅 진단부터 실행 우선순위까지, 한 번에 끝내는 마케팅 진단"
TO: "AI 마케팅 진단 서비스 | SEO + GEO 통합 분석"
```

→ 기존 badge 위치를 유지하면서 핵심 키워드("AI 마케팅 진단", "SEO", "GEO") 삽입.
→ H1은 Phase 0에서 확정된 감성 모토 유지.

### page.tsx Title 변경

현재: `"마케팅에 돈 쓰는데, 어디서 새고 있는지 모르겠다면 | Findably"` (38자 — 이미 50자 이내 ✅)

→ 변경 불필요. E-02에서 이미 최적화됨.

### 검증

- [ ] H1 위 badge에 "AI 마케팅 진단" 키워드 포함
- [ ] H1 자체는 변경 없음 (Phase 0 확정)
- [ ] Title 50자 이내 (현재 38자 ✅)

---

## Task E-05 (8.17): FAQ 섹션 + Quick Answer 구조 추가

### 수정/생성 파일

| 파일                                      | 변경 내용                                     |
| ----------------------------------------- | --------------------------------------------- |
| `src/config/landing.ts`                   | `faq` 데이터 배열 추가 (7개 Q&A)              |
| `src/components/landing/faq-section.tsx`  | **신규** — FAQ 아코디언 컴포넌트              |
| `src/components/landing/hero-section.tsx` | Quick Answer 블록 추가 (H1 아래, URL 입력 위) |
| `src/app/(marketing)/page.tsx`            | FAQ 섹션 import + Pricing 뒤에 삽입           |

### config/landing.ts — FAQ 데이터

```typescript
faq: {
  title: '자주 묻는 질문',
  items: [
    { q: '마케팅 진단이 왜 필요한가요?', a: '중소기업 73%가...' },
    { q: 'Findably는 어떤 서비스인가요?', a: 'URL 하나만...' },
    { q: '진단은 얼마나 걸리나요?', a: '약 60초면...' },
    { q: '기존 SEO 대행업체와 어떤 차이가 있나요?', a: '대행업체는...' },
    { q: 'GEO(AI 검색 최적화)란 무엇인가요?', a: 'ChatGPT...' },
    { q: '진단 결과는 얼마나 정확한가요?', a: 'Google 알고리즘...' },
    { q: '무료 진단만 받아도 되나요?', a: '네. 첫 진단은...' },
  ],
}
```

→ PRD v1.2 Section E-05의 Q&A 텍스트 그대로 사용.

### faq-section.tsx 설계

- `'use client'` (아코디언 상호작용 필요)
- `<details>/<summary>` 시맨틱 HTML 사용 (접근성 + SEO)
- framer-motion으로 펼침/접힘 애니메이션
- `aria-labelledby="heading-faq"`
- 통계 출처 인라인 표기 (Constant Contact 2025)

**섹션 순서 (page.tsx):**

```
... → Pricing → FAQ (신규) → BottomCTA
```

### hero-section.tsx — Quick Answer

H1과 서브카피 사이 또는 서브카피 바로 아래에 한 줄 추가:

```html
<p class="text-sm text-slate-400 max-w-xl">
  <strong>Findably</strong>는 URL 하나만 입력하면 AI가 SEO + GEO 통합 진단을
  제공하는 마케팅 진단 플랫폼입니다.
</p>
```

→ 시각적으로 작게, 검색엔진이 서비스 설명을 파악할 수 있도록.

### 검증

- [ ] FAQ 섹션이 Pricing 아래, BottomCTA 위에 렌더링
- [ ] 7개 Q&A가 아코디언으로 동작 (클릭 시 펼침/접힘)
- [ ] 시맨틱 HTML (`<details>/<summary>`)
- [ ] Quick Answer가 히어로에 표시
- [ ] 모바일에서 FAQ 정상 동작
- [ ] `pnpm build` 통과

---

## 리스크

| 리스크                                       | 대응                                                      |
| -------------------------------------------- | --------------------------------------------------------- |
| BridgeSection에 categoryScores가 없는 경우   | 빈 배열일 때 "진단 데이터 준비 중" fallback 표시          |
| CMO 프롬프트 변경 → 기존 리포트 영향         | 기존 리포트는 이미 저장된 텍스트라 영향 없음. 신규만 적용 |
| FAQ가 너무 길어 CTA까지 스크롤 증가          | 기본 접힌 상태. 열린 항목은 하나만 (아코디언)             |
| PDF 브릿지 섹션이 페이지 넘침                | 커버 다음 새 페이지에 배치                                |
| PaidAnalysisData에서 카테고리 점수 매핑 오류 | categoryScores의 id 필드로 매핑, 없는 카테고리는 "-" 표시 |

---

## 실행 순서

```
1. B-01 (브릿지 섹션) — 가장 큰 변경. 웹+PDF 컴포넌트 신규 생성
2. B-03 (CMO 프롬프트) — config 텍스트만 수정. 독립 작업
3. E-04 (H1 키워드) — badge 텍스트 변경. 독립 작업
4. E-05 (FAQ) — 신규 컴포넌트 + config 데이터 + page.tsx 수정
→ 커밋 → tsc → lint → build 검증
```

---

## 검증 게이트

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build
```

통과 시 → PR 생성 → main 머지 요청
