# Crawl Error Handling & Recovery Guide

> **버전**: 1.0
> **최종 업데이트**: 2026-03-11
> **상태**: Implementation Complete

---

## Overview

Findably 크롤링 시스템은 예기치 않은 네트워크 오류, 타임아웃, API 할당량 초과 등 다양한 실패 상황을 안정적으로 처리합니다.

### 핵심 설계 원칙

1. **분류 (Classification)**: 에러를 명확히 분류하여 적절한 복구 전략 적용
2. **재시도 (Retry)**: 일시적 오류에 대해 지수 백오프로 재시도
3. **로깅 (Logging)**: 모든 에러를 상세히 기록하여 디버깅 지원
4. **사용자 알림 (Notification)**: 사용자 친화적 메시지 제공

---

## Error Classification

크롤 에러는 다음 4가지로 분류됩니다:

### 1. failed_timeout (타임아웃)

**정의**: 웹사이트가 300초 이내에 응답하지 않은 경우

**감지 패턴**:
- `timeout` (대소문자 무관)
- `Timeout after Xms`
- Playwright 타임아웃: `Playwright: Timeout 300000ms`

**DB 저장**:
```sql
-- crawl_results 테이블
status = 'failed_timeout'
```

**복구 전략**:
```
액션: RETRY
- 최대 재시도: 3회
- 지연 시간: 10초 → 30초 → 60초 (지수 백오프)
- 사용자 메시지: "웹사이트 응답이 매우 느립니다. 몇 초 후 다시 시도하겠습니다."
```

**대응 절차**:
1. n8n 워크플로우에서 첫 타임아웃 감지
2. 자동으로 지정된 지연 후 재시도
3. 3회 재시도 실패 시 `failed_timeout` 상태로 저장
4. 사용자에게 느린 응답 알림

---

### 2. failed_network (네트워크 오류)

**정의**: 네트워크 수준의 일시적 연결 오류

**감지 패턴**:

| 코드 | 의미 | 예시 |
|------|------|------|
| ECONNREFUSED | 연결 거부 | 포트가 열려있지 않음 |
| ENOTFOUND | DNS 해석 실패 | 도메인 존재하지 않음 |
| EHOSTUNREACH | 호스트 도달 불가 | 네트워크 경로 없음 |
| ETIMEDOUT | 네트워크 타임아웃 | TCP 시간 초과 |
| ECONNRESET | 연결 리셋 | 원격 서버가 연결 종료 |
| Connection refused | 일반 연결 거부 | 유명한 서비스 차단 |
| Connection timed out | 연결 시간 초과 | 느린 네트워크 |

**DB 저장**:
```sql
-- crawl_results 테이블
status = 'failed_network'
```

**복구 전략**:
```
액션: RETRY
- 최대 재시도: 3회
- 지연 시간: 10초 → 30초 → 60초 (지수 백오프)
- 사용자 메시지: "네트워크 연결이 일시적으로 끊겼습니다. 다시 시도하겠습니다."
```

**대응 절차**:
1. n8n HTTP Request 노드에서 네트워크 에러 감지
2. 에러 코드 추출 (ECONNREFUSED 등)
3. 자동 재시도 (지정된 지연)
4. 3회 재시도 실패 시 `failed_network` 상태로 저장
5. 로그에 에러 코드와 메시지 기록

**일반적인 원인과 해결책**:

| 원인 | 해결책 |
|------|--------|
| URL의 도메인이 존재하지 않음 | URL 다시 확인 |
| 웹사이트 방화벽이 크롤러 차단 | IP 화이트리스트 추가 요청 |
| 웹사이트 일시 다운 | 나중에 재시도 |
| 네트워크 경로 오류 (ISP 문제) | 수분 후 재시도 |

---

### 3. failed_invalid_url (URL 오류)

**정의**: 제공된 URL이 유효하지 않아 크롤링 시작 불가

**감지 패턴**:
- `Invalid URL`
- `URL parse failure`
- `Malformed URL`

**DB 저장**:
```sql
-- crawl_results 테이블
status = 'failed_invalid_url'
```

**복구 전략**:
```
액션: FAIL (재시도 불가)
- 사용자 메시지: "올바른 URL 형식인지 확인하세요. 예: https://example.com"
```

**대응 절차**:
1. n8n "Set Variables" 노드에서 URL 검증 실패
2. 즉시 실패로 표시 (재시도 안 함)
3. 명확한 에러 메시지로 사용자에게 알림
4. 로그에 원본 URL과 검증 실패 이유 기록

**유효한 URL 형식**:
```
✅ https://example.com
✅ https://example.com/
✅ https://subdomain.example.com/path?query=value
✅ http://192.168.1.1:8080

❌ example.com (프로토콜 없음)
❌ htp://example.com (오타)
❌ https:/example.com (슬래시 부족)
```

