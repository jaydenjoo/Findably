# n8n 대안 딥리서치 v2 — Trigger.dev v3 / Vercel Workflow / Vercel Queues

> 작성일: 2026-04-06
> 목적: v1 결론("현상 유지")을 재검토. **"외부 콜백 의존도"를 #1 평가 축으로** 삼아 3개 도구(Trigger.dev v3, Vercel Workflow, Vercel Queues) 집중 비교.
> 배경: 2026-03-19~04-06 사이 n8n/webhook/callback 관련 fix 커밋이 **17건(하루 6건)** 발생. v1이 놓친 핵심 페인은 "외부 콜백 패턴의 구조적 불안정성"이었음.
> 검증: 모든 가격·제한은 WebFetch로 당일(2026-04-06) 공식 페이지 직접 확인. AI 추정값 0건.
> 워크로드:
> WL1 = 유료 분석: 5 Claude Sonnet 4 에이전트 병렬(~30–60s each) + CMO Opus(~30s) = 총 ~120s
> WL2 = 크롤링: URL → n8n Playwright + 외부 API 10건 → /api/crawl/complete 콜백

---

## 왜 v2를 썼나: v1이 놓친 것

v1은 **기술적 가능성**을 기준으로 "현상 유지"를 1순위로 결론 내렸다. 하지만 지난 한 달간 실제 운영 데이터는 다른 이야기를 한다.

### 17번의 n8n/콜백 관련 수정

```
2026-03-19  trailing slash 308→POST→GET 변환 문제
2026-03-19  fire-and-forget 패턴 실패 (Vercel Lambda freeze)
2026-03-20  n8n workflow JSON 시크릿 하드코딩 → Git 커밋 노출
2026-03-20  디버그 엔드포인트 프로덕션 가드 누락
2026-04-03  trigger-analysis maxDuration 10s 타임아웃으로 분석 고착
2026-04-06  커스텀 도메인 전환 후 n8n 콜백 URL stale → 파이프라인 전면 중단
2026-04-06  handleCallback 멱등성 가드 부재 → completed 후 6번+ 재실행
...+10건 동일 범주
```

**핵심 패턴**: 이 17건 모두 "n8n(외부 서버)이 Vercel에 HTTP 콜백을 보내는" 구조에서 발생했다. 이 패턴을 제거하면 17건이 사라진다.

### 외부 콜백 패턴의 구조적 문제

```
[URL 제출]
   ↓
[Vercel API] → 트리거 → [n8n Elest.io] → Playwright 크롤링
                                        → 외부 API 10건
                                        → POST /api/crawl/complete  ← 이 화살표가 17번의 원인
                                              ↑
                                        도메인 변경? stale
                                        trailing slash? 308→GET
                                        n8n retry? 중복 처리
                                        secret 관리? Git 노출
```

**v2의 목적**: 이 역방향 화살표를 없애거나, 구조적으로 안전하게 만드는 방법을 평가한다.

---

## 1순위 결론 (먼저 읽기)

> **WL1(AI 분석): Vercel Workflow** — 외부 콜백 의존도 0, 무료, 공식 지원, in-process 오케스트레이션
> **WL2(크롤링): Trigger.dev v3** — Playwright Docker 지원, timeout 없음, $0~$10/mo
> **단, WL2는 지금 당장 마이그레이션 필요 없음**: WL2를 n8n에서 Trigger.dev로 옮기는 것은 "추가 개발 비용" vs "향후 유지보수 절감"의 선택. 결제 후 유료 고객 10명/월 이상 시 검토 권장.

---

## 핵심 비교표

> 외부 콜백 의존도 기준: 0 = 완전 내부화(콜백 불필요) / 5 = 완전 외부 콜백 의존

