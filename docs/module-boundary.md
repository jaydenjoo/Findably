# 모듈 경계 — Findably

> 어떤 모듈이 뭘 하는지, 의존성은?
> **규칙**: features/ 간 직접 import 금지. 타입은 읽기만 허용. 외부 서비스는 lib/adapters/ 통해서만.

---

## 📋 10개 모듈 의존성 맵

| #   | 모듈               | 폴더                     | 책임                                                                  | 의존                                                                       | 상태         |
| --- | ------------------ | ------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------ |
| 1   | **onboarding**     | features/onboarding/     | URL 입력 + 선택 정보 수집 → diagnoses 레코드 생성                     | crawling (→), lib/adapters                                                 | ✅ 독립      |
| 2   | **crawling**       | features/crawling/       | 4-Layer 수집 (Playwright + Google APIs + OSS 도구) → Layer 1-3 데이터 | lib/adapters/crawler                                                       | ✅ 기반층    |
| 3   | **diagnosis-free** | features/diagnosis-free/ | 룰 기반 점수 (50+ 규칙) → 종합점수 + 카테고리 점수 + Quick Win        | crawling ← types 읽기, lib/adapters                                        | ✅ 소비층    |
| 4   | **diagnosis-paid** | features/diagnosis-paid/ | 5-Agent AI 분석 + CMO 검증 → 상세 인사이트 + SWOT + 로드맵            | diagnosis-free (← types), geo-engine, lib/adapters/ai                      | ⚠️ 타입 읽기 |
| 5   | **geo-engine**     | features/geo-engine/     | GEO 점수 계산 (AI 인용 가능성) + 실제 추적                            | crawling ← types, lib/adapters/ai                                          | ⚠️ 타입 읽기 |
| 6   | **competitors**    | features/competitors/    | 경쟁사 수집 + 병렬 크롤링 + 비교 매트릭스                             | diagnosis-paid (← CompetitorAnalysis type), crawling ← types, lib/adapters | ⚠️ 타입 읽기 |
| 7   | **report**         | features/report/         | 웹 + PDF 리포트 생성/조회                                             | diagnosis-free, diagnosis-paid ← types, lib/adapters/pdf                   | ⚠️ 타입 읽기 |
| 8   | **actions**        | features/actions/        | Schema/메타태그 코드 생성 + CMS 감지 기반 가이드                      | diagnosis-free, diagnosis-paid ← types                                     | ⚠️ 타입 읽기 |
| 9   | **payment**        | features/payment/        | Toss Payments 건당 결제 (🔴 보안)                                     | lib/adapters/payment (직접 호출 금지)                                      | ✅ 격리      |
| 10  | **sample**         | features/sample/         | 그린테크 샘플 리포트 데이터 (모의)                                    | diagnosis-free, diagnosis-paid ← types                                     | ✅ 모의      |

---

## 🔄 의존성 그래프 (Directed Acyclic Graph)

```
┌─────────────────────────────────────────────────┐
│ lib/adapters/ (모든 외부 서비스 진입점)          │
│  └─ ai.ts, crawler.ts, payment.ts, pdf.ts, ... │
└─────────────────────────────────────────────────┘
                        ↑
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
crawling (4-Layer)   onboarding (입력)    payment (결제)
    ↓
diagnosis-free (무료 점수)
    ↑
    ├─ diagnosis-paid (5-Agent 분석)
    ├─ geo-engine (AI 인용 추적)
    ├─ competitors (경쟁사 분석)
    ├─ report (리포트 생성)
    ├─ actions (코드 생성)
    └─ sample (샘플 리포트)

특성: 모두 단방향 흐름 (역방향 import 없음)
순환: 0건
```

---

## ⚠️ 타입 공유 — 의도적 설계 (읽기 의존)

### 패턴: diagnosis-free가 "타입 제공자"

**diagnosis-free/types.ts** (25개 export)

```typescript
// 모든 카테고리 점수 관련 타입
export type CategoryId = 'technical' | 'seo' | 'geo' | 'content' | ...
export interface CategoryScore { ... }
export interface QuickWin { ... }
```

**diagnosis-paid/types.ts** (8개 import)

```typescript
import type { CategoryId, CategoryScore, ... } from '@/features/diagnosis-free'
// 자신의 확장 타입만 export
export interface AIInsight { category: CategoryId | 'seo' }
```

**competitors/types.ts** (1개 import)

