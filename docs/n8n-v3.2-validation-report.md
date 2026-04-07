# n8n Workflow v3.2 — 외부 재검증 보고서

> 역할: n8n 시니어 전문가 (2차 외부 재검증)
> 검증 대상: `findably-crawl-v3-production-v3.2.json` (v3.2) + `findably-monitor-v2-supabase-fixed.json` (v2.1 Auth Fixed)
> v3.1 보고서 수정사항 적용 확인 + `$env` / `predefinedCredentialType` 동작 방식 공식 소스 확정
> 검증일: 2026-04-06
> 출처 확정: n8n GitHub `packages/workflow/src/workflow-data-proxy-env-provider.ts` (gh API 직접 조회)

---

## Executive Summary

| 항목                              | 결과                                                                      |
| --------------------------------- | ------------------------------------------------------------------------- |
| P0 픽스 ($credentials.xxx 제거)   | ✅ 전체 적용 완료                                                         |
| P1-1 픽스 (Observatory POST)      | ✅ 적용 완료                                                              |
| P1-2 픽스 (respondToWebhook 1.5)  | ✅ 적용 완료                                                              |
| P2-1 픽스 (httpRequest 4.4)       | ⚠️ **부분 미적용** — 콜백 2개 노드 v4 잔존                                |
| $env 작동 방식                    | ✅ **공식 확정** — 기본값 차단. `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` 필수 |
| predefinedCredentialType 자동주입 | ✅ 구조 검증 완료 — httpHeaderAuth 패턴 정상                              |
| FIRECRAWL_CRED_ID 플레이스홀더    | 🔴 **미해결** — 배포 전 반드시 교체 필요                                  |

---

## 1. 확정 사항: $env.VARIABLE_NAME 동작 방식

### 1.1 공식 소스 (gh API로 직접 조회)

파일: `packages/workflow/src/workflow-data-proxy-env-provider.ts`

```typescript
export function createEnvProviderState(): EnvProviderState {
  const isProcessAvailable = typeof process !== 'undefined'
  const isEnvAccessBlocked = isProcessAvailable
    ? process.env.N8N_BLOCK_ENV_ACCESS_IN_NODE !== 'false'
    : false
  const env: Record<string, string> =
    !isProcessAvailable || isEnvAccessBlocked
      ? {}
      : (process.env as Record<string, string>)
  // ...
}
```

블락 시 에러 메시지:

```
"access to env vars denied"
"If you need access please contact the administrator to remove the environment variable 'N8N_BLOCK_ENV_ACCESS_IN_NODE'"
```

### 1.2 확정된 동작 규칙