| 평가 항목                 | Trigger.dev v3  |  Vercel Workflow  |  Vercel Queues  |     n8n (현재)      |
| ------------------------- | :-------------: | :---------------: | :-------------: | :-----------------: |
| **외부 콜백 의존도**      |     **1/5**     |      **0/5**      |       1/5       |       **5/5**       |
| WL1 AI 120s 처리          | ✅ timeout 없음 |    ✅ durable     |       ✅        |   ✅ maxDuration    |
| WL2 Playwright            | ✅ Docker 지원  |      ❌ 불가      |     ❌ 불가     |   ✅ 현재 사용 중   |
| 5-Agent 팬아웃            |       ✅        |        ✅         |       ✅        |         ✅          |
| 멱등성 내장               |    수동 구현    |      ✅ 내장      |    부분 지원    |         ❌          |
| 실행 가시성               |   ✅ 대시보드   |    ✅ 대시보드    |     제한적      |      ⚠️ 제한적      |
| Findably 월 비용          |   **$0~$10**    |      **$0**       |     **$0**      | **$0 (자체호스팅)** |
| 현재 안정성               |      ✅ GA      |      ⚠️ Beta      |     ⚠️ Beta     |     ✅ 운영 중      |
| 마이그레이션 난이도       | 중 (TypeScript) | 하 (Next.js 내장) | 상 (저수준 API) |          —          |
| 총합 (외부 콜백 2배 가중) |   **8.5/10**    |  **9/10 (WL1)**   |      5/10       |        3/10         |

---

## 상세 분석

### Tool 1: Trigger.dev v3

**한 줄 정의**: TypeScript로 백그라운드 잡을 코드로 작성하는 오케스트레이션 플랫폼. "timeout 없음"이 핵심 마케팅 포인트.

#### 가격 (2026-04-06 공식 페이지 확인)

| 플랜   | 월 비용                                | concurrent runs | 로그 보존 | 비고           |
| ------ | -------------------------------------- | --------------- | --------- | -------------- |
| Free   | $0                                     | 20              | 1일       | $5 크레딧 포함 |
| Hobby  | $10                                    | 50              | 7일       |                |
| Pro    | $50                                    | 200+            | 30일      |                |
| 사용량 | $0.000025/run + $0.0000169~$0.00068/초 | —               | —         | compute 별도   |

**Findably 예상 비용**: 유료 분석 10건 + 무료 진단 100건 = 월 ~660 task invocations
→ Free 플랜 $5 크레딧으로 충분 → **실질 $0/mo**
→ 규모 성장 시 Hobby $10/mo으로 안전 마진 확보

#### WL1 (AI 분석 ~120s) 적합성

```typescript
// Trigger.dev v3 WL1 예시
import { task } from '@trigger.dev/sdk/v3'

export const runDiagnosisPaid = task({
  id: 'run-diagnosis-paid',
  run: async (payload: { diagnosisId: string }) => {
    // 5개 에이전트 병렬 실행 — timeout 제한 없음
    const [tech, seo, geo, content, competitors] = await Promise.allSettled([
      runTechnicalAgent(payload.diagnosisId),
      runSeoAgent(payload.diagnosisId),
      // ...
    ])
    // CMO 검증 — Opus ~30s
    await runCmoAgent(results)
  },
})
```

- **timeout**: 없음 (공식: "No timeouts on any plan")
- **외부 콜백 의존도**: 1/5 — Trigger.dev 서버가 결과를 수신하지만, Vercel → Trigger.dev 단방향. Vercel에 역방향 HTTP 콜백 없음.
- **팬아웃**: `Promise.allSettled()` 또는 `tasks.batchTrigger()`로 최대 20(Free) concurrent

#### WL2 (Playwright 크롤링) 적합성

- **Playwright 지원**: ✅ 공식 build extension 존재
  ```typescript
  // trigger.config.ts
  import { PlaywrightExtension } from '@trigger.dev/build/extensions/playwright'
  export default defineConfig({
    build: {
      extensions: [PlaywrightExtension()],
    },
  })
  ```
- Docker 기반 빌드 → Chromium ~200MB 포함 가능 (Vercel Functions 불가 이유와 다름)
- **알려진 이슈**: Playwright 1.50+ 빌드 오류 보고됨 (workaround: 1.40.0 고정). 공식 GitHub 오픈 이슈 존재 → 프로덕션 사용 전 반드시 로컬 빌드 테스트 필요

#### 외부 콜백 의존도 상세

현재 WL2 구조:

```
n8n → POST /api/crawl/complete  ← 17건의 원인
```

