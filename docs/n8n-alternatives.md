# n8n 대안 딥리서치 — Findably 백그라운드 잡/오케스트레이션

> 작성일: 2026-04-06
> 목적: Findably의 현재 n8n(Elest.io) 구조를 유지/교체 여부 결정을 위한 검증된 가격 + 기술 비교
> 검증 방법: 모든 가격은 공식 페이지 직접 크롤링 또는 WebSearch로 당일 확인 (AI 추정값 0건)

---

## 한눈에 보기

| 도구                               | 무료 한도                 | 유료 시작가         | AI 60s+ 작업      | 5-Agent 팬아웃               | Findably 월 비용 | 판정                |
| ---------------------------------- | ------------------------- | ------------------- | ----------------- | ---------------------------- | ---------------- | ------------------- |
| **Vercel Fluid Compute + after()** | Hobby 300s/요청, 무제한   | Pro $20/mo          | ✅ (300s)         | ✅ (in-function concurrency) | **$0 추가**      | ✅ 1순위            |
| **Trigger.dev v3**                 | $5 크레딧, 20 concurrent  | Hobby $10/mo        | ✅ (timeout 없음) | ✅ (20+ concurrent)          | $0~$10/mo        | ✅ 2순위            |
| Vercel Workflow (Beta)             | 50K steps/mo              | 초과 $2.50/100K     | ✅                | ✅                           | $0 (사용량 적음) | ⚠️ Beta             |
| Vercel Queues                      | Hobby 1M ops/mo           | 초과 비례           | ✅                | ✅                           | $0               | ⚠️ Beta 종속        |
| n8n 현상 유지                      | Community Edition 무료    | Cloud $24/mo        | ✅                | ✅                           | $0 (자체 호스팅) | ⚠️ 페인 포인트 있음 |
| Inngest                            | 50K exec, 5 concurrent    | **Pro $75/mo**      | ✅                | ❌ (5 concurrent 한계)       | $75/mo           | ❌ 탈락             |
| Cloudflare Workflows               | **CPU 10ms/invocation**   | Workers Paid ~$5/mo | ❌ (무료 불가)    | ✅ (Paid 시)                 | $5+              | ❌ 무료 탈락        |
| Supabase Edge Functions            | 500K inv, **CPU 2s 최대** | $2/100만 초과분     | ❌ (2s CPU 한계)  | ❌ (오케스트레이션 없음)     | $0               | ❌ 탈락             |

---

## TL;DR 추천

### 🥇 1순위: 현상 유지 + 최적화 (Vercel Fluid Compute + after())

**아무것도 바꾸지 않아도 됩니다.** Vercel Hobby의 maxDuration=300s는 Findably WL1(AI 5에이전트 ~120s)을 이미 처리합니다. after()는 Vercel이 Lambda를 추가로 살려두는 공식 방식이며, 비용은 $0입니다. 진짜 페인 포인트(n8n 콜백 URL 동기화 문제, 시크릿 관리)는 오케스트레이션 교체가 아니라 WL2 크롤링 트리거 단순화(직접 API 호출 패턴)로 해결 가능합니다.

### 🥈 2순위: Trigger.dev v3 (향후 시각화/재시도 관리 필요 시)

Timeout이 없고(AI 작업에 최강), 무료 20 concurrent, 실패 재시도 + 실행 로그 대시보드가 필요해질 때의 선택지입니다. $10/mo Hobby 플랜으로 시작 가능하며, 팬아웃/단계별 가시성이 n8n보다 훨씬 좋습니다.

### ❌ 탈락 이유 요약

- **Inngest**: Pro $75/mo (예산 부담) + 무료 5 concurrent는 5-Agent 팬아웃에 부족
- **Supabase Edge Functions**: CPU 2s 하드 리밋 — 60s AI 작업 불가능
- **Cloudflare Workflows 무료**: CPU 10ms/invocation — AI 호출 1번도 못 완료

---

## Findably 워크로드 정의

```
WL1 (유료 진단 트리거): trigger-analysis → 5 AI 에이전트 병렬(Sonnet4, ~30-60s each) + CMO Opus(~30s) = 총 ~120s
WL2 (크롤링 파이프라인): URL 제출 → n8n Playwright 크롤링 → 외부 API 10건 → 콜백 /api/crawl/complete
```

