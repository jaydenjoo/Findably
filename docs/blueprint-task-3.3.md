# Task 3.3 — sitemap.xml + llms.txt 파싱

> Epic 3 (4-Layer 크롤링 엔진)의 세 번째 Task.
> **순수 파서 로직**만 구현. HTTP 요청은 n8n이 처리 → 텍스트만 받아 파싱.
> Task 3.2(robots.txt)와 동일한 패턴.

---

## 1. 목표

Task 3.3 완료 시:

- `parseSitemap(raw)` 함수가 sitemap.xml 원문을 받아 `SitemapData`를 반환
- `parseLlmsTxt(raw)` 함수가 llms.txt 원문을 받아 `LlmsTxtData`를 반환
- URL 개수 추출, 최신 lastmod 추출
- sitemap index (중첩 사이트맵) 감지
- 다양한 엣지 케이스 처리 (빈 파일, malformed XML, BOM 등)
- 유닛 테스트로 모든 케이스 검증

---

## 2. 기술 접근법

### 2.1 신규 파일 (4개)

| #   | 파일                                                       | 설명             |
| --- | ---------------------------------------------------------- | ---------------- |
| 1   | `src/features/crawling/parsers/sitemap.ts`                 | sitemap.xml 파서 |
| 2   | `src/features/crawling/parsers/__tests__/sitemap.test.ts`  | sitemap 테스트   |
| 3   | `src/features/crawling/parsers/llms-txt.ts`                | llms.txt 파서    |
| 4   | `src/features/crawling/parsers/__tests__/llms-txt.test.ts` | llms.txt 테스트  |

### 2.2 수정 파일 (1개)

| #   | 파일                             | 변경 내용                                     |
| --- | -------------------------------- | --------------------------------------------- |
| 1   | `src/features/crawling/index.ts` | `parseSitemap`, `parseLlmsTxt` re-export 추가 |

### 2.3 XML 파싱 전략

**외부 라이브러리 불필요.** sitemap.xml은 단순 구조이므로 정규식 기반 파싱으로 충분:

- `<url>` 태그 개수 카운팅 → `url_count`
- `<lastmod>` 값 추출 → 가장 최신 날짜 → `last_modified`
- `<sitemapindex>` 감지 → sitemap index인 경우 `<sitemap>` 태그 카운팅

> **왜 정규식?** XML 파서(xml2js, fast-xml-parser) 의존성 추가는 과잉. sitemap은 표준 구조가 명확하고, 우리가 필요한 건 URL 개수와 lastmod뿐.
> malformed XML도 가능한 만큼 추출하는 "관대한 파싱"이 목적.

---

## 3. 변경 상세

### 3.1 `parsers/sitemap.ts`

**함수 시그니처:**

```typescript
import type { SitemapData } from '../types'

/**
 * sitemap.xml 원문을 파싱하여 SitemapData를 반환.
 * n8n이 fetch한 XML 텍스트를 받아 파싱만 수행.
 *
 * @param raw - sitemap.xml 전체 텍스트 (null이면 파일 미존재)
 */
export function parseSitemap(raw: string | null): SitemapData
```

**파싱 로직:**

1. `raw === null` → `{ exists: false, url_count: 0, last_modified: null }`
2. 빈 문자열 → `{ exists: true, url_count: 0, last_modified: null }`
3. BOM 제거 (`\uFEFF`)
4. `<sitemapindex>` 포함 여부 확인:
   - sitemap index인 경우: `<sitemap>` 태그 개수 → `url_count` (하위 사이트맵 개수)
   - 일반 sitemap인 경우: `<url>` 태그 개수 → `url_count`
5. `<lastmod>` 값 추출 → 모든 lastmod 중 가장 최신 → `last_modified`
6. lastmod 없으면 `null`

### 3.2 `parsers/llms-txt.ts`

**함수 시그니처:**

```typescript
import type { LlmsTxtData } from '../types'

/**
 * llms.txt 원문을 파싱하여 LlmsTxtData를 반환.
 * n8n이 fetch한 텍스트를 받아 존재 여부 + 내용 반환.
 *
 * @param raw - llms.txt 전체 텍스트 (null이면 파일 미존재)
 */
export function parseLlmsTxt(raw: string | null): LlmsTxtData
```

**파싱 로직:**

1. `raw === null` → `{ exists: false, content: null }`
2. 빈 문자열 (공백/줄바꿈만) → `{ exists: true, content: null }`
3. 내용이 있으면 → `{ exists: true, content: raw.trim() }`

> llms.txt는 구조가 자유형(plain text)이므로 복잡한 파싱 불필요. 존재 여부와 원문 보존이 핵심.

### 3.3 `index.ts` 수정

```typescript
// 기존 파서 export에 추가
export { parseSitemap } from './parsers/sitemap'
export { parseLlmsTxt } from './parsers/llms-txt'
```