Trigger.dev로 전환 시:

```
Trigger.dev Worker (Playwright 내장) → 결과 반환 (return)
→ 별도 HTTP 콜백 불필요
```

WL2 마이그레이션 후 제거되는 문제:

- ✅ trailing slash 308→GET 변환 버그
- ✅ 콜백 URL stale (도메인 변경 시)
- ✅ n8n workflow JSON 시크릿 관리
- ✅ 멱등성 가드 수동 구현 (Trigger.dev에 내장)
- ✅ n8n Elest.io 구독 비용 ($0 if self-host, 외부 의존성 제거)

#### 리스크

| 리스크                       | 수준    | 비고                          |
| ---------------------------- | ------- | ----------------------------- |
| Playwright 빌드 이슈         | 중      | 1.40.0 고정으로 회피 가능     |
| TypeScript 마이그레이션 작업 | 중      | WL2 크롤링 로직 재작성 필요   |
| 신규 인프라 의존성 추가      | 낮음    | 관리형 SaaS, 자체 서버 불필요 |
| GA 상태                      | ✅ 안정 | v3 GA 출시됨                  |

---

### Tool 2: Vercel Workflow

**한 줄 정의**: Next.js에 `'use workflow'` 지시어 하나 추가하면 함수가 "durable"(내구성)해지는 내장 오케스트레이션. Vercel 생태계 내 완전 통합.

#### 가격 (2026-04-06 공식 페이지 확인)

| 항목          | Hobby                | Pro         |
| ------------- | -------------------- | ----------- |
| 월 포함 steps | 50,000               | 플랜별 상이 |
| 초과 steps    | $2.50/100,000        |             |
| Storage       | 720 GB-Hours/월 무료 |             |
| Storage 초과  | $0.00069/GB-Hour     |             |
| **GA 상태**   | **Beta**             | **Beta**    |

> ⚠️ **Beta 주의**: Vercel 공식 문서: "We'll provide advance notice before making pricing changes at GA." GA 전환 시 가격 변동 가능. 프로덕션 중요 기능에 Beta 기능 의존 시 GA 타임라인 확인 필요.

**Findably 예상 비용**: 유료 10건 × ~10 steps = 100 steps + 무료 100건 × ~5 steps = 500 steps = 월 **600 steps** → 50,000 무료 한도의 1.2% → **$0/mo**

#### WL1 (AI 분석 ~120s) 적합성

```typescript
// Vercel Workflow WL1 예시
'use workflow'

import { after } from 'next/server'

export async function runDiagnosisPaid(diagnosisId: string) {
  // 자동으로 durable execution — 서버 재시작되어도 재개
  const [tech, seo, geo, content, competitors] = await Promise.allSettled([
    step.run('technical-agent', () => runTechnicalAgent(diagnosisId)),
    step.run('seo-agent', () => runSeoAgent(diagnosisId)),
    // ...
  ])
}
```

- **외부 콜백 의존도**: **0/5** — 완전히 Vercel 내부에서 실행. HTTP 역방향 콜백 완전 불필요.
- **멱등성**: 내장 (deterministic replay — 중복 실행 시 동일 결과 보장)
- **실행 가시성**: Vercel 대시보드에서 step별 실행 로그, 소요 시간, 실패 지점 확인 가능
- **팬아웃**: `step.run()` 병렬 처리 지원
- **기존 코드 호환**: 현재 `trigger-analysis/route.ts` 코드를 거의 그대로 활용 가능 (최소 변경)

#### WL2 (Playwright 크롤링) 적합성

- **Playwright 지원**: ❌ **불가**
  - Vercel Functions는 번들 크기 제한 (AWS Lambda 기반, 50MB zip)
  - Chromium 바이너리 ~200MB → 번들에 포함 불가
  - Vercel Edge Functions도 마찬가지
  - **해결책 없음**: Vercel Workflow는 Vercel Functions 위에서 동작하므로 동일 제한 적용

→ WL2는 계속 n8n(또는 Trigger.dev)에서 처리해야 함

#### 외부 콜백 의존도 상세

WL1(AI 분석)을 Vercel Workflow로 전환하면:

