# Task 3.7 — CrUX API (Chrome User Experience Report)

## 목표

CrUX API를 호출하여 실제 사용자 필드 데이터(Core Web Vitals p75)를 수집하는 fetcher 함수.
완료 시: `fetchCrux(url)` → `CruxData | null` 반환.

**PageSpeed(3.6)와의 차이:**

- PageSpeed = 실험실 데이터 (Lighthouse가 시뮬레이션한 값)
- CrUX = 필드 데이터 (실제 Chrome 사용자 28일간 수집)
- CrUX에서만 INP(Interaction to Next Paint) 측정 가능 — PRD 핵심 지표

---

## CrUX API v1

### 엔드포인트

```
POST https://chromeuxreport.googleapis.com/v1/records:queryRecord?key={GOOGLE_API_KEY}
```

> PageSpeed는 GET, CrUX는 **POST** — 요청 방식이 다름

### 요청 본문

```json
{
  "origin": "https://example.com",
  "metrics": [
    "largest_contentful_paint",
    "interaction_to_next_paint",
    "cumulative_layout_shift",
    "experimental_time_to_first_byte",
    "first_contentful_paint"
  ]
}
```

- `origin` 사용 (사이트 전체 집계) — 개별 URL보다 데이터 존재 확률 높음
- `formFactor` 생략 → 전체 기기 통합 데이터
- `metrics` 명시 → 필요한 5개만 요청 (불필요 데이터 제거)

### 응답에서 추출할 필드

| 우리 필드 | API 경로                                                         | 단위          |
| --------- | ---------------------------------------------------------------- | ------------- |
| lcp_ms    | `record.metrics.largest_contentful_paint.percentiles.p75`        | ms (정수)     |
| inp_ms    | `record.metrics.interaction_to_next_paint.percentiles.p75`       | ms (정수)     |
| cls       | `record.metrics.cumulative_layout_shift.percentiles.p75`         | 문자열 → 소수 |
| ttfb_ms   | `record.metrics.experimental_time_to_first_byte.percentiles.p75` | ms (정수)     |
| fcp_ms    | `record.metrics.first_contentful_paint.percentiles.p75`          | ms (정수)     |

> CLS 주의: CrUX API는 CLS를 **문자열** (예: `"0.12"`)로 반환. parseFloat 필요.
> FID 없음: CrUX에서 FID 지원 종료 → INP로 완전 대체됨.

### 히스토그램 (추가 가치)

각 메트릭에 3-bin 히스토그램 제공:

```json
{
  "histogram": [
    { "start": 0, "end": 2500, "density": 0.85 }, // good
    { "start": 2500, "end": 4000, "density": 0.1 }, // needs improvement
    { "start": 4000, "density": 0.05 } // poor
  ]
}
```

→ "양호/보통/나쁨" 비율로 변환 가능. 점수 산출(Epic 4)에서 활용.

### 데이터 없는 경우

- 트래픽 부족 사이트 → HTTP 404 응답 (데이터 없음, 에러 아님)
- 이 경우 null 반환 (graceful)

---

## 설계 판단: 타입 확장

현재 `Layer2Data.crux`가 `{ origin_summary: unknown } | null`로 placeholder 상태.
Task 3.7에서 구체적 타입으로 **교체**:

```
기존: crux: { origin_summary: unknown } | null
변경: crux: {
  lcp_ms: number
  inp_ms: number
  cls: number
  ttfb_ms: number
  fcp_ms: number
  form_factors: { phone: number; desktop: number; tablet: number } | null
  collection_period: { first_date: string; last_date: string }
} | null
```

- `form_factors`: 기기 비율 (진단 리포트에서 "모바일 82% 사용자" 표시 용도)
- `collection_period`: 데이터 수집 기간 (리포트에 "최근 28일 기준" 명시)
- `origin_summary: unknown` 삭제 → 구체적 필드로 대체

---

## 변경 파일 (2개 신규, 3개 수정)

| 파일                                                    | 상태     | 내용                                  |
| ------------------------------------------------------- | -------- | ------------------------------------- |
| `src/features/crawling/fetchers/crux.ts`                | **신규** | `fetchCrux(url)` API 호출 + 응답 파싱 |
| `src/features/crawling/fetchers/__tests__/crux.test.ts` | **신규** | 테스트 ~15개 (API 응답 mock)          |
| `src/features/crawling/types.ts`                        | **수정** | `Layer2Data.crux` 타입 구체화         |
| `src/features/crawling/schemas.ts`                      | **수정** | `layer2Schema.crux` 스키마 구체화     |
| `src/features/crawling/index.ts`                        | **수정** | `fetchCrux` re-export 추가            |

---

## 변경 상세

### 1. types.ts 수정 — CruxData 타입 구체화

```
Layer2Data.crux 변경:
  기존: { origin_summary: unknown } | null
  변경: {
    lcp_ms: number          // p75 LCP (ms)
    inp_ms: number          // p75 INP (ms) ← 핵심 신규 지표
    cls: number             // p75 CLS (소수)
    ttfb_ms: number         // p75 TTFB (ms)
    fcp_ms: number          // p75 FCP (ms)
    form_factors: {
      phone: number         // 0~1 비율
      desktop: number
      tablet: number
    } | null
    collection_period: {
      first_date: string    // "2026-02-14"
      last_date: string     // "2026-03-13"
    }
  } | null
```

### 2. schemas.ts 수정 — crux 스키마 구체화

