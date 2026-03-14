# Task 3.6 — PageSpeed Insights API

## 목표

Google PageSpeed Insights API v5를 호출하여 성능 지표를 수집하는 fetcher 함수.
완료 시: `fetchPageSpeed(url)` → `PageSpeedData | null` 반환.

---

## 설계 판단: 파서(parsers/) vs 어댑터(lib/adapters/)

| 기준          | parsers/ 배치                             | lib/adapters/ 배치               |
| ------------- | ----------------------------------------- | -------------------------------- |
| 기존 패턴     | Layer 1 파서는 순수 함수 (외부 호출 없음) | 외부 서비스 = adapters 규칙      |
| 네트워크 호출 | ✗ parsers는 순수 분석만                   | ✓ adapters가 외부 호출 담당      |
| 모듈 규칙     | features/crawling 내부 완결               | lib/adapters/ 통해서만 외부 호출 |

**결정: `src/features/crawling/fetchers/pagespeed.ts`** — 이유:

1. adapters/는 교체 가능한 외부 서비스 래퍼 (AI, 결제, 이메일 등 범용)
2. PageSpeed API는 crawling 모듈 전용 → features/crawling 내부가 적합
3. parsers/와 구분하기 위해 `fetchers/` 하위 폴더 신설
4. 내부에서 `fetch()` 직접 호출 (Google 공개 API, 어댑터 수준의 추상화 불필요)

---

## Google PageSpeed Insights API v5

### 엔드포인트

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
  ?url={encodedUrl}
  &key={GOOGLE_API_KEY}
  &category=performance
  &strategy=mobile
```

### 응답에서 추출할 필드

| 우리 필드         | API 경로                                                           | 단위       |
| ----------------- | ------------------------------------------------------------------ | ---------- |
| performance_score | `lighthouseResult.categories.performance.score`                    | 0~1 → ×100 |
| lcp_ms            | `lighthouseResult.audits['largest-contentful-paint'].numericValue` | ms         |
| fid_ms            | `lighthouseResult.audits['max-potential-fid'].numericValue`        | ms         |
| cls               | `lighthouseResult.audits['cumulative-layout-shift'].numericValue`  | 소수       |
| ttfb_ms           | `lighthouseResult.audits['server-response-time'].numericValue`     | ms         |

> FID 참고: Lighthouse에서 FID 직접 측정 불가. `max-potential-fid` 사용 (lab data).
> INP는 field data (CrUX)에서만 제공 → Task 3.7에서 처리.

---

## 변경 파일 (2개 신규, 1개 수정)

| 파일                                                         | 상태     | 내용                                       |
| ------------------------------------------------------------ | -------- | ------------------------------------------ |
| `src/features/crawling/fetchers/pagespeed.ts`                | **신규** | `fetchPageSpeed(url)` API 호출 + 응답 파싱 |
| `src/features/crawling/fetchers/__tests__/pagespeed.test.ts` | **신규** | 테스트 ~12개 (API 응답 mock)               |
| `src/features/crawling/index.ts`                             | **수정** | `fetchPageSpeed` re-export 추가            |

> `types.ts` 수정 없음 — `PageSpeedData`(Layer2Data.pagespeed)는 Task 3.1에서 정의 완료.
> `schemas.ts` 수정 없음 — `layer2Schema.pagespeed`는 Task 3.1에서 정의 완료.
> `config/crawling.ts` 수정 없음 — `googleApiKey`는 이미 정의 완료.

---

## 변경 상세

### 1. fetchPageSpeed 함수 (`fetchers/pagespeed.ts`)

```ts
import { crawlingConfig } from '@/config/crawling'
import type { Layer2Data } from '../types'

type PageSpeedData = NonNullable<Layer2Data['pagespeed']>

export async function fetchPageSpeed(url: string): Promise<PageSpeedData | null>

내부 흐름:
1. API 키 없음 → null 반환 (선택적 의존성)
2. URL 인코딩 + API 요청 구성
3. fetch() 호출 (timeout: 30초 — PageSpeed는 느림)
4. HTTP 에러 → null 반환 + console.error 로깅
5. 응답 JSON 파싱 → 필요 필드 추출
6. 필드 누락 시 → null 반환
7. PageSpeedData 객체 반환
```

### 2. 응답 파싱 헬퍼

```ts
function parsePageSpeedResponse(json: unknown): PageSpeedData | null

내부:
- lighthouseResult 존재 확인
- categories.performance.score 추출 → ×100 → 정수
- audits에서 LCP, FID, CLS, TTFB 추출
- 하나라도 누락 → null
```

### 3. 테스트 (~12개)

```
기본 동작 (3개):
  - API 키 없음 → null 반환
  - 정상 응답 → PageSpeedData 반환
  - score 0~1 → 0~100 정수 변환

에러 처리 (4개):
  - HTTP 400 → null + console.error
  - HTTP 500 → null + console.error
  - 네트워크 에러 (fetch 실패) → null
  - 타임아웃 → null

응답 파싱 (3개):
  - lighthouseResult 누락 → null
  - audits 일부 누락 → null
  - 실제 Google API 응답 구조 → 정상 파싱

엣지 케이스 (2개):
  - score=0 → performance_score: 0 (0을 null로 처리하지 않음)
  - 매우 큰 LCP 값 → 그대로 반환
```

### 4. index.ts 수정 (+1줄)

```ts
export { fetchPageSpeed } from './fetchers/pagespeed'
```

---

## API 키 관리

- `GOOGLE_API_KEY` 환경변수 사용 (이미 `config/crawling.ts`에 정의)
- API 키 없으면 → null 반환 (에러 아님). 개발 환경에서 API 키 없이도 빌드 가능
- `.env.example`에 `GOOGLE_API_KEY=` 항목 추가 필요 (있는지 확인)

---

## 스코프 외 (하지 않을 것)

- CrUX API 호출 (Task 3.7에서)
- Safe Browsing API 호출 (Task 3.8에서)
- 캐싱/레이트 리밋 (Phase 2)
- 데스크톱 전략 분석 (모바일만 — strategy=mobile)
- INP 측정 (CrUX field data 전용 → Task 3.7)
- Supabase 저장 (Task 3.10에서)

---

## 리스크

| 리스크                    | 대응                                                          |
| ------------------------- | ------------------------------------------------------------- |
| Google API 키 할당량 초과 | 무료 티어 25,000건/일 — MVP 충분. null 반환으로 graceful 실패 |
| API 응답 구조 변경        | 방어적 파싱 (필드별 존재 확인). null 반환                     |
| 느린 응답 (10-30초)       | 30초 타임아웃 설정. AbortController 사용                      |
| FID 대신 INP 전환         | max-potential-fid 사용 (lab data). CrUX INP는 Task 3.7        |

---

## 검증

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test
```

- 테스트 ~12개 전체 통과
- 기존 테스트 회귀 없음
- `fetchPageSpeed`가 index.ts에서 정상 export
- API 키 없이도 빌드 통과 (null 반환)
