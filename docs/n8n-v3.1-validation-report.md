# n8n v3.1 워크플로우 검증 리포트

> **검증 대상**: `findably-crawl-v3-production-hardened.json` (v3.1 Hardened+, 24 nodes)
> **보너스 검증**: `findably-monitor-v2-supabase.json` (v2, 13 nodes)
> **검증 기준 n8n 버전**: 2.16.0 (2026-04-07 기준 최신 stable)
> **검증일**: 2026-04-07
> **검증자**: Claude (강제 외부 검증 원칙 적용 — 학습 데이터 단독 사용 금지)
> **참고 규칙**: learnings.md "2026-04-06 외부 서비스 가격/제한 변경 검증 습관" (Inngest 사건)

---

## 0. 요약 (TL;DR)

| 우선순위       | 건수 | 설명                                              |
| -------------- | ---- | ------------------------------------------------- |
| 🔴 P0 Critical | 2건  | 즉시 수정 필요. 런타임 API 인증 실패              |
| 🟠 P1 High     | 2건  | 기능 누락 / API 스펙 불일치                       |
| 🟡 P2 Medium   | 1건  | 마이너 버전 차이 (현재 동작하나 최신 기능 미적용) |
| ✅ 통과        | 9건  | 올바른 패턴 확인                                  |

**핵심 결론**: v3.1 워크플로우는 구조와 패턴 설계는 우수하지만, P0 문제인 `$credentials.xxx` 표현식 충돌이 7개 노드에 잠재해 있어 **현재 상태로는 API 인증이 완전히 실패할 수 있음**. 수정 없이 프로덕션 배포 비권장.

---

## 1. 검증 범위 및 외부 소스 목록

### n8n 버전 확인

- **최신 stable**: n8n 2.16.0 (2026-04-07)
- **소스**: https://github.com/n8n-io/n8n/releases (GitHub Releases 직접 확인)

### Node typeVersion 최신 버전 (외부 확인)

| 노드 타입        | 현재 v3.1 | 최신    | 소스                                                                                                          |
| ---------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| webhook          | 2         | 2.1     | https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Webhook/Webhook.node.ts                   |
| respondToWebhook | 1.1       | **1.5** | https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/RespondToWebhook/RespondToWebhook.node.ts |
| httpRequest      | 4         | **4.4** | https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/HttpRequest/HttpRequest.node.ts           |
| code             | 2         | 2       | https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Code/Code.node.ts                         |
| if               | 2.2       | 2.3     | https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/If/If.node.ts                             |
| stickyNote       | 1         | 1       | https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/StickyNote/StickyNote.node.ts             |
| scheduleTrigger  | 1.2       | 1.2     | https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/ScheduleTrigger/ScheduleTrigger.node.ts   |

### `$credentials` 표현식 접근 가능 여부

- **확인 결론**: n8n 표현식에서 `$credentials.fieldName`으로 저장된 credential 값에 직접 접근하는 것은 **지원되지 않음**. 런타임에 `undefined` 반환.
- **소스 1**: n8n 공식 커뮤니티 포럼 — "It's not possible to reference values directly from stored credentials in n8n expressions" (Moderator 확인)
  URL: https://community.n8n.io/t/using-credentials-in-expressions/
- **소스 2**: n8n 문서 Expressions 섹션 — `$credentials` 변수는 지원되는 표현식 변수 목록에 없음
  URL: https://docs.n8n.io/code/builtin/overview/

### Observatory v2 API 메서드 확인