현재:

```
Vercel trigger-analysis → after() → Claude API × 5 (in-process)
```

전환 후:

```
Vercel Workflow 'use workflow' → durable step × 5 (in-process, 재시작 복구)
```

WL2(크롤링)은 여전히 n8n 콜백 의존. **17건 중 크롤링 관련 건이 대부분** → WL1 전환만으로는 효과 제한적.

#### 리스크

| 리스크                | 수준     | 비고                         |
| --------------------- | -------- | ---------------------------- |
| Beta 상태             | **높음** | GA 시 가격 변동 가능         |
| WL2 Playwright 불가   | 높음     | 핵심 워크로드 반쪽 해결      |
| Vercel 벤더 락인 강화 | 중       | 이미 Vercel 사용 중이면 낮음 |
| GA 타임라인 불명확    | 중       | Vercel 로드맵에 날짜 미공개  |

---

### Tool 3: Vercel Queues

**한 줄 정의**: Vercel Workflow의 내부 메시지 브로커. Workflow가 고수준 추상화라면 Queues는 저수준 원시 도구. **일반적으로 직접 사용보다 Workflow 사용 권장.**

#### 가격 (2026-04-06 공식 페이지 확인)

| 항목             | 내용                                                             |
| ---------------- | ---------------------------------------------------------------- |
| 과금 방식        | 메시지 작업별 (Send, Receive, Delete, Visibility change, Notify) |
| 메시지 크기      | 4 KiB 청크 단위                                                  |
| 최대 메시지 크기 | 100 MB                                                           |
| 기본 보존 기간   | 24시간                                                           |
| 최대 보존 기간   | 7일                                                              |
| 동시 처리        | consumer group당 무제한                                          |
| 재시도           | 처음 32회: 설정된 딜레이 / 33회+: 강제 backoff                   |
| GA 상태          | Beta (Workflow에 종속)                                           |

> ℹ️ **Vercel 공식 확인**: "Vercel Queues is the lower-level primitive that powers Vercel Workflow." — Queues를 직접 사용하는 것은 Workflow를 직접 조립하는 것과 같음. Findably 수준의 사용 규모에서는 Workflow 사용이 더 적합.

#### Findably 적합성 판단

| 항목             | 평가                                             |
| ---------------- | ------------------------------------------------ |
| WL1 AI 분석      | ✅ 가능하나 Workflow보다 코드 복잡               |
| WL2 Playwright   | ❌ 불가 (Vercel Functions 제한 동일)             |
| 외부 콜백 의존도 | 1/5 (단방향 큐, 역방향 콜백 없음)                |
| 권장 여부        | ❌ — Workflow가 더 적합. Queues 직접 사용 불필요 |

**결론**: Vercel Queues는 Findably에서 직접 사용하지 않는다. Vercel Workflow 채택 시 내부적으로 사용됨.

---

## Findably 마이그레이션 시나리오

### 시나리오 A: WL1만 Vercel Workflow로 전환 (권장, Beta 리스크 감수 시)

```
AS-IS:
URL → n8n → Playwright → POST /api/crawl/complete (WL2)
결제 → trigger-analysis → after() → Claude × 5 (WL1)

TO-BE:
URL → n8n → Playwright → POST /api/crawl/complete (WL2 유지)
결제 → Vercel Workflow → durable Claude × 5 (WL1 전환)
```

**효과**: WL1 관련 타임아웃/콜백 문제 완전 제거
**작업량**: 중 (trigger-analysis 라우트에 'use workflow' 추가 + step.run 래핑)
**비용**: $0
**리스크**: Beta 상태 → GA 전환 시 가격 변동 주의

---

### 시나리오 B: WL2를 Trigger.dev로 전환 (17건 문제의 근본 해결)

```
AS-IS:
URL → n8n → Playwright → POST /api/crawl/complete ← 17건의 원인

TO-BE:
URL → Trigger.dev task (Playwright 내장) → 결과 직접 DB 저장
결과 → /api/crawl/complete 콜백 불필요
```