```
layer2Schema.crux 변경:
  기존: z.object({ origin_summary: z.unknown() }).nullable()
  변경: z.object({
    lcp_ms: z.number(),
    inp_ms: z.number(),
    cls: z.number(),
    ttfb_ms: z.number(),
    fcp_ms: z.number(),
    form_factors: z.object({
      phone: z.number(),
      desktop: z.number(),
      tablet: z.number(),
    }).nullable(),
    collection_period: z.object({
      first_date: z.string(),
      last_date: z.string(),
    }),
  }).nullable()
```

### 3. fetchCrux 함수 (`fetchers/crux.ts`)

```
import { crawlingConfig } from '@/config/crawling'
import type { Layer2Data } from '../types'

type CruxData = NonNullable<Layer2Data['crux']>

export async function fetchCrux(url: string): Promise<CruxData | null>

내부 흐름:
1. API 키 없음 → null 반환 (선택적 의존성)
2. URL에서 origin 추출 (new URL(url).origin)
3. POST 요청 구성 (Content-Type: application/json)
4. fetch() 호출 (timeout: 15초 — CrUX는 PageSpeed보다 빠름)
5. HTTP 404 → null 반환 (데이터 없음, 정상 케이스)
6. HTTP 기타 에러 → null 반환 + console.error 로깅
7. 응답 JSON 파싱 → 필요 필드 추출
8. CLS 문자열 → parseFloat 변환
9. 필드 누락 시 → null 반환
10. CruxData 객체 반환
```

### 4. 응답 파싱 헬퍼

```
function parseCruxResponse(json: unknown): CruxData | null

내부:
- record.metrics 존재 확인
- 5개 메트릭(LCP, INP, CLS, TTFB, FCP) p75 추출
- CLS: 문자열 → parseFloat → Number(toFixed(3))
- form_factors: record.metrics.form_factors 에서 추출 (없으면 null)
- collection_period: record.collectionPeriod에서 추출
- 하나라도 핵심 p75 누락 → null
```

### 5. 테스트 (~15개)

```
기본 동작 (3개):
  - API 키 없음 → null 반환
  - 정상 응답 → CruxData 반환
  - origin 추출 확인 (path 제거)

에러 처리 (4개):
  - HTTP 404 (데이터 없음) → null (console.error 없음, 정상 케이스)
  - HTTP 400 → null + console.error
  - HTTP 500 → null + console.error
  - 네트워크 에러 → null

응답 파싱 (4개):
  - record.metrics 누락 → null
  - 일부 메트릭 누락 → null
  - CLS 문자열 → 숫자 변환 확인
  - 실제 CrUX API 응답 구조 → 정상 파싱

엣지 케이스 (3개):
  - form_factors 미포함 → form_factors: null (나머지 정상)
  - 매우 큰 INP 값 → 그대로 반환
  - URL에 path 포함 → origin만 추출하여 요청

타임아웃 (1개):
  - AbortError → null + console.error
```

### 6. index.ts 수정 (+1줄)

```
export { fetchCrux } from './fetchers/crux'
```

---

## API 키 관리

- `GOOGLE_API_KEY` 환경변수 사용 (PageSpeed와 동일 키)
- `crawlingConfig.googleApiKey` 그대로 활용 — config/crawling.ts 수정 불필요
- API 키 없으면 → null 반환

---

## PageSpeed(3.6) vs CrUX(3.7) 비교

| 구분        | PageSpeed (3.6)                    | CrUX (3.7)                      |
| ----------- | ---------------------------------- | ------------------------------- |
| 데이터 유형 | Lab data (시뮬레이션)              | Field data (실제 사용자)        |
| HTTP 메서드 | GET                                | POST                            |
| 핵심 지표   | LCP, FID(max-potential), CLS, TTFB | LCP, **INP**, CLS, TTFB, FCP    |
| 타임아웃    | 30초 (분석 수행)                   | 15초 (캐시된 데이터 조회)       |
| 데이터 없음 | 항상 있음 (실시간 분석)            | 404 반환 (트래픽 부족 시)       |
| 추가 데이터 | —                                  | form_factors, collection_period |

---

## 스코프 외 (하지 않을 것)

- URL별 CrUX 조회 (origin만 — 데이터 존재 확률 높음)
- CrUX History API (시계열 데이터 — Phase 2)
- formFactor별 분리 조회 (통합 데이터만)
- 히스토그램 bin 상세 저장 (p75만 — bin 데이터는 Epic 4 점수 산출 시 재검토)
- Safe Browsing API 호출 (Task 3.8에서)
- 캐싱/레이트 리밋 (Phase 2)
- Supabase 저장 (Task 3.10에서)

---

## 리스크

| 리스크                          | 대응                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| 소규모 사이트 데이터 없음 (404) | null 반환으로 graceful 실패. 리포트에서 "데이터 부족" 안내 |
| API 할당량 (150 req/min)        | MVP 충분. 향후 배치 큐잉 검토                              |
| CLS가 문자열로 반환됨           | parseFloat + toFixed(3) 방어 코드                          |
| FID 미지원 (INP 전환)           | INP 사용. PageSpeed의 max-potential-fid와 보완 관계        |
| API 응답 구조 변경              | 방어적 파싱 (필드별 존재 확인). null 반환                  |

---

## 검증

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test
```

- 테스트 ~15개 전체 통과
- 기존 테스트 회귀 없음 (types.ts 변경으로 인한 영향 확인)
- `fetchCrux`가 index.ts에서 정상 export
- API 키 없이도 빌드 통과 (null 반환)
