# Task 3.2 — robots.txt 파싱 (AI 봇 14개 체크) + 차단 대응

> Epic 3 (4-Layer 크롤링 엔진)의 두 번째 Task.
> **순수 파서 로직**만 구현. HTTP 요청은 n8n이 처리 → 텍스트만 받아 파싱.

---

## 1. 목표

Task 3.2 완료 시:

- `parseRobotsTxt(raw)` 함수가 robots.txt 원문을 받아 `RobotsTxtData`를 반환
- Googlebot 차단 여부 판별
- AI 봇 14개 각각에 대해 `allowed` / `blocked` / `not_mentioned` 판정
- Sitemap URL 추출
- 다양한 robots.txt 형식 (빈 파일, 주석, 와일드카드, 대소문자 혼용, 복수 User-agent) 처리
- 유닛 테스트로 모든 엣지 케이스 검증

---

## 2. 기술 접근법

### 2.1 신규 파일 (2개)

| #   | 파일                                                         | 설명            |
| --- | ------------------------------------------------------------ | --------------- |
| 1   | `src/features/crawling/parsers/robots-txt.ts`                | robots.txt 파서 |
| 2   | `src/features/crawling/parsers/__tests__/robots-txt.test.ts` | 파서 테스트     |

### 2.2 수정 파일 (1개)

| #   | 파일                             | 변경 내용                       |
| --- | -------------------------------- | ------------------------------- |
| 1   | `src/features/crawling/index.ts` | `parseRobotsTxt` re-export 추가 |

---

## 3. 변경 상세

### 3.1 `parsers/robots-txt.ts`

**함수 시그니처:**

```typescript
import type { RobotsTxtData } from '../types'
import { AI_BOT_LIST } from '../constants'

/**
 * robots.txt 원문을 파싱하여 RobotsTxtData를 반환.
 * n8n이 fetch한 robots.txt 텍스트를 받아 파싱만 수행.
 *
 * @param raw - robots.txt 전체 텍스트 (null이면 파일 미존재)
 */
export function parseRobotsTxt(raw: string | null): RobotsTxtData
```

**파싱 로직:**

1. `raw === null` → `{ exists: false, allows_googlebot: true, ai_bots: 모두 'not_mentioned', sitemap_urls: [] }`
2. 빈 문자열 (`''` 또는 공백만) → `exists: true`, 규칙 없음 → 모두 허용
3. 줄 단위 파싱:
   - `#` 주석 제거
   - `User-agent:` 지시어 추출 (대소문자 무시)
   - `Disallow:` / `Allow:` 규칙 수집
   - `Sitemap:` URL 수집
4. 봇별 판정 로직:
   - 해당 봇 이름으로 `User-agent` 섹션이 있는지 확인
   - `Disallow: /` → `blocked`
   - 명시적 `Allow` 또는 `Disallow` 없음 → `allowed`
   - 봇 이름 없으면 `User-agent: *` 규칙 적용
   - `*` 섹션도 없으면 → `not_mentioned`
5. Googlebot 특별 처리: `allows_googlebot` 필드 — `Disallow: /`이면 `false`

**핵심 파싱 규칙 (RFC 9309 준수):**

- User-agent 이름 비교: **대소문자 무시** (RFC 9309 Section 2.2.1)
- 가장 구체적인 User-agent 섹션 우선 (봇 이름 > `*`)
- 빈 `Disallow:` = 모두 허용 (RFC 표준)
- 와일드카드 `*` 경로 및 `$` 앵커 지원 (Google 확장)
- BOM(Byte Order Mark) 제거

### 3.2 `index.ts` 수정

```typescript
// 기존 export에 추가
export { parseRobotsTxt } from './parsers/robots-txt'
```

---

## 4. 테스트 계획

### 기본 동작 (5개)

| #   | 테스트       | 입력                         | 기대                                                                |
| --- | ------------ | ---------------------------- | ------------------------------------------------------------------- |
| 1   | 파일 미존재  | `null`                       | `exists: false, allows_googlebot: true, ai_bots 모두 not_mentioned` |
| 2   | 빈 파일      | `''`                         | `exists: true, allows_googlebot: true, ai_bots 모두 not_mentioned`  |
| 3   | 모든 봇 허용 | `User-agent: *\nAllow: /`    | `allows_googlebot: true, 모든 봇 allowed`                           |
| 4   | 모든 봇 차단 | `User-agent: *\nDisallow: /` | `allows_googlebot: false, 모든 봇 blocked`                          |
| 5   | 빈 Disallow  | `User-agent: *\nDisallow:`   | 모두 허용 (RFC 표준)                                                |