```typescript
import type { CompetitorAnalysis } from '@/features/diagnosis-paid'
```

### 평가

- ✅ **순환 의존 없음**: 모두 단방향 (diagnosis-free ← diagnosis-paid ← competitors)
- ✅ **런타임 안전**: 타입만 import이므로 번들 중복 없음
- ✅ **표준 패턴**: 타입 공유는 기본 동작, 구현 분리와 다름

### Phase 2 개선안 (현재는 YAGNI)

공유 타입을 `src/shared/types/diagnosis.ts`로 중앙화 가능하지만, 순환 위험 없으므로 필수 아님.

---

## 🛡️ 접근 제어 (features/ 간)

| 시나리오                                        | 허용 | 이유                             |
| ----------------------------------------------- | ---- | -------------------------------- |
| `diagnosis-paid` → `diagnosis-free` 타입 import | ✅   | 읽기 의존, 순환 안 함            |
| `diagnosis-paid` → `diagnosis-free` 함수 호출   | ❌   | 구현 결합 증가                   |
| `report` → `diagnosis-paid` 타입 import         | ✅   | 리포트 생성에 필요한 데이터 타입 |
| `crawling` → `diagnosis-free` 호출              | ❌   | 계층 초월 (adapter 통해야 함)    |
| 모든 모듈 → `lib/adapters/`                     | ✅   | 일원화된 외부 서비스 진입점      |

---

## 🔌 lib/adapters/ — 외부 서비스 격리

| Adapter       | 담당 서비스         | 교체 가능                  | 현재            |
| ------------- | ------------------- | -------------------------- | --------------- |
| ai.ts         | Claude API          | OpenAI, Gemini, Perplexity | Claude Sonnet 4 |
| crawler.ts    | n8n 웹훅            | Apify, Firecrawl           | n8n 자동화      |
| payment.ts    | Toss Payments       | Stripe                     | 건당 결제       |
| pdf.ts        | ReportLab/Puppeteer | —                          | ReportLab       |
| email.ts      | Resend              | Postmark                   | 이메일 전송     |
| openai.ts     | OpenAI API          | —                          | AI 인용 추적용  |
| gemini.ts     | Gemini API          | —                          | 폴백            |
| perplexity.ts | Perplexity API      | —                          | 폴백            |

**규칙**: features/에서 외부 서비스 직접 호출 금지. `lib/adapters/[service].ts` import만.

---

## 📍 config/ — 매직 넘버 제로

| 파일              | 관리 내용                                  | 참조처                       |
| ----------------- | ------------------------------------------ | ---------------------------- |
| scoring.ts        | 50+ 진단 규칙, getScoreColor()             | diagnosis-free, geo-engine   |
| diagnosis-paid.ts | 5-Agent 스펙, 토큰 가격, MIN_SUCCESS_COUNT | diagnosis-paid 에이전트 실행 |
| pricing.ts        | 건당 9.9만원, 할인율                       | payment                      |
| crawling.ts       | Playwright 타임아웃, User-Agent, 봇 리스트 | crawling 서비스              |
| access-control.ts | Free/Paid 경계, 기능 게이트                | 모든 라우트                  |
| seo.ts            | robots.txt, llms.txt, sitemap 규칙         | pages/layout, 루트 핸들러    |
| site.ts           | 사이트 메타 (title, description, domain)   | 모든 페이지 metadata         |
| navigation.ts     | GNB, footer 메뉴                           | layout, footer 컴포넌트      |
| landing.ts        | 랜딩 섹션 데이터                           | landing 페이지               |
| report.ts         | PDF 템플릿 설정                            | report/pdf 생성기            |
| features.ts       | 기능 플래그 (Phase 2)                      | 모든 모듈                    |

**평가**: ✅ features/ 내 하드코딩 없음. 모두 config/에서 관리.

---

## ✅ 규칙 체크리스트

- [x] features/A → features/B 직접 import 없음
- [x] 타입 공유는 읽기만 (써쓰기 의존 없음)
- [x] 순환 의존 0건
- [x] 모든 외부 서비스 → lib/adapters/
- [x] 매직 넘버 → config/
- [x] 모듈 index.ts가 공개 API 정의
- [x] 각 모듈이 명확한 책임 1개

**결론**: 95% 우수. 선택적 개선: shared/types/diagnosis.ts 중앙화 (Phase 2)