| 조건                                         | 동작                                                 |
| -------------------------------------------- | ---------------------------------------------------- |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` 미설정 (기본) | **차단됨** — `!== 'false'` 조건으로 undefined도 차단 |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE=true`          | 차단됨                                               |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`         | **허용됨** — `$env.VAR_NAME`으로 접근 가능           |

**핵심**: 기본값은 **차단(blocked)**이다. 허용하려면 명시적으로 `=false`로 설정해야 한다.

### 1.3 `$env`와 `process.env` 차이

- `process.env.VAR` — AST 샌드박싱으로 직접 차단 (`expression-sandboxing.ts`에서 `process` 객체 비움)
- `$env.VAR` — WorkflowDataProxy를 통해 별도 경로로 접근. `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`일 때만 허용

### 1.4 Elest.io 적용 방법

Elest.io Docker Compose 환경변수에 추가:

```
N8N_BLOCK_ENV_ACCESS_IN_NODE=false
```

v3.2 Sticky Note에 이미 문서화되어 있음 ✅

---

## 2. 확정 사항: predefinedCredentialType + httpHeaderAuth 자동 주입

### 2.1 httpHeaderAuth 크리덴셜 구조

`httpHeaderAuth` 타입은 `name`(헤더명)과 `value`(헤더값) 두 필드를 저장한다.

설정 예시:

```json
{
  "name": "Authorization",
  "value": "Bearer fc-XXXXX"
}
```

### 2.2 httpRequest v4에서 자동 주입 패턴

```json
{
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "credentials": {
    "httpHeaderAuth": {
      "id": "FIRECRAWL_CRED_ID",
      "name": "Firecrawl API Key"
    }
  }
}
```

이 패턴이 설정되면 n8n이 요청 시 크리덴셜에서 `Authorization: Bearer [value]`를 **자동 주입**한다.

따라서 `headerParameters`에 `Authorization`을 별도로 추가하면 **헤더 중복**이 발생한다. v3.2에서 A1/A2 노드의 명시적 Authorization 헤더를 제거한 것은 올바른 처리다.

### 2.3 v3.1 권고(`httpCustomAuth`) vs v3.2 실제 구현(`httpHeaderAuth`) 비교

| 항목             | httpCustomAuth       | httpHeaderAuth          |
| ---------------- | -------------------- | ----------------------- |
| 설정 방법        | JSONPath 기반 커스텀 | name/value 단순 쌍      |
| 용도             | 복잡한 인증          | 단순 Authorization 헤더 |
| auto-inject      | ✅                   | ✅                      |
| Firecrawl에 적합 | ✅                   | ✅                      |

**결론**: `httpHeaderAuth`도 `predefinedCredentialType` 패턴에서 정상 작동한다. v3.1의 `httpCustomAuth` 권고는 선택지 중 하나였을 뿐이며, v3.2의 `httpHeaderAuth` 사용은 올바르다.

---

## 3. findably-crawl-v3-production-v3.2.json 검증

### 3.1 P0 픽스 검증 — $credentials.xxx 제거

| 노드                  | v3.1 문제                                     | v3.2 상태                                                      |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| A1 Firecrawl Scrape   | Authorization 헤더에 `$credentials.firecrawl` | ✅ headerParameters 자체 제거됨, predefinedCredentialType 사용 |
| A2 Firecrawl Map      | 동일                                          | ✅ 동일하게 수정됨                                             |
| B1 PageSpeed Desktop  | `$credentials.googleApiKey` 패턴              | ✅ `$env.GOOGLE_API_KEY` + `$json.target_url`로 교체           |
| B2 PageSpeed Mobile   | 동일                                          | ✅ 동일하게 수정됨                                             |
| B3 CrUX API           | 해당 없음                                     | ✅ 별도 크리덴셜 미사용                                        |
| Callback Next.js      | `$credentials.callbackSecret` 패턴            | ✅ `$env.CRAWL_EXECUTE_SECRET`으로 교체                        |
| Fail Callback Next.js | 동일                                          | ✅ 동일하게 수정됨                                             |

**P0 결과: ✅ 전체 7개 노드 수정 확인**

### 3.2 P1-1 픽스 검증 — Mozilla Observatory v2

| 항목         | v3.1 상태                                                               | v3.2 상태                                                                                     |
| ------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 메서드       | GET                                                                     | ✅ POST                                                                                       |
| URL          | `https://http-observatory.security.mozilla.org/api/v1/analyze?host=...` | ✅ `https://observatory-api.mdn.mozilla.net/api/v2/scan?host={{ $json.parsed_url.hostname }}` |
| Body         | 없음                                                                    | ✅ JSON body 추가 (`{"host": "..."}`)                                                         |
| Content-Type | 없음                                                                    | ✅ `application/json` 헤더 추가                                                               |

**P1-1 결과: ✅ 완전 수정 확인**

### 3.3 P1-2 픽스 검증 — respondToWebhook typeVersion

| 항목        | v3.1 상태            | v3.2 상태 |
| ----------- | -------------------- | --------- |
| typeVersion | 1.1                  | ✅ 1.5    |
| 적용 노드   | Respond 202 Accepted | ✅ 확인됨 |

**P1-2 결과: ✅ 수정 확인**

### 3.4 P2-1 픽스 검증 — httpRequest typeVersion 4.4

| 노드                      | v3.1 권고 | v3.2 상태      |
| ------------------------- | --------- | -------------- |
| A1 Firecrawl Scrape       | 4 → 4.4   | ✅ 4.4         |
| A2 Firecrawl Map          | 4 → 4.4   | ✅ 4.4         |
| B1 PageSpeed Desktop      | 4 → 4.4   | ✅ 4.4         |
| B2 PageSpeed Mobile       | 4 → 4.4   | ✅ 4.4         |
| B3 CrUX API               | 4 → 4.4   | ✅ 4.4         |
| B4 Observatory v2         | 4 → 4.4   | ✅ 4.4         |
| B5 SSL Labs               | 4 → 4.4   | ✅ 4.4         |
| **Callback Next.js**      | 4 → 4.4   | 🔴 **v4 잔존** |
| **Fail Callback Next.js** | 4 → 4.4   | 🔴 **v4 잔존** |

**P2-1 결과: ⚠️ 7/9 적용. Callback 2개 노드 미적용.**

실제 JSON 증거:

```json
// Callback Next.js (Node ID: callback_nextjs_node)
{
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4  // ← 4.4가 되어야 함
}
// Fail Callback Next.js (Node ID: fail_callback_nextjs_node)
{
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4  // ← 4.4가 되어야 함
}
```

### 3.5 추가 검증 항목

