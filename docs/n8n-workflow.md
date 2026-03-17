# n8n Workflow — Findably Crawl v2

> 3-Group 병렬 크롤링 워크플로우 설계 문서
> JSON 골격: `n8n/workflows/findably-crawl-v2.json`

---

## 아키텍처 개요

```
[Next.js /api/crawl/trigger]
    │
    ▼ POST (diagnosisId, url)
[n8n Webhook Trigger]
    │
    ▼ Set Variables
    ├──────────────────────────────────────────┐
    │                                          │
    ▼ Group A (Firecrawl)     ▼ Group B (Performance)     ▼ Group C (Basic)
    ┌─────────────┐          ┌──────────────────┐         ┌──────────────┐
    │ A1: Scrape   │          │ B1: PSI Mobile    │         │ C1: robots   │
    │ A2: Map      │          │ B2: PSI Desktop   │         │ C2: sitemap  │
    └─────────────┘          │ B3: SSL Labs      │         │ C3: llms.txt │
                             │ B4: Observatory   │         │ C4: llms-full│
                             └──────────────────┘         └──────────────┘
    │                          │                            │
    └──────────────────────────┴────────────────────────────┘
                               │
                               ▼ Merge All
                               │
                               ▼ Code Node (Normalize)
                               │  - CrawlData 구조로 정규화
                               │  - dataCompleteness 계산
                               │
                               ▼ Supabase Save (crawl_results)
                               │
                               ▼ Callback → POST /api/crawl/complete
```

---

## 노드 상세

### Webhook Trigger

- **Method**: POST
- **Path**: `findably-crawl-v2`
- **Auth**: Header Auth (`Authorization: Bearer {token}`)
- **Body**: `{ diagnosisId: string, url: string }`

### Set Variables

- `diagnosisId`, `url` 추출하여 다운스트림 전달

### Group A: Firecrawl (JS 렌더링 크롤링)

| 노드       | 엔드포인트        | 타임아웃 | 비고                 |
| ---------- | ----------------- | -------- | -------------------- |
| A1: Scrape | `POST /v1/scrape` | 35s      | markdown + HTML 반환 |
| A2: Map    | `POST /v1/map`    | 20s      | 사이트 URL 목록 반환 |

### Group B: Performance + Security

| 노드            | 엔드포인트                   | 타임아웃 | 비고                |
| --------------- | ---------------------------- | -------- | ------------------- |
| B1: PSI Mobile  | PageSpeed Insights (mobile)  | 30s      | Google API Key 필요 |
| B2: PSI Desktop | PageSpeed Insights (desktop) | 30s      | Google API Key 필요 |
| B3: SSL Labs    | `api.ssllabs.com/v3/analyze` | 15s      | fromCache=on        |
| B4: Observatory | Mozilla HTTP Observatory v2  | 15s      | 보안 헤더 분석      |

### Group C: Basic Fetch

| 노드              | URL 패턴              | 타임아웃 | 비고                  |
| ----------------- | --------------------- | -------- | --------------------- |
| C1: robots.txt    | `{url}/robots.txt`    | 5s       | AI 봇 허용 여부       |
| C2: sitemap.xml   | `{url}/sitemap.xml`   | 5s       | URL 개수, 최종 수정일 |
| C3: llms.txt      | `{url}/llms.txt`      | 5s       | AI 크롤러 요약        |
| C4: llms-full.txt | `{url}/llms-full.txt` | 5s       | 존재 여부만 체크      |

### Normalize (Code Node)

- 모든 소스 결과를 단일 객체로 병합
- `dataCompleteness` = 성공 소스 / 전체 소스 x 100
- `successSources` / `failedSources` 배열 생성

### Supabase Save

- 테이블: `crawl_results` (향후 마이그레이션 필요)
- Upsert by `diagnosis_id`
- 컬럼: `diagnosis_id`, `url`, `data_completeness`, `success_sources`, `failed_sources`, `raw_data`, `crawled_at`

### Callback

- `POST {NEXTJS_CALLBACK_URL}/api/crawl/complete`
- Bearer 토큰 인증
- Body: `{ diagnosisId, url, dataCompleteness, successSources, failedSources, crawlResult }`

---

## 환경변수

| 변수                        | 설명                                          | 설정 위치                        |
| --------------------------- | --------------------------------------------- | -------------------------------- |
| `FIRECRAWL_API_KEY`         | Firecrawl API 키                              | n8n Credentials                  |
| `GOOGLE_PAGESPEED_API_KEY`  | Google PageSpeed Insights API 키              | n8n Credentials                  |
| `SUPABASE_URL`              | Supabase 프로젝트 URL                         | n8n Credentials                  |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키                      | n8n Credentials                  |
| `NEXTJS_CALLBACK_URL`       | Next.js 서버 URL (e.g. `https://findably.kr`) | n8n Environment                  |
| `N8N_WEBHOOK_AUTH_TOKEN`    | 콜백 API 인증 토큰                            | n8n Environment + Next.js `.env` |

---

## 장애 허용 (Fault Tolerance)

- 모든 HTTP 노드: `continueOnFail: true`
- 개별 소스 실패 → `failedSources`에 기록, 나머지 정상 진행
- `dataCompleteness < 30%` → Next.js에서 `is_partial: true` 처리
- Supabase 저장 실패 → 콜백으로 raw 데이터 직접 전달 (fallback)

---

## v1 → v2 차이점

| 항목      | v1 (현재)              | v2 (신규)                            |
| --------- | ---------------------- | ------------------------------------ |
| 실행 구조 | 순차 (Layer 1 → 2 → 3) | 10노드 병렬                          |
| Layer 2+3 | Next.js 서버에서 실행  | n8n에서 실행                         |
| 콜백      | `/api/crawl/webhook`   | `/api/crawl/complete`                |
| 데이터    | 부분 데이터 전달       | 전체 데이터 전달                     |
| 소요 시간 | ~90초                  | ~35초 (예상)                         |
| 실패 추적 | 없음                   | `dataCompleteness` + `failedSources` |

---

## n8n Import 방법

1. n8n 대시보드 → Workflows → Import from File
2. `n8n/workflows/findably-crawl-v2.json` 선택
3. Credentials 설정 (Firecrawl, Google API, Supabase)
4. Environment Variables 설정
5. Webhook URL 확인 → `trigger/route.ts`의 `N8N_WEBHOOK_URL` 업데이트
6. 테스트 실행 → 콜백 수신 확인

---

## 후속 작업 (이 Task 범위 밖)

- [ ] `crawl_results` 테이블 마이그레이션 생성
- [ ] `trigger/route.ts` → v2 웹훅 URL로 전환
- [ ] `webhook/route.ts` → 일정 기간 병행 운용 후 제거
- [ ] n8n에서 실제 import + credential 설정
- [ ] 통합 테스트 (n8n ↔ Next.js)