**월 볼륨 (현재)**: 유료 10건/월 + 무료 100건/월  
**비용 임계점**: 무료 10건, 유료 10건 기준 Claude API ~5,000원/월 (외부 서비스 제외)

---

## 상세 비교

### 1. Vercel Fluid Compute + after() (현재 사용 중)

**기본 개념**: 서버리스 Lambda 내에서 여러 요청을 동시 처리하는 in-function concurrency 모델. `after()`는 HTTP 응답 후에도 Lambda를 살려두는 `waitUntil` 패턴의 Next.js 공식 구현.

| 항목                 | 내용                                |
| -------------------- | ----------------------------------- |
| 출시일               | 2025년 4월 23일 기본 활성화         |
| Hobby 최대 실행 시간 | **300초** (이전 60초에서 상향)      |
| Pro 최대 실행 시간   | **800초**                           |
| 추가 비용            | $0 (기존 Vercel 플랜 포함)          |
| 팬아웃               | ✅ Promise.allSettled()로 병렬 실행 |
| 시각화/모니터링      | Vercel Function Logs (기본 제공)    |

**Findably 적합성**:

- WL1 (AI 에이전트 ~120s): ✅ 300s 한도 내 처리 가능
- WL2 (크롤링 콜백): ✅ 현재 정상 작동
- 추가 비용: **$0**

**페인 포인트 (해결 방법)**:

- n8n 콜백 URL 동기화 문제 → n8n workflow URL을 커스텀 도메인으로 영구 고정 (이미 findably.kr로 수정됨)
- 시크릿 관리 → n8n workflow JSON에 플레이스홀더 사용 (learnings 적용 완료)
- 실행 가시성 부족 → Vercel Function Logs + admin 대시보드로 대체 가능

**결론**: 현재 설정으로 충분. 교체 시 비용은 0에서 더 높아질 뿐이며, 마이그레이션 리스크만 추가됩니다.

---

### 2. Trigger.dev v3

**기본 개념**: TypeScript 네이티브 백그라운드 잡 오케스트레이션. 코드 내에서 `task.trigger()`, `task.batchTrigger()` 호출로 작업을 큐에 넣고, 별도 워커 프로세스에서 실행. 단계별 실행 로그와 재시도 관리가 핵심 강점.

| 항목         | 내용                                         |
| ------------ | -------------------------------------------- |
| 무료 티어    | $5 크레딧 + 20 concurrent tasks              |
| Hobby        | **$10/mo**, 50 concurrent, 2024년부터 안정적 |
| Pro          | **$50/mo**, 200+ concurrent                  |
| Timeout 한도 | **없음** (모든 플랜)                         |
| 팬아웃       | ✅ `batchTrigger()` 네이티브 지원            |
| 재시도       | ✅ exponential backoff 자동                  |
| 로그/시각화  | ✅ 실시간 단계별 UI                          |

**Findably 비용 계산**:

- 월 110건 (유료10 + 무료100) × 6 단계 = 660 작업
- 무료 크레딧 $5 내 처리 가능 → 실질 **$0~$10/mo**

**장점**:

- Timeout 없음 = 12분짜리 Opus 작업도 처리 가능
- TypeScript 코드에서 직접 트리거 → n8n workflow JSON 관리 불필요
- 단계별 실패 위치 즉시 확인

**단점**:

- 마이그레이션 비용 (n8n → SDK 전환)
- Playwright 크롤링 통합 시 추가 설계 필요
- 현재 파이프라인이 정상 작동 중인데 이전할 실익이 낮음

---

### 3. Vercel Workflow (Beta)

**기본 개념**: `'use workflow'` 디렉티브로 내구성 있는 워크플로우 정의. 내부적으로 Vercel Queues를 사용하며, 단계 완료 상태를 체크포인트로 저장.

| 항목             | 내용                      |
| ---------------- | ------------------------- |
| 상태             | **Beta** (GA 일정 미공지) |
| 무료             | 50,000 steps/월           |
| 초과             | $2.50/100K steps          |
| Findably 월 비용 | 660 steps → **$0**        |
| 주의             | GA 시 가격 정책 변경 가능 |

**주의사항**: Beta → GA 전환 시 가격이 바뀔 수 있음. 프로덕션에서 핵심 파이프라인으로 사용하기엔 리스크가 있음.

---