---

### 4. failed_quota (API 할당량 초과)

**정의**: Google PageSpeed Insights 또는 기타 외부 API의 일일/월간 할당량 초과

**감지 패턴**:
- `quota exceeded`
- `quota limit`
- `rate limited`
- `429 Too Many Requests`

**DB 저장**:
```sql
-- crawl_results 테이블에 별도 필드로 기록할 수 있음
-- 현재는 performance_metrics = null로 처리
```

**복구 전략**:
```
액션: DEFER (연기)
- 재시도 안 함 (할당량 복구 대기 필요)
- 사용자 메시지: "API 할당량이 초과되었습니다. 몇 분 후 다시 시도하세요."
```

**대응 절차**:
1. PageSpeed Insights API 호출 시 할당량 초과 감지
2. 성능 메트릭 수집을 생략하고 계속 진행
3. `performance_metrics = null` 로 저장
4. 대시보드에서 "성능 데이터 미수집" 표시
5. 24시간 후 자동 재시도 스케줄링

**할당량 정보** (Google PageSpeed Insights):
- 무료 플랜: 일 25,000 요청
- 유료 플랜: 일 100,000+ 요청
- 리셋: 자정 UTC 기준

---

## Error Handling Architecture

### System Flow

```
┌─────────────────────────────────────┐
│ Next.js Frontend                    │
│ → triggerCrawling()                 │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ n8n Webhook Trigger    │
    │ /webhook/findably-crawl│
    └────────┬───────────────┘
             │
    ┌────────▼──────────────┐
    │ Set Variables         │
    │ (URL Validation)      │
    └────────┬──────────────┘
             │
    ┌────────▼───────────────────┐
    │ HTTP Request (Playwright)  │
    │ (with error handler)       │
    └────────┬───────────────────┘
             │
    ┌────────▼────────────────────┐
    │ Error Classifier            │
    │ - Timeout?                  │
    │ - Network?                  │
    │ - Invalid URL?              │
    └────────┬────────────────────┘
             │
    ┌────────▼────────────────────┐
    │ Recovery Decision           │
    │ - Retry? (Network/Timeout)  │
    │ - Defer? (Quota)            │
    │ - Fail? (Invalid URL)       │
    └────────┬────────────────────┘
             │
    ┌────────▼────────────────────┐
    │ Store Result in Supabase    │
    │ crawl_results.status        │
    └────────────────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Notify User (Dashboard)    │
    └────────────────────────────┘
```

---

## Code Reference

### Retry Utility (`src/lib/crawl/retry.ts`)

지수 백오프 재시도를 구현합니다:

```typescript
import { exponentialBackoffRetry } from '@/lib/crawl/retry';

// 예시: n8n 크롤링 작업
const result = await exponentialBackoffRetry(
  async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP error');
    return response.text();
  },
  {
    delays: [10000, 30000, 60000], // 10초, 30초, 60초
  }
);
```

**파라미터**:
- `fn`: 실행할 비동기 함수
- `options.delays`: 지연 시간 배열 (밀리초), 기본값: [10000, 30000, 60000]

**반환값**: 함수의 반환값 또는 모든 재시도 실패 시 에러 throw

### Error Handler Utility (`src/lib/crawl/error-handler.ts`)

에러 분류 및 복구 전략:

```typescript
import {
  classifyCrawlError,
  extractErrorDetails,
  shouldRetryError,
  getErrorRecoveryStrategy,
} from '@/lib/crawl/error-handler';

// 에러 분류
const status = classifyCrawlError(error);
// 결과: 'failed_timeout' | 'failed_network' | 'failed_invalid_url'

// 에러 상세 정보 추출
const details = extractErrorDetails(error);
// { code: 'ECONNREFUSED', message: 'Connection refused' }

// 재시도 가능 여부 확인
if (shouldRetryError(error)) {
  // 재시도 로직
}

// 복구 전략 조회
const strategy = getErrorRecoveryStrategy(error);
// {
//   action: 'retry' | 'fail' | 'defer',
//   maxAttempts?: 3,
//   backoffDelays?: [10000, 30000, 60000],
//   recommendation: '사용자 메시지',
//   debugInfo: { code: '...', message: '...' }
// }
```

---

## n8n Workflow Integration

### Error Handler Node

n8n 워크플로우에 다음 패턴을 적용합니다:

```
[HTTP Request: Fetch URL]
    ↓
[Try/Catch 또는 If 노드]
    ├─ Success → [Parse HTML]
    └─ Error → [Extract Error Details]
         ├─ Code: ECONNREFUSED? → Status = 'failed_network'
         ├─ Message: timeout? → Status = 'failed_timeout'
         ├─ Message: Invalid URL? → Status = 'failed_invalid_url'
         └─ [Store to Supabase]
```

