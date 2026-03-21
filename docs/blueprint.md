# SSL Labs 호출을 n8n → Next.js 서버사이드로 이전

## 목표

n8n의 B3 SSL Labs 노드가 Elest.io 서버 ↔ SSL Labs API 간 네트워크 문제로 502 Proxy Error를 지속 발생시키므로, SSL Labs API 호출을 n8n에서 제거하고 Next.js 서버에서 직접 수행한다.

완료 조건:

- n8n이 `ssl_labs` 없이 콜백해도 Next.js에서 SSL Labs 데이터를 보충
- 기존 `fetchSslLabs()` 함수 재사용 (새 코드 최소화)
- `CrawlData.layer3.ssl` 에 정상적으로 SSL 데이터 포함
- n8n workflow에서 B3 노드 비활성화/제거
- tsc → eslint → build 통과

---

## 현재 상태

### n8n 쪽 (문제)

- B3 노드: `ssl_labs` 키로 SSL Labs API 호출 → 502 Proxy Error 5회 연속
- 실패 시 `failedSources: ["ssl_labs"]`, `crawlResult.ssl_labs` = 에러 객체

### Next.js 쪽 (이미 준비됨)

- `src/features/crawling/fetchers/ssl-labs.ts` — `fetchSslLabs(url)` 함수 존재
  - 15초 타임아웃, `fromCache=on`, null-on-failure 패턴
  - SSL Labs API v3 직접 호출 + 파싱 완비
- `src/app/api/crawl/complete/route.ts` — n8n 콜백 핸들러
  - `parseCrawlV2Result()` → `saveCrawlResult()` → `runDiagnosis()` 파이프라인
- `src/features/crawling/services/parse-crawl-v2.ts` — `parseSslLabs()` 내장

---

## 기술 접근법

### 수정 파일: 1개

**`src/app/api/crawl/complete/route.ts`** — 콜백 핸들러에 SSL Labs 보충 로직 추가

```
변경 전 (현재):
  parseCrawlV2Result(payload) → crawlData (ssl_labs가 n8n에서 실패하면 layer3.ssl = null)

변경 후:
  parseCrawlV2Result(payload) → crawlData
  → if crawlData.layer3?.ssl === null:
      ssl = await fetchSslLabs(payload.url)  // Next.js에서 직접 호출
      crawlData를 ssl 결과로 보강
```

### 구체적 변경

1. `fetchSslLabs` import 추가
2. `parseCrawlV2Result()` 호출 후, `crawlData.layer3?.ssl`이 null이면:
   - `await fetchSslLabs(payload.url)` 호출 (15초 타임아웃 내장)
   - 결과가 있으면 `crawlData`의 `layer3.ssl`에 주입
   - 불변성 유지: 새 객체 생성 (`{ ...crawlData, layer3: { ...layer3, ssl } }`)
3. n8n이 ssl_labs를 아예 안 보내는 경우도 동일하게 처리

### n8n workflow 수정

- B3 SSL Labs 노드 **비활성화** (삭제보다 안전 — 롤백 가능)
- Normalize Results 노드에서 `ssl_labs` 소스를 제외하도록 수정
- `dataCompleteness` 계산에서 ssl_labs 제외 (전체 소스 수 10→9)

---

## 리스크

| 리스크                                      | 심각도 | 대응                                                                                              |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| fetchSslLabs 15초 타임아웃 → 콜백 응답 지연 | 🟡     | SSL Labs는 `fromCache=on`이므로 캐시 히트 시 <1초. 미스 시 null 반환 (폴링 안 함). 최악 15초 추가 |
| SSL Labs API 자체 장애 시 null              | 🟢     | 기존과 동일한 null-on-failure 패턴. layer3.ssl = null로 진단 진행                                 |
| n8n workflow 수정 실수                      | 🟡     | B3 노드 비활성화(삭제 아님)로 롤백 용이                                                           |
| crawlData 불변성 위반                       | 🟢     | 새 객체 스프레드로 보장                                                                           |

---

## 스코프 가드

- ❌ Observatory 등 다른 n8n 노드 변경 안 함
- ❌ parseCrawlV2Result() 함수 수정 안 함 (호출 후 보강만)
- ❌ fetchSslLabs() 함수 수정 안 함 (있는 그대로 사용)
- ❌ 타입 변경 안 함

---

## 구현 순서

| 단계 | 작업                                  | 파일            |
| ---- | ------------------------------------- | --------------- |
| 1    | 콜백 핸들러에 SSL Labs 보충 로직 추가 | `route.ts`      |
| 2    | tsc → eslint → build 검증             | —               |
| 3    | n8n workflow B3 노드 비활성화         | n8n UI에서 수동 |
| 4    | 실제 크롤링으로 통합 테스트           | 프로덕션 환경   |

---

## 검증 방법

```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 린트
npx eslint src/app/api/crawl/complete/route.ts

# 3. 빌드
pnpm build

# 4. 통합 테스트 (n8n에서 B3 비활성화 후)
# n8n 워크플로우 실행 → ssl_labs 없는 콜백 → Next.js가 SSL Labs 직접 호출 → layer3.ssl 데이터 확인
```