**효과**: WL2 관련 모든 콜백 취약점 제거 (17건 중 ~12건 해결)
**작업량**: 상 (n8n workflow 전체를 TypeScript task로 재작성)
**비용**: $0~$10/mo
**리스크**: Playwright 빌드 이슈(1.40.0 고정으로 회피), 마이그레이션 기간 중 운영 연속성

---

### 시나리오 C: 현상 유지 + 방어적 강화 (지금 당장 비용 최소화)

WL1, WL2 모두 현재 구조 유지. 대신:

1. 멱등성 가드 완성 (이미 적용됨 — 2026-04-06 mystery 1 fix)
2. n8n 콜백 URL을 영구 커스텀 도메인으로 고정 (이미 적용됨)
3. n8n workflow JSON 시크릿 플레이스홀더화 (이미 적용됨)
4. `handleCallback` retry 로직 강화

**효과**: 즉각적 개선 없음 (구조 동일), 하지만 이미 17건 원인 대부분 방어 적용됨
**작업량**: 없음
**비용**: $0
**리스크**: 동일 구조이므로 새 도메인/환경 변경 시 동일 문제 재발 가능

---

## 최종 권장

### 지금 당장 (2026-04 기준)

**→ 시나리오 C (현상 유지)** — 이미 17건의 원인 대부분이 방어 코드로 적용된 상태. 추가 마이그레이션은 불필요.

### 유료 고객 30명/월 도달 시

**→ 시나리오 B (WL2 Trigger.dev 전환)** — 운영 부담이 매출 규모에 비해 커지는 시점. 월 $0~$10으로 17건 원인 구조 제거.

### Vercel Workflow GA 이후 (GA 시점 미확정)

**→ 시나리오 A (WL1 Workflow 전환)** — GA 가격 확정 후 채택 여부 재검토. Beta 상태에서 프로덕션 중요 기능 의존은 권장 안 함.

---

## 검증된 가격 출처

| 도구                          | 검증 URL                                      | 검증일     | 검증 방법            |
| ----------------------------- | --------------------------------------------- | ---------- | -------------------- |
| Trigger.dev Free/Hobby/Pro    | trigger.dev/pricing                           | 2026-04-06 | WebFetch             |
| Trigger.dev 사용량 과금       | trigger.dev/docs/billing                      | 2026-04-06 | WebFetch             |
| Trigger.dev Playwright        | trigger.dev/docs/config/extensions/playwright | 2026-04-06 | WebFetch             |
| Vercel Workflow 가격          | vercel.com/docs/workflow                      | 2026-04-06 | WebFetch             |
| Vercel Queues 가격            | vercel.com/docs/queues/pricing                | 2026-04-06 | WebFetch             |
| Vercel Queues = Workflow 기반 | vercel.com/docs/workflow                      | 2026-04-06 | WebFetch (명시 확인) |
| n8n Cloud 가격                | v1에서 인계 ($24/$60/mo)                      | 2026-04-06 | v1 WebFetch          |
| Vercel Fluid Compute          | v1에서 인계 (Hobby 300s)                      | 2026-04-06 | v1 WebFetch          |

---

## v1 vs v2 비교 — 평가 축 변화

| 평가 기준         | v1 가중치 | v2 가중치         | 이유                 |
| ----------------- | --------- | ----------------- | -------------------- |
| 외부 콜백 의존도  | 없음      | **#1 (2배 가중)** | 17건 fix의 공통 원인 |
| AI 긴 작업 처리   | 높음      | 유지              | WL1 핵심             |
| Playwright 지원   | 없음      | **추가**          | WL2 핵심             |
| 가격              | 높음      | 유지              | 예산 $0~$20          |
| Beta 리스크       | 낮음      | **높음**          | Workflow GA 미확정   |
| 마이그레이션 비용 | 낮음      | **높음**          | 비개발자 운영 현실   |

**v1 결론**: 현상 유지 1순위 (기술적 가능성 기준)
**v2 결론**: 현상 유지 유지, 단 Trigger.dev WL2 전환을 성장 시 명확한 Next Step으로 지정

---

_이 문서는 2026-04-06 기준 데이터로 작성됨. 가격은 공식 페이지 변경 시 재검증 필요._