---

## 4. 테스트 계획

### sitemap.xml 테스트 (12개)

**기본 동작 (4개)**

| #   | 테스트      | 입력                                         | 기대                                               |
| --- | ----------- | -------------------------------------------- | -------------------------------------------------- |
| 1   | 파일 미존재 | `null`                                       | `exists: false, url_count: 0, last_modified: null` |
| 2   | 빈 파일     | `''`                                         | `exists: true, url_count: 0, last_modified: null`  |
| 3   | URL 1개     | `<urlset><url><loc>...</loc></url></urlset>` | `url_count: 1`                                     |
| 4   | URL 복수    | 3개 URL 포함 XML                             | `url_count: 3`                                     |

**lastmod 추출 (3개)**

| #   | 테스트              | 입력                            | 기대                          |
| --- | ------------------- | ------------------------------- | ----------------------------- |
| 5   | lastmod 1개         | `<lastmod>2026-03-14</lastmod>` | `last_modified: '2026-03-14'` |
| 6   | lastmod 복수 → 최신 | 여러 날짜                       | 가장 최신 날짜 반환           |
| 7   | lastmod 없음        | `<url>` only                    | `last_modified: null`         |

**sitemap index (2개)**

| #   | 테스트                  | 입력                                                  | 기대                              |
| --- | ----------------------- | ----------------------------------------------------- | --------------------------------- |
| 8   | sitemap index 감지      | `<sitemapindex><sitemap>...</sitemap></sitemapindex>` | `url_count: N` (하위 사이트맵 수) |
| 9   | sitemap index + lastmod | index에 lastmod 포함                                  | 최신 날짜 추출                    |

**엣지 케이스 (3개)**

| #   | 테스트                         | 입력                      | 기대                  |
| --- | ------------------------------ | ------------------------- | --------------------- |
| 10  | BOM 포함                       | `\uFEFF<?xml ...`         | BOM 무시, 정상 파싱   |
| 11  | 네임스페이스 포함 XML          | `xmlns="http://..."` 포함 | 정상 파싱             |
| 12  | malformed XML (닫는 태그 없음) | 불완전 XML                | 파싱 가능한 만큼 추출 |

### llms.txt 테스트 (6개)

| #   | 테스트       | 입력         | 기대                                        |
| --- | ------------ | ------------ | ------------------------------------------- |
| 1   | 파일 미존재  | `null`       | `exists: false, content: null`              |
| 2   | 빈 파일      | `''`         | `exists: true, content: null`               |
| 3   | 공백만       | `'  \n  '`   | `exists: true, content: null`               |
| 4   | 일반 내용    | 텍스트       | `exists: true, content: 텍스트(trimmed)`    |
| 5   | 여러 줄 내용 | 멀티라인     | `exists: true, content: 전체 내용(trimmed)` |
| 6   | BOM 포함     | `\uFEFF내용` | BOM 제거 후 정상 반환                       |

---

## 5. 구현 순서

1. `parsers/llms-txt.ts` — 간단한 것 먼저 (함수 1개, 로직 단순)
2. `parsers/__tests__/llms-txt.test.ts` — 테스트 6개
3. `parsers/sitemap.ts` — sitemap 파서
4. `parsers/__tests__/sitemap.test.ts` — 테스트 12개
5. `index.ts` — re-export 추가
6. 검증 게이트 실행

---

## 6. 리스크

| 리스크                                       | 대응                                                 |
| -------------------------------------------- | ---------------------------------------------------- |
| malformed XML (닫는 태그 누락 등)            | 정규식 기반 관대한 파싱 — 에러 throw 안 함           |
| 거대 sitemap (URL 수만 개)                   | 개수만 카운팅 — URL 자체를 배열에 저장하지 않음      |
| sitemap index 중첩 (index → index)           | 1단계만 감지. 재귀 크롤링은 n8n 워크플로우 담당      |
| lastmod 날짜 형식 다양 (ISO 8601, 날짜만 등) | 문자열 비교로 최신 판별 (ISO 8601은 사전순 = 시간순) |

---

## 7. 스코프 외 (하지 않을 것)

- HTTP fetch (n8n이 담당)
- sitemap URL 목록 저장 (url_count만 필요)
- sitemap index 재귀 크롤링 (n8n 워크플로우)
- llms.txt 구조 분석 (내용 해석은 진단 엔진 담당)
- XML 파서 라이브러리 추가 (정규식으로 충분)
- robots.txt에서 추출한 Sitemap URL 연동 (Task 3.10에서 통합)

---

## 8. 검증

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test
```

- sitemap.test.ts 12개 + llms-txt.test.ts 6개 = 18개 테스트 통과
- 기존 테스트 깨지지 않음
- 빌드 성공