### 4. Vercel Queues

**기본 개념**: 내구성 있는 이벤트 스트리밍. 메시지 전송(Send)/수신(Receive)/삭제(Delete) 등 작업(operations)별 과금.

| 항목        | 내용                                   |
| ----------- | -------------------------------------- |
| Hobby 무료  | 1,000,000 ops/월                       |
| 보존 기간   | 기본 24시간, 최대 7일                  |
| Concurrency | 무제한                                 |
| 현재 상태   | Vercel Workflow의 내부 구현체로 사용됨 |

Vercel Workflow와 세트로 사용되므로 단독 평가보다는 Workflow와 묶어서 고려.

---

### 5. n8n 현상 유지

**현재 구조**: Elest.io에서 n8n Community Edition 자체 호스팅. URL 제출 → n8n Playwright 크롤링 → 외부 API → 콜백.

| 항목              | 내용                         |
| ----------------- | ---------------------------- |
| Community Edition | 무료, 무제한 executions      |
| Cloud Starter     | $24/mo, 2,500 executions/월  |
| Cloud Pro         | $60/mo, 10,000 executions/월 |
| Elest.io 호스팅   | 별도 비용 (기존 구독 유지)   |

**현재 페인 포인트 (2026-04-06 기준)**:

- ✅ 커스텀 도메인 URL 동기화 → 해결됨 (findably.kr 고정)
- ✅ 시크릿 하드코딩 → 해결됨 (플레이스홀더 적용)
- ⚠️ n8n workflow 변경 후 Deactivate→Activate 재사이클 필요 (운영 번거로움)
- ⚠️ Playwright 실행 환경 관리 (Elest.io 서버 유지 비용)

**결론**: 페인 포인트가 해결된 지금은 교체 실익이 낮음. 볼륨 증가 시(월 1,000건+) 재검토.

---

### 6. Inngest — ❌ 탈락

**탈락 이유**: 무료 티어 5 concurrent step 한계로 5-Agent 팬아웃 불가능. Pro $75/mo는 현 단계에서 과도한 비용.

| 항목    | 내용                                       |
| ------- | ------------------------------------------ |
| 무료    | 50K executions, **5 concurrent steps**     |
| Pro     | **$75/mo** (검증된 가격, 2026-04 기준)     |
| 팬아웃  | ❌ 무료: 5 concurrent 한계로 직렬화 불가피 |
| Timeout | 무료: 없음. Pro: 더 관대한 기준            |

**주의**: AI 학습 데이터에 "Pro $25/mo"로 잘못 저장된 사례 있음 (learnings 2026-04-06). 실제 확인 가격은 **$75/mo**.

---

### 7. Cloudflare Workflows — ❌ 무료 탈락 (Paid 시 검토 가능)

**기본 개념**: Cloudflare Workers 기반 내구성 워크플로우. CPU 시간만 청구(유휴 시간 무료).

| 항목             | 내용                           |
| ---------------- | ------------------------------ |
| GA 일자          | 2025년 4월 7일                 |
| 무료 CPU         | **10ms/invocation**            |
| Paid CPU         | 30s/step (Workers Paid ~$5/mo) |
| 무료 Concurrency | 100                            |
| 스토리지         | 2025년 9월 15일부터 유료       |

**탈락 이유 (무료)**: 10ms CPU로는 HTTP fetch 1번도 완료 불가. AI 호출은 불가능.

**Paid 플랜 (~$5/mo)**: 30s CPU/step → Claude API 호출 가능하지만, Cloudflare Workers 환경은 Node.js API 제한이 있어 기존 Next.js/Supabase 코드 재사용 어려움. 마이그레이션 비용 큼.

---

### 8. Supabase Edge Functions + pgmq — ❌ 탈락

**기본 개념**: Supabase의 서버리스 함수 + PostgreSQL 기반 메시지 큐. Findably가 이미 Supabase를 사용 중이므로 추가 인프라 없이 활용 가능한 것처럼 보임.

| 항목           | 내용                        |
| -------------- | --------------------------- |
| 무료           | 500K invocations/월         |
| CPU 한도       | **2초/요청** (하드 리밋)    |
| Idle Timeout   | 150초                       |
| waitUntil      | ✅ 지원 (응답 후 추가 실행) |
| 오케스트레이션 | ❌ 없음 (직접 구현 필요)    |
| 초과 비용      | $2/100만 invocations        |