| 항목                                          | 상태                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| $env.GOOGLE_API_KEY (B1/B2)                   | ✅ 사용됨. `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` 시 정상 작동              |
| $env.SUPABASE_URL / $env.SUPABASE_SERVICE_KEY | ✅ 사용됨                                                                 |
| $env.CRAWL_EXECUTE_SECRET (콜백 Bearer)       | ✅ `=Bearer {{ $env.CRAWL_EXECUTE_SECRET }}` 형식 정확                    |
| $env.NEXT_PUBLIC_SITE_URL (콜백 URL)          | ✅ `={{ $env.NEXT_PUBLIC_SITE_URL }}/api/crawl/complete` 형식 정확        |
| fullResponse: true (콜백 노드)                | ✅ double-nested 구조 `options.response.response.fullResponse: true` 정확 |
| 리다이렉트 비활성화                           | ✅ `options.redirect.redirect.followRedirects: false`                     |
| executionOrder: "v1"                          | ✅ 설정됨 — 안정적 팬아웃 실행                                            |
| 하드코딩 시크릿 없음                          | ✅ 모든 시크릿이 $env 참조 또는 크리덴셜 참조                             |
| FIRECRAWL_CRED_ID 플레이스홀더                | 🔴 **미해결** — A1/A2 credential id가 "FIRECRAWL_CRED_ID" 문자열          |

---

## 4. findably-monitor-v2-supabase-fixed.json 검증

### 4.1 전체 노드 목록 (14개)

| 노드명              | 타입            | typeVersion |
| ------------------- | --------------- | ----------- |
| Schedule Trigger    | scheduleTrigger | 1.2         |
| Check 1 Health      | httpRequest     | 4.2         |
| Check 2 Callback    | httpRequest     | 4.2         |
| Check 3 Firecrawl   | httpRequest     | 4.4         |
| Check 4 Observatory | httpRequest     | 4.2         |
| IF Health OK        | if              | 2           |
| IF Callback OK      | if              | 2           |
| IF Firecrawl OK     | if              | 2           |
| IF Observatory OK   | if              | 2           |
| Aggregate Results   | code            | 2           |
| Save to Supabase    | httpRequest     | 4.2         |
| Alert Slack         | httpRequest     | 4.1         |
| No-op Success       | noOp            | 1           |
| No-op Alert         | noOp            | 1           |

### 4.2 Check 1 Health 검증

```json
{
  "url": "={{ $env.FINDABLY_HEALTH_URL || 'https://findably.kr/api/health' }}",
  "options": {
    "response": {
      "response": {
        "fullResponse": true
      }
    }
  }
}
```

- `$env || 'fallback'` 패턴: ✅ 올바름 — `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`이면 env 값 사용, 차단 시 ExpressionError 발생하므로 fallback이 동작하지 않을 수 있음 (아래 주의사항 참조)
- `fullResponse: true`: ✅ 적용됨

### 4.3 Check 2 Callback 검증

```json
{
  "url": "={{ $env.FINDABLY_SITE_URL || 'https://findably.kr' }}/api/crawl/complete",
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{ $env.FINDABLY_CALLBACK_SECRET }}"
      }
    ]
  },
  "options": {
    "response": { "response": { "fullResponse": true } }
  }
}
```

- Authorization 헤더 값 표현식 `=Bearer {{ $env.FINDABLY_CALLBACK_SECRET }}`: ✅ 올바른 n8n 표현식 문법
- `fullResponse: true`: ✅ 적용됨

### 4.4 Check 3 Firecrawl 검증

```json
{
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "credentials": {
    "httpHeaderAuth": {
      "id": "FIRECRAWL_CRED_ID",
      "name": "Firecrawl API Key"
    }
  },
  "options": {
    "response": { "response": { "fullResponse": true } }
  }
}
```

- `predefinedCredentialType` + `httpHeaderAuth`: ✅ 올바른 자동 주입 패턴
- 명시적 Authorization 헤더 없음: ✅ 중복 방지됨
- `fullResponse: true`: ✅ 적용됨
- `FIRECRAWL_CRED_ID`: 🔴 **플레이스홀더 미교체** — 배포 전 실제 credential ID로 교체 필요

### 4.5 Check 4 Observatory 검증

```json
{
  "method": "POST",
  "url": "https://observatory-api.mdn.mozilla.net/api/v2/scan?host={{ $json.target_host }}",
  "options": {
    "response": { "response": { "fullResponse": true } }
  }
}
```

- POST 메서드: ✅ 적용됨
- v2 URL: ✅ 정확
- `fullResponse: true`: ✅ 적용됨

### 4.6 모니터 v2.1 종합 결과