### Example: Retry Logic in n8n

```json
{
  "nodes": [
    {
      "name": "HTTP Request with Retry",
      "type": "n8n-nodes-base.httpRequest",
      "properties": {
        "url": "{{ $json.url }}",
        "method": "GET",
        "timeout": 300000,
        "retryAttempts": 3,
        "retryDelayMultiplier": 1,
        "retryDelayBase": "10000ms"
      }
    },
    {
      "name": "Error Handler",
      "type": "n8n-nodes-base.if",
      "expression": "{{ $json.status === 'ok' }}"
    }
  ]
}
```

---

## Monitoring & Logging

### What to Log

모든 크롤 에러에 다음을 로깅합니다:

```json
{
  "timestamp": "2026-03-11T23:38:00Z",
  "company_id": 123,
  "url": "https://example.com",
  "error_code": "ENOTFOUND",
  "error_message": "getaddrinfo ENOTFOUND example.com",
  "classification": "failed_network",
  "recovery_action": "retry",
  "attempt_number": 2,
  "delay_ms": 30000,
  "execution_time_ms": 5234
}
```

### Dashboard Indicators

사용자 대시보드에 다음을 표시합니다:

```
✅ Success (녹색)
   "2026-03-11에 성공적으로 진단했습니다"

⏳ Pending (회색)
   "현재 진단 중입니다..."

⚠️ Warning - Network Error (주황색)
   "네트워크 오류로 재시도 중입니다. (2/3 시도)"

❌ Failed - Timeout (빨강색)
   "웹사이트 응답이 너무 느려 진단을 완료할 수 없습니다."

❌ Failed - Invalid URL (빨강색)
   "올바른 URL을 입력해주세요."

⏸️ Deferred - API Quota (회색)
   "Google API 할당량을 초과했습니다. 내일 다시 시도하겠습니다."
```

---

## Troubleshooting Guide

### 문제: "ENOTFOUND example.com"

**원인**: 도메인이 존재하지 않거나 DNS가 해석할 수 없음

**해결책**:
1. 도메인 이름 확인 (오타 없는지)
2. WHOIS 조회로 도메인 등록 확인
3. 도메인 IP: `nslookup example.com` 실행
4. URL에 `https://` 접두어 확인

---

### 문제: "Timeout after 300000ms"

**원인**: 웹사이트가 300초 이내에 응답하지 않음

**해결책**:
1. 웹사이트 성능 확인 (PageSpeed Insights)
2. 호스팅 업체에 성능 이슈 문의
3. JavaScript 렌더링 지연 확인 (SPA인 경우)

**참고**: n8n은 최대 300초 대기합니다. 시간 제한이 느슨할 수 없습니다.

---

### 문제: "API quota exceeded"

**원인**: Google PageSpeed API 할당량 초과

**해결책**:
1. API 콘솔에서 남은 할당량 확인
2. 새로운 API 키 발급 (프로덕션 환경)
3. 배치 처리 스케줄링 (과부하 분산)
4. 유료 플랜으로 업그레이드

---

### 문제: "Connection refused"

**원인**: 포트가 열려있지 않거나 방화벽이 차단

**해결책**:
1. URL의 포트 번호 확인 (기본: 80/443)
2. 웹사이트가 온라인 상태인지 확인
3. 웹사이트 방화벽 설정 확인
4. Findably 서버 IP를 화이트리스트에 추가 요청

---

## FAQ

**Q: 왜 재시도는 3회로 제한하나요?**
A: 3회 재시도(총 4회 시도)는 일시적 오류 대부분을 포착하면서도 무한 루프를 방지합니다. 10초, 30초, 60초 지연은 네트워크가 복구될 시간을 제공합니다.

**Q: 에러 메시지가 사용자에게 노출되나요?**
A: 아니요. 시스템 에러 코드(ECONNREFUSED 등)는 로그에만 남고, 사용자에게는 친화적인 메시지를 보여줍니다.

**Q: 5분 이상 걸리는 크롤링은 어떻게 되나요?**
A: 타임아웃(300초)에 도달하면 실패로 표시되고 사용자에게 알립니다. 이 제한은 변경 불가입니다.

**Q: 같은 URL을 다시 크롤링할 수 있나요?**
A: 네. 사용자가 대시보드에서 "재진단" 버튼을 클릭하면 새로운 크롤링을 시작합니다.

---

## Related Documentation

- `docs/n8n-workflow.md` — n8n 워크플로우 전체 아키텍처
- `src/lib/crawl/retry.ts` — 지수 백오프 구현
- `src/lib/crawl/error-handler.ts` — 에러 분류 및 복구 전략
- `src/db/schema.ts` — crawl_results 테이블 정의