**탈락 이유**: CPU 2초 하드 리밋은 Claude API 호출 1번(최소 5~10s)도 처리 불가능. waitUntil로 우회를 시도해도 CPU 카운터는 계속 올라감. "AI 작업 = Supabase Edge Functions 부적합"은 공식 문서에서도 명시.

---

## 마이그레이션 시나리오

### 시나리오 A: 현상 유지 (권장)

```
현재: Next.js Server Action → after() → Claude API 병렬
      URL 제출 → n8n Playwright → /api/crawl/complete 콜백

변경 없음. 단, 아래 최적화만 적용:
- n8n workflow URL: findably.kr 고정 유지 (완료)
- trigger-analysis: maxDuration=300 유지 (완료)
- SDK timeout: 90_000ms 명시 (완료)
```

**비용**: $0 추가  
**리스크**: 낮음

### 시나리오 B: Trigger.dev v3로 WL1 이전 (선택적)

```
AS-IS: trigger-analysis → after() → Promise.allSettled([5 에이전트])
TO-BE: trigger-analysis → task.batchTrigger(['agent1', 'agent2', ...5개])
       각 에이전트 = 독립 Trigger.dev task (timeout 없음)

n8n WL2 (크롤링)는 그대로 유지
```

**비용**: $0~$10/mo  
**리스크**: 중간 (SDK 통합 + 워커 배포 설정 필요)  
**실익**: 단계별 실행 로그, 자동 재시도, 시각적 디버깅

### 시나리오 C: n8n 크롤링을 직접 API 호출로 단순화

```
AS-IS: URL 제출 → n8n webhook → Playwright → 콜백
TO-BE: URL 제출 → Vercel API Route → Playwright/Firecrawl API → 직접 저장

n8n 의존성 제거, 콜백 URL 동기화 문제 근본 해결
```

**비용**: Firecrawl API 사용 시 별도 비용 발생 ($15/mo~ 기준 플랜)  
**리스크**: 크롤링 로직 재구현 필요  
**실익**: n8n 인프라 제거, 콜백 문제 근본 해결

---

## 검증된 가격 출처

| 도구                                | 검증 방법                                          | 검증 일자  |
| ----------------------------------- | -------------------------------------------------- | ---------- |
| Inngest Pro $75/mo                  | inngest.com/pricing 직접 크롤링                    | 2026-04-06 |
| Trigger.dev Hobby $10/mo            | trigger.dev/pricing 직접 크롤링                    | 2026-04-06 |
| Cloudflare Workflows CPU 10ms       | developers.cloudflare.com/workflows/pricing 크롤링 | 2026-04-06 |
| Supabase Edge Functions CPU 2s      | WebSearch (공식 문서 참조)                         | 2026-04-06 |
| Vercel Fluid Compute Hobby 300s     | vercel.com/docs/functions/fluid-compute 크롤링     | 2026-04-06 |
| Vercel Workflow Beta 50K steps 무료 | vercel.com/docs/workflow 크롤링                    | 2026-04-06 |
| n8n Cloud $24/$60/mo                | WebSearch (n8n pricing 2026)                       | 2026-04-06 |

---

## 결론 요약

| 순위      | 선택                                                         | 이유                                                                      |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **1순위** | **현상 유지** (Vercel after() + n8n)                         | 이미 작동 중. 300s로 WL1 처리 가능. 추가 비용 $0. 페인 포인트 이미 해결됨 |
| **2순위** | **Trigger.dev v3**                                           | Timeout 없음, 가시성 향상 필요 시. Hobby $10/mo. 볼륨 증가 후 검토        |
| **3순위** | **Vercel Workflow**                                          | Vercel 생태계 유지, Beta 안정화 후 검토 가치 있음                         |
| **탈락**  | Inngest, Supabase Edge Functions, Cloudflare Workflows(무료) | 기술적 한계 또는 과도한 비용                                              |

> **핵심 결론**: 현재 Findably의 파이프라인은 이미 적절한 도구 위에서 작동하고 있습니다. 교체보다는 현재 설정을 안정화하고, 볼륨이 월 500건을 넘거나 디버깅 가시성이 명확히 부족해지는 시점에 Trigger.dev v3로의 WL1 이전을 재검토하는 것을 권장합니다.