| 픽스 항목                       | 상태                                                                  |
| ------------------------------- | --------------------------------------------------------------------- |
| P0: $credentials.xxx 제거       | ✅                                                                    |
| P1-1: Observatory POST + v2 URL | ✅                                                                    |
| P2-1: httpRequest typeVersion   | ⚠️ Check 1/2/4/Supabase/Alert는 4.1~4.2. Check 3만 4.4. 통일되지 않음 |
| fullResponse: true (전체)       | ✅                                                                    |
| $env 표현식                     | ✅                                                                    |
| FIRECRAWL_CRED_ID               | 🔴 미교체                                                             |

---

## 5. $env fallback 패턴 주의사항

v3.2와 monitor v2.1 모두 `$env.VAR || 'fallback'` 패턴을 사용한다.

### 중요 동작 차이

| 조건                                              | `$env.VAR                                                         |     | 'fallback'` 결과 |
| ------------------------------------------------- | ----------------------------------------------------------------- | --- | ---------------- |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` + VAR 설정됨 | ✅ VAR 값 사용                                                    |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` + VAR 미설정 | ✅ `''`(빈 문자열) → falsy → fallback 값 사용                     |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` 미설정 or `true`   | 🔴 **ExpressionError 발생** → fallback 동작 안 함, 노드 실행 실패 |

**결론**: `$env.VAR || 'fallback'` 패턴에서 fallback은 VAR이 **비어있을 때만** 작동한다. env access가 차단된 경우엔 에러가 던져지므로 fallback이 실행되지 않는다.

Elest.io에 `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`가 설정되어 있다면 이 패턴은 안전하다.

---

## 6. 미해결 항목 및 배포 전 필수 조치

### 6.1 🔴 CRITICAL: FIRECRAWL_CRED_ID 교체

**두 workflow 모두** `"id": "FIRECRAWL_CRED_ID"` 플레이스홀더가 그대로 남아 있다. 실제 Firecrawl API Key credential의 n8n 내부 ID로 교체해야 한다.

조회 방법:

```
n8n UI → Settings → Credentials → Firecrawl API Key → URL의 ID 확인
예: https://n8n.example.com/credentials/abc123def456
→ "FIRECRAWL_CRED_ID" → "abc123def456" 으로 교체
```

### 6.2 ⚠️ P2-1 미적용 노드 수정

**crawl v3.2**: "Callback Next.js" + "Fail Callback Next.js" 노드를 `typeVersion: 4` → `typeVersion: 4.4`로 변경.

실제로 typeVersion 4 vs 4.4는 동작 차이가 주로 응답 처리 방식에 있으나, 버전 4.4가 최신 버그 픽스를 포함하므로 통일이 권장된다.

수정할 부분:

```json
// Before
"typeVersion": 4

// After
"typeVersion": 4.4
```

### 6.3 ⚠️ Elest.io 환경변수 설정 확인

배포 전 Elest.io n8n 인스턴스에 아래 환경변수들이 모두 설정되어 있는지 확인:

```
N8N_BLOCK_ENV_ACCESS_IN_NODE=false   ← $env 작동의 전제 조건
GOOGLE_API_KEY=...
CRAWL_EXECUTE_SECRET=...
NEXT_PUBLIC_SITE_URL=https://findably.kr
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
FINDABLY_HEALTH_URL=...              ← monitor용
FINDABLY_SITE_URL=...               ← monitor용
FINDABLY_CALLBACK_SECRET=...        ← monitor용
```

---

## 7. 최종 결론 및 권고

### v3.2 크롤 워크플로우

**배포 가능 여부**: ⚠️ **FIRECRAWL_CRED_ID 교체 후 배포 가능**

- P0/P1 픽스: 완전 적용 ✅
- P2-1 콜백 2개 노드: 기능에는 영향 없으나 버전 통일 권장
- $env 패턴: `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` 설정 시 완전 정상 작동
- predefinedCredentialType + httpHeaderAuth: 구조적으로 올바름

### v2.1 모니터 워크플로우

**배포 가능 여부**: ⚠️ **FIRECRAWL_CRED_ID 교체 후 배포 가능**

- 핵심 픽스 적용: ✅
- typeVersion 혼재 (4.1~4.4): 경미한 버전 불일치, 기능에는 영향 없음

### 총평

v3.1에서 v3.2로의 업그레이드는 **모든 P0/P1 이슈를 올바르게 수정**했다. 남은 이슈는:

1. `FIRECRAWL_CRED_ID` 플레이스홀더 교체 (배포 전 필수, 1~2분 작업)
2. Callback 노드 typeVersion 4 → 4.4 (선택적 개선)

`$env.VARIABLE_NAME` 패턴은 n8n 공식 코드에 의해 **정상 메커니즘으로 확정**되었다. 단, `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` 환경변수가 Elest.io에 설정되어 있어야만 작동한다는 점이 배포의 전제 조건이다.

---

_검증 기준: n8n 2.16.0 / packages/workflow/src/workflow-data-proxy-env-provider.ts 직접 분석_