- **확인 결론**: Mozilla HTTP Observatory v2 API는 POST 메서드 필요. GET 불가.
- **엔드포인트**: `POST https://observatory-api.mdn.mozilla.net/api/v2/scan?host=<HOST>`
- **소스**: https://github.com/nicowillis/http-observatory/blob/main/README.md + https://observatory-api.mdn.mozilla.net/api/v2/
  (v1 API `http-observatory.security.mozilla.org/api/v1/` 는 서비스 종료 — learnings #23 일치)

---

## 2. 카테고리 A — 버전 호환성

### A-1: Webhook Trigger typeVersion

- **현재**: `typeVersion: 2` | **최신**: 2.1
- **판정**: ✅ 통과 (minor update, 현재 동작에 영향 없음)
- **비고**: v2.1의 신규 기능은 확인 불가 (URL: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/, 시도 횟수: 2)

### A-2: respondToWebhook typeVersion

- **현재**: `typeVersion: 1.1` (line 37) | **최신**: 1.5
- **판정**: 🟠 **P1 High**
- **누락 기능**:
  - v1.3: 두 번째 출력 브랜치 (성공/실패 분기)
  - v1.4: 응답 출력 옵션
  - v1.5: 스트리밍 응답 지원
- **소스**: https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/RespondToWebhook/RespondToWebhook.node.ts
- **수정 방법**: `"typeVersion": 1.1` → `"typeVersion": 1.5`

### A-3: httpRequest typeVersion

- **현재**: `typeVersion: 4` (15개 노드 전체) | **최신**: 4.4
- **판정**: 🟡 **P2 Medium**
- **영향**: v4.0 → v4.4 사이 추가된 기능(파일 업로드 개선, 응답 헤더 처리 등) 미적용. 현재 기능은 동작함.
- **소스**: https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/HttpRequest/HttpRequest.node.ts
- **수정 방법**: 모든 httpRequest 노드에서 `"typeVersion": 4` → `"typeVersion": 4.4`

### A-4: 기타 노드 typeVersion

- **판정**: ✅ 통과
  - `code: 2` (최신 일치)
  - `stickyNote: 1` (최신 일치)
  - `IF: 2.2` (최신 2.3 대비 minor, 현재 동작 정상)

---

## 3. 카테고리 B — 표현식 문법 정확성

### B-1: `$credentials.xxx` 표현식 — 핵심 P0 문제

**판정**: 🔴 **P0 Critical**

n8n 표현식에서 `$credentials.fieldName` 으로 저장된 credential 값에 직접 접근하는 것은 **지원되지 않음**. 런타임에 `undefined` 반환 → API 인증 헤더가 `"Bearer undefined"` 또는 빈 문자열이 됨 → 조용한 인증 실패.

**문제 상황 설명**: v3.1 워크플로우는 `credentials` 블록에 `httpCustomAuth` credential을 참조하고 있으나, 동시에 `parameters.headerParameters`에도 `$credentials.xxx` 표현식을 넣어두었습니다. n8n은 이 두 가지 인증 방식 중 credential 블록을 우선하지만, 헤더 표현식의 `$credentials.xxx`는 런타임에 `undefined`로 해석됩니다.

**영향 받는 노드 목록 (7개)**:

| 노드명                   | 라인       | 문제 표현식                                                                    | 실제 전송값                        |
| ------------------------ | ---------- | ------------------------------------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| A1: Firecrawl Scrape     | L59        | `=Bearer {{ $credentials.firecrawlApiKey }}`                                   | `"Bearer undefined"`               |
| A2: Firecrawl Map        | L97        | `=Bearer {{ $credentials.firecrawlApiKey }}`                                   | `"Bearer undefined"`               |
| B1: PageSpeed Mobile     | L123       | `&key={{ $credentials.googleApiKey }}`                                         | `&key=undefined`                   |
| B2: PageSpeed Desktop    | L145       | `&key={{ $credentials.googleApiKey }}`                                         | `&key=undefined`                   |
| Save to crawl_executions | L301, L302 | `={{ $credentials.supabaseUrl }}...`, `={{ $credentials.supabaseServiceKey }}` | URL이 `undefined/rest/v1/...`가 됨 |
| Callback Next.js         | L361, L367 | `={{ $credentials.findablyCallbackUrl                                          |                                    | '...' }}`, `=Bearer {{ $credentials.findablyBearerToken }}` | fallback URL은 동작하나 Bearer 토큰 없음 |
| Fail Callback Next.js    | L421, L427 | 위와 동일 패턴                                                                 | 동일                               |

**참고**: `Callback Next.js`와 `Fail Callback Next.js`의 URL 표현식 `={{ $credentials.findablyCallbackUrl || 'https://findably.kr/api/crawl/complete' }}` 는 `$credentials.findablyCallbackUrl`이 `undefined`가 되어도 `||` 연산자로 기본값 `'https://findably.kr/api/crawl/complete'`이 사용됩니다. 따라서 URL은 정상이나 Authorization 헤더는 여전히 문제입니다.

**소스**: https://community.n8n.io/t/using-credentials-in-expressions/ (Moderator 확인)

**올바른 수정 방법** (2가지 선택):

**옵션 1: httpCustomAuth credential에 헤더 직접 정의** (권장)

```
Credentials 설정 화면에서:
- Credential Type: Custom Auth
- Header Name: Authorization
- Header Value: Bearer <실제_API_KEY>
→ 그러면 parameters의 headerParameters에서 해당 헤더 항목 제거
```

**옵션 2: httpQueryAuth / httpHeaderAuth credential 사용**

```
Credentials 설정 화면에서:
- httpHeaderAuth 타입 선택
- Name: Authorization
- Value: Bearer <실제_API_KEY>
→ 노드의 credentials 블록을 httpHeaderAuth 타입으로 변경
```

**n8n Credential-based HTTP 헤더 주입 방식은 Credential 설정 화면에서 값을 정의하면 n8n이 자동으로 헤더에 주입합니다. 표현식으로 값을 꺼낼 수 없습니다.**

### B-2: Observatory B4 — GET vs POST 불일치

**판정**: 🟠 **P1 High**

- **현재**: `B4: Observatory v2` 노드에 `"method"` 필드 없음 (line 180-207) → 기본값 **GET**
- **요구사항**: Mozilla Observatory v2 API는 `POST /api/v2/scan?host=<HOST>` 필요
- **GET으로 호출 시**: API가 400 또는 405 반환 → continueOnFail: true 이므로 observatory 점수 항상 0점 처리됨
- **소스**: https://github.com/nicowillis/http-observatory/blob/main/README.md

**수정 방법**:

```json
// 수정 전 (line 181)
{
  "parameters": {
    "url": "=https://observatory-api.mdn.mozilla.net/api/v2/scan?host=...",
    ...
  }
}

// 수정 후
{
  "parameters": {
    "method": "POST",
    "url": "=https://observatory-api.mdn.mozilla.net/api/v2/scan?host=...",
    ...
  }
}
```

### B-3: 기타 표현식 문법

- **판정**: ✅ 통과
- `$('Validate & Set Variables').first().json.url` — 올바른 노드 참조
- `$execution.id` — 올바른 실행 ID 참조
- `JSON.stringify(...)` — Code 노드 내 올바른 사용
- `encodeURIComponent(...)` — URL 인코딩 올바른 사용

---

## 4. 카테고리 C — 노드 옵션 검증

### C-1: `options.redirect.redirect.followRedirects` 이중 중첩

- **현재**: Callback Next.js, Fail Callback Next.js에서 사용 (lines 388-392, 452-456)
- **판정**: ✅ 통과 (이중 중첩 구조 정확)

```json
"options": {
  "redirect": {
    "redirect": {
      "followRedirects": false
    }
  }
}
```

- **소스**: GitHub n8n HttpRequest 노드 소스 코드의 `redirect.redirect` nested 구조 확인
- **이유**: `followRedirects: false` 는 308 POST→GET 변환을 방지하는 핵심 설정 (learnings #12)

### C-2: `options.response.response.fullResponse` 이중 중첩

- **현재**: Callback, Fail Callback, C1~C4 텍스트 파일 노드에서 사용 (line 394-396 등)
- **판정**: ✅ 통과 (이중 중첩 구조 정확)

```json
"options": {
  "response": {
    "response": {
      "fullResponse": true
    }
  }
}
```

- **소스**: GitHub n8n HttpRequest 노드 소스 코드의 `response.response` nested 구조 확인

### C-3: `retryOnFail`, `maxTries`, `waitBetweenTries`, `continueOnFail` 위치

- **현재**: 루트 레벨에 배치 (예: lines 75-78, 175-178, 405-408)
- **판정**: ✅ 통과 (루트 레벨이 올바른 위치)

```json
{
  "id": "a1-firecrawl-scrape",
  "retryOnFail": true,
  "maxTries": 2,
  "waitBetweenTries": 5000,
  "continueOnFail": true,
  "parameters": { ... }  // parameters 안이 아님
}
```

- **소스**: n8n 공식 문서 — "retryOnFail is a root-level property on node objects"
  URL: https://docs.n8n.io/workflows/settings/

### C-4: `responseMode: 'responseNode'` webhook 설정

- **현재**: Webhook Trigger에 `"responseMode": "responseNode"` 사용 (line 10)
- **판정**: ✅ 통과 (비동기 202 응답 패턴에 올바른 설정)
- **설명**: 이 설정으로 Webhook이 즉시 202를 반환하고, 실제 처리는 respondToWebhook 노드가 담당

---

## 5. 카테고리 D — 워크플로우 패턴 검증

### D-1: `settings.executionOrder`

- **현재**: `"executionOrder": "v1"` (lines 833-834)
- **판정**: ✅ 통과

```json
"settings": {
  "executionOrder": "v1",
  "binaryMode": "separate",
  "saveExecutionProgress": true,
  ...
}
```

- **설명**: `v1` = 순차 브랜치 실행 (연결 순서대로). 11개 fan-out 브랜치가 안정적으로 순차 실행됨. `v0`(기본값)는 인터리브 실행으로 fan-out에서 예측 불가 동작 발생 가능.

### D-2: 11개 Fan-out 브랜치 구조

- **현재**: `Validate & Set Variables` 노드에서 11개 병렬 브랜치 연결
- **판정**: ✅ 통과 (executionOrder: v1과 함께 올바른 구조)
- **브랜치 목록**: A1 Firecrawl Scrape, A2 Firecrawl Map, B1 PageSpeed Mobile, B2 PageSpeed Desktop, B3 SSL Labs, B4 Observatory v2, C1 robots.txt, C2 sitemap.xml, C3 llms.txt, C4 Manifest, Respond 202 Accepted

### D-3: 멱등성 가드 설계

- **현재**: `requestId` 생성 (diagnosisId + timestamp + random), X-Request-Id 헤더 전달
- **판정**: ✅ 통과 (learnings #31의 멱등성 가드 원칙 적용됨)

### D-4: 202 즉시 응답 패턴

- **현재**: `Respond 202 Accepted` 노드가 11개 fan-out 중 하나로 즉시 응답
- **판정**: ✅ 통과 (Vercel maxDuration 문제 회피 패턴 올바름 — learnings #26)

---

## 6. 카테고리 E — 보안 + 성능

### E-1: 시크릿 하드코딩 검사

- **현재**: API 키가 JSON에 평문으로 없음. Credential ID 참조 또는 표현식 사용
- **판정**: ✅ 통과 (learnings #13 적용)
- **단, B-1의 표현식 문제와 별개**: 값은 하드코딩되지 않았으나 참조 방식이 잘못됨

### E-2: Bearer 토큰 헤더 형식

- **현재**: `=Bearer {{ $credentials.xxx }}` 형식
- **판정**: 형식 자체는 ✅ 올바름, 그러나 B-1 P0 문제로 인해 실제 값이 `undefined`로 전달됨
- **Firecrawl API 인증 방식**: `Authorization: Bearer <token>` (공식 스펙 일치)
- **소스**: https://docs.firecrawl.dev/api-reference/introduction

### E-3: 타임아웃 설정

- **현재**: 노드별 적절한 타임아웃 설정됨
  - A1 Firecrawl Scrape: 60,000ms
  - B1/B2 PageSpeed: 30,000ms
  - B3 SSL Labs: 60,000ms
  - B4 Observatory: 15,000ms
  - Callback: 30,000ms (retry 3회 × 10,000ms 간격)
- **판정**: ✅ 통과

### E-4: continueOnFail 적용 범위

- **현재**: 모든 외부 API 호출 노드에 `continueOnFail: true`
- **판정**: ✅ 통과 (단일 소스 실패가 전체 파이프라인 중단하지 않음)

---

## 7. 보너스 — `findably-monitor-v2-supabase.json` 검증

> 13-node 모니터링 워크플로우 검증 결과

### M-0: 개요

- **노드 수**: 13
- **트리거**: Schedule (6시간마다) + Manual Webhook
- **기능**: 4가지 헬스체크 (Webhook, Callback, Firecrawl, Observatory) → Supabase 저장 → 실패 시 Alert

### M-1: `settings.executionOrder`

- **현재**: `"executionOrder": "v1"` (lines 296-301)
- **판정**: ✅ 통과

### M-2: `$credentials.xxx` 표현식 (P0 동일 문제)

**판정**: 🔴 **P0 Critical** (v3.1과 동일 패턴)

**영향 받는 노드 (4개)**:

| 노드명                 | 라인             | 문제 표현식                                      |
| ---------------------- | ---------------- | ------------------------------------------------ |
| Check 2: Callback      | L74              | `=Bearer {{ $credentials.findablyBearerToken }}` |
| Check 3: Firecrawl     | L103             | `=Bearer {{ $credentials.firecrawlApiKey }}`     |
| Save to Supabase       | L143, L147, L148 | supabaseUrl, supabaseServiceKey 참조             |
| Save Alert to Supabase | L203, L207, L208 | 동일 supabase 패턴                               |

**수정 방법**: v3.1과 동일 — Credential 설정에서 헤더 값 직접 정의

### M-3: Observatory Check 4 — GET vs POST

**판정**: 🟠 **P1 High** (v3.1 B4와 동일 문제)

- **현재**: `Check 4: Observatory` 노드에 `"method"` 필드 없음 (lines 119-129) → 기본값 GET
- **요구사항**: Observatory v2 API는 POST 필요
- **수정**: `"method": "POST"` 추가

### M-4: scheduleTrigger typeVersion

- **현재**: `typeVersion: 1.2` (lines 14-19)
- **판정**: ✅ 통과 (최신 1.2와 일치)
- **소스**: https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/ScheduleTrigger/ScheduleTrigger.node.ts

### M-5: 모니터링 전용 이슈 — Check 1 URL 하드코딩

- **현재**: `Check 1: Webhook` 노드가 `https://findably.kr/api/crawl/health` URL을 표현식 없이 사용
- **판정**: ℹ️ 참고 사항 (기능 영향 없음, 도메인 변경 시 수동 업데이트 필요)

---

## 8. 전체 판정 요약

### 메인 v3.1 (findably-crawl-v3-production-hardened.json)

| #   | 항목                                | 판정             | 영향               |
| --- | ----------------------------------- | ---------------- | ------------------ |
| A-1 | Webhook typeVersion 2               | ✅ 통과          | —                  |
| A-2 | respondToWebhook typeVersion 1.1    | 🟠 P1            | 최신 기능 누락     |
| A-3 | httpRequest typeVersion 4           | 🟡 P2            | minor 기능 누락    |
| A-4 | code/stickyNote/IF 버전             | ✅ 통과          | —                  |
| B-1 | `$credentials.xxx` 표현식 (7 nodes) | 🔴 P0            | API 인증 전체 실패 |
| B-2 | Observatory B4 GET→POST             | 🟠 P1            | 보안 점수 항상 0   |
| B-3 | 기타 표현식 문법                    | ✅ 통과          | —                  |
| C-1 | followRedirects 이중 중첩           | ✅ 통과          | —                  |
| C-2 | fullResponse 이중 중첩              | ✅ 통과          | —                  |
| C-3 | retryOnFail 루트 레벨               | ✅ 통과          | —                  |
| C-4 | responseMode: responseNode          | ✅ 통과          | —                  |
| D-1 | executionOrder: v1                  | ✅ 통과          | —                  |
| D-2 | Fan-out 11 브랜치                   | ✅ 통과          | —                  |
| D-3 | 멱등성 requestId                    | ✅ 통과          | —                  |
| D-4 | 202 즉시 응답 패턴                  | ✅ 통과          | —                  |
| E-1 | 시크릿 하드코딩 없음                | ✅ 통과          | —                  |
| E-2 | Bearer 형식                         | ✅ 형식은 올바름 | B-1로 인해 값 무효 |
| E-3 | 타임아웃 설정                       | ✅ 통과          | —                  |
| E-4 | continueOnFail 적용                 | ✅ 통과          | —                  |

### 모니터링 v2 (findably-monitor-v2-supabase.json)

| #   | 항목                         | 판정    |
| --- | ---------------------------- | ------- |
| M-1 | executionOrder: v1           | ✅ 통과 |
| M-2 | `$credentials.xxx` (4 nodes) | 🔴 P0   |
| M-3 | Observatory GET→POST         | 🟠 P1   |
| M-4 | scheduleTrigger v1.2         | ✅ 통과 |

---

## 9. v3.2 JSON 수정 제안 (diff)

> P0 + P1 수정만 포함. P2(typeVersion 업그레이드)는 선택 사항.

### Fix 1 (P0): A1 Firecrawl Scrape — 헤더 표현식 제거

**수정 이유**: `$credentials.firecrawlApiKey`는 런타임에 `undefined`. httpCustomAuth credential이 이미 올바르게 설정되어 있으므로 parameters의 명시적 Authorization 헤더가 필요 없음.

```diff
 {
   "parameters": {
     "method": "POST",
     "url": "https://api.firecrawl.dev/v1/scrape",
-    "sendHeaders": true,
-    "headerParameters": {
-      "parameters": [
-        {
-          "name": "Authorization",
-          "value": "=Bearer {{ $credentials.firecrawlApiKey }}"
-        }
-      ]
-    },
     "sendBody": true,
     ...
   },
   "credentials": {
     "httpCustomAuth": {
       "id": "FIRECRAWL_CRED_ID",
       "name": "firecrawl-api"
     }
   }
 }
```

**전제 조건**: n8n Credentials에서 `firecrawl-api` (httpCustomAuth 타입)가 다음과 같이 설정되어 있어야 함:

- Header Name: `Authorization`
- Header Value: `Bearer <실제_FIRECRAWL_API_KEY>`

---

### Fix 2 (P0): A2 Firecrawl Map — 헤더 표현식 수정

```diff
 "headerParameters": {
   "parameters": [
     {
       "name": "Authorization",
-      "value": "=Bearer {{ $credentials.firecrawlApiKey }}"
+      "value": "={{ $('Validate & Set Variables').first().json.firecrawlApiKey }}"
     }
   ]
 }
```

**대안 (권장)**: Fix 1과 동일하게 헤더 제거 + Credential에 위임.

**참고**: A2 노드에도 `credentials.httpCustomAuth: FIRECRAWL_CRED_ID`가 있으므로 헤더 완전 제거가 더 깔끔합니다.

---

### Fix 3 (P0): B1/B2 PageSpeed — URL 표현식 수정

**문제**: `&key={{ $credentials.googleApiKey }}`가 `&key=undefined`로 전달됨

**수정 방법 A** (환경변수 방식 — 권장):
n8n 환경변수에 `GOOGLE_API_KEY` 설정 후:

```diff
- "url": "=https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...&key={{ $credentials.googleApiKey }}"
+ "url": "=https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...&key={{ $env.GOOGLE_API_KEY }}"
```

**수정 방법 B** (Validate 노드 경유 — 대안):
Validate & Set Variables 코드 노드에서 환경변수를 변수로 초기화 후 `$json.googleApiKey`로 참조.

```diff
- "url": "=https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...&key={{ $credentials.googleApiKey }}"
+ "url": "=https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={{ encodeURIComponent($('Validate & Set Variables').first().json.url) }}&strategy=mobile&key={{ $('Validate & Set Variables').first().json.googleApiKey }}"
```

---

### Fix 4 (P0): Save to crawl_executions — URL + 헤더 수정

```diff
- "url": "={{ $credentials.supabaseUrl }}/rest/v1/findably_crawl_executions"
+ "url": "={{ $env.SUPABASE_URL }}/rest/v1/findably_crawl_executions"

 "headerParameters": {
   "parameters": [
-    { "name": "apikey", "value": "={{ $credentials.supabaseServiceKey }}" },
-    { "name": "Authorization", "value": "=Bearer {{ $credentials.supabaseServiceKey }}" },
+    { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_KEY }}" },
+    { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_KEY }}" },
     ...
   ]
 }
```

**n8n 환경변수 설정**: Elest.io n8n 인스턴스의 환경변수에 `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` 추가.

---

### Fix 5 (P0): Callback + Fail Callback — Bearer 토큰 수정

```diff
 {
   "name": "Authorization",
-  "value": "=Bearer {{ $credentials.findablyBearerToken }}"
+  "value": "=Bearer {{ $env.FINDABLY_CALLBACK_SECRET }}"
 }
```

**참고**: URL 표현식 `={{ $credentials.findablyCallbackUrl || 'https://findably.kr/api/crawl/complete' }}`은 `$credentials.findablyCallbackUrl`이 `undefined`가 되어도 fallback이 동작합니다. 하지만 명확성을 위해 환경변수로 변경 권장:

```diff
- "url": "={{ $credentials.findablyCallbackUrl || 'https://findably.kr/api/crawl/complete' }}"
+ "url": "={{ $env.FINDABLY_CALLBACK_URL || 'https://findably.kr/api/crawl/complete' }}"
```

---

### Fix 6 (P1): B4 Observatory v2 — POST 메서드 추가

```diff
 {
   "parameters": {
+    "method": "POST",
     "url": "=https://observatory-api.mdn.mozilla.net/api/v2/scan?host={{ encodeURIComponent(new URL($('Validate & Set Variables').first().json.url).hostname) }}",
     ...
   }
 }
```

---

### Fix 7 (P1): respondToWebhook typeVersion 업그레이드

```diff
 {
   "type": "n8n-nodes-base.respondToWebhook",
-  "typeVersion": 1.1
+  "typeVersion": 1.5
 }
```

---

### 모니터링 v2 Fix 목록

**M-Fix 1** (P0): Check 2, Check 3 노드 — Fix 5와 동일 패턴 적용
**M-Fix 2** (P0): Save to Supabase, Save Alert to Supabase — Fix 4와 동일 패턴 적용
**M-Fix 3** (P1): Check 4 Observatory — Fix 6와 동일하게 `"method": "POST"` 추가

---

## 10. 수정 우선순위 로드맵

```
즉시 (프로덕션 적용 전 필수):
  P0-Fix 1~5: $credentials 표현식 → $env 환경변수로 교체
  P0-Fix 1~3 (monitor): 동일 수정

단기 (다음 배포 사이클):
  P1-Fix 6: Observatory POST 메서드 추가
  P1 (monitor): Observatory POST 추가
  P1-Fix 7: respondToWebhook 1.1 → 1.5 업그레이드

선택 사항:
  P2: httpRequest typeVersion 4 → 4.4 전체 업그레이드
  P2: IF typeVersion 2.2 → 2.3 업그레이드
```

---

## 11. 주의 사항 — 확인 불가 항목

| 항목                                       | 상태                                                    | URL 시도                                                                                     |
| ------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| webhook typeVersion 2.1 신규 기능 목록     | 확인 불가                                               | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/ (nav만 반환)     |
| httpRequest v4.4 신규 기능 상세 목록       | 확인 불가                                               | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/ (nav만 반환) |
| IF typeVersion 2.3 신규 기능               | 확인 불가                                               | 위와 동일                                                                                    |
| `$env.VARIABLE_NAME` 표현식 접근 지원 여부 | 미확인 (커뮤니티에서 일반적으로 사용되는 패턴으로 확인) | https://community.n8n.io/t/env-variables-in-expressions/                                     |

> **`$env` 표현식 관련**: n8n에서 환경변수에 접근하는 정식 방법은 `$env.VARIABLE_NAME`이지만, 보안상 이유로 n8n 2.0+ 에서는 관리자가 명시적으로 환경변수 접근을 허용해야 할 수 있습니다. Elest.io 설정에서 확인 권장.
> 참고: https://docs.n8n.io/code/builtin/overview/

---

_리포트 생성: 2026-04-07 | n8n 2.16.0 기준 | 외부 검증 소스 URL 포함_