### AI 봇 특화 (6개)

| #   | 테스트                        | 입력                                    | 기대                                    |
| --- | ----------------------------- | --------------------------------------- | --------------------------------------- |
| 6   | GPTBot만 차단                 | `User-agent: GPTBot\nDisallow: /`       | GPTBot: blocked, 나머지: not_mentioned  |
| 7   | 복수 봇 차단                  | GPTBot + ClaudeBot 각각 Disallow        | 두 봇 blocked, 나머지 not_mentioned     |
| 8   | 특정 봇 허용 + \* 차단        | `*: Disallow /` + `ClaudeBot: Allow /`  | ClaudeBot: allowed, 나머지: blocked     |
| 9   | 대소문자 혼용                 | `user-agent: gptbot`                    | GPTBot 매칭됨                           |
| 10  | Googlebot 차단                | `User-agent: Googlebot\nDisallow: /`    | `allows_googlebot: false`               |
| 11  | Googlebot은 허용 + AI 봇 차단 | `Googlebot: Allow` + `GPTBot: Disallow` | allows_googlebot: true, GPTBot: blocked |

### Sitemap 추출 (3개)

| #   | 테스트       | 입력                                       | 기대                                                |
| --- | ------------ | ------------------------------------------ | --------------------------------------------------- |
| 12  | Sitemap 1개  | `Sitemap: https://example.com/sitemap.xml` | `sitemap_urls: ['https://example.com/sitemap.xml']` |
| 13  | Sitemap 복수 | 2개 Sitemap 라인                           | 2개 URL 배열                                        |
| 14  | Sitemap 없음 | 규칙만 있는 파일                           | `sitemap_urls: []`                                  |

### 엣지 케이스 (6개)

| #   | 테스트               | 입력                               | 기대                                         |
| --- | -------------------- | ---------------------------------- | -------------------------------------------- |
| 15  | 주석만 있는 파일     | `# This is a comment\n# Another`   | exists: true, 규칙 없음 → 모두 not_mentioned |
| 16  | BOM 포함             | `\uFEFFUser-agent: *\nDisallow: /` | BOM 무시, 정상 파싱                          |
| 17  | Windows 줄바꿈       | `User-agent: *\r\nDisallow: /`     | 정상 파싱                                    |
| 18  | 와일드카드 경로      | `Disallow: /*.pdf$`                | 올바른 처리                                  |
| 19  | 복수 User-agent 그룹 | 3개 그룹 (\*, Googlebot, GPTBot)   | 각 그룹 독립 판정                            |
| 20  | raw 저장             | 아무 입력                          | `raw` 필드에 원본 텍스트 보존                |

---

## 5. 구현 순서

1. `parsers/robots-txt.ts` — 파서 함수 구현
2. `parsers/__tests__/robots-txt.test.ts` — 테스트 20개 작성
3. `index.ts` — re-export 추가
4. 검증 게이트 실행

---

## 6. 리스크

| 리스크                    | 대응                                                            |
| ------------------------- | --------------------------------------------------------------- |
| 비표준 robots.txt 형식    | RFC 9309 기반 관대한 파싱 (malformed line 무시, 에러 아닌 경고) |
| User-agent 이름 불일치    | 대소문자 무시 비교 (RFC 9309 준수)                              |
| 거대 robots.txt (수만 줄) | 줄 수 제한 불필요 (n8n에서 크기 제한 적용)                      |

---

## 7. 스코프 외 (하지 않을 것)

- HTTP fetch (n8n이 담당)
- robots.txt 차단 시 UI 표시 (Task 3.11)
- sitemap.xml 실제 파싱 (Task 3.3)
- 크롤링 결과 DB 저장 (Task 3.10)
- crawl-path 판정 로직 (차단 시 대체 수집 결정은 n8n 워크플로우)

---

## 8. 검증

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test
```

- robots-txt.test.ts 20개 테스트 통과
- 기존 93개 테스트 깨지지 않음
- 빌드 성공
