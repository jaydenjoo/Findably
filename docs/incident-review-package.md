# Findably 인시던트 검토 패키지 — 2026-03 ~ 04

> **외부 시니어 개발자 검토 요청 자료**
> 작성일: 2026-04-07
> 대상 기간: 2026-03-10 ~ 2026-04-06 (약 4주)
> 작성자: Jayden (Findably 운영자, 비개발자) + Claude Code

---

## 1. 검토 요청 목적

Findably(SEO+GEO 진단 SaaS, Next.js 15 + Vercel + Supabase)는 **출시 전 단계**에서 약 4주간 **fix 커밋 50+건과 학습 기록 44건**이 누적됐습니다. 이 중 절반 이상이 **동일 카테고리(Vercel Lambda 수명 + 외부 콜백)에서 반복 발생**했습니다.

다른 시니어 개발자에게 다음을 검토 요청합니다:

1. **아키텍처 자체의 구조적 문제 여부** — 특히 Vercel Functions + n8n + Anthropic API + Supabase 조합의 고질적 페인포인트
2. **단기 대응 vs 근본 재설계 결정** — 현상 유지 vs Trigger.dev/Vercel Workflow 마이그레이션
3. **반복 패턴에서 우리가 놓친 더 큰 문제**가 있는지

본 문서는 (1) 프로젝트 컨텍스트, (2) 인시던트 통계, (3) 카테고리별 분석, (4) 미해결 리스크, (5) 검토 요청 6가지로 구성됩니다.

---

## 2. 프로젝트 컨텍스트 (외부 개발자용)

| 항목              | 내용                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------- |
| **제품**          | URL 입력 → 4-Layer 크롤링 → 5-Agent AI 분석 → 종합 마케팅 진단 리포트 (SEO + GEO 통합) |
| **운영자**        | 비개발자 1인 (Jayden) — 모든 코드는 Claude Code로 작성, 운영자는 결정/검증 담당        |
| **현재 상태**     | 출시 전 (월 유료 진단 10건 미만 + 무료 100건 미만 가정)                                |
| **건당 가격**     | 9.9만원 KRW (~$70 USD), 마진 99%+ 목표                                                 |
| **Frontend**      | Next.js 15 (App Router, RSC) + Tailwind v4 + shadcn/ui + Pretendard/DM Sans            |
| **Backend**       | Vercel Functions (Pro 플랜, maxDuration 최대 300초) + Server Actions                   |
| **DB**            | Supabase PostgreSQL + RLS (chatsio-v1 프로젝트 공유)                                   |
| **Auth**          | Supabase Auth (이메일 + Google OAuth)                                                  |
| **AI**            | Anthropic Claude API — Sonnet 4 (5 에이전트) + Opus 4 (CMO 검증)                       |
| **크롤링**        | n8n on Elest.io (별도 인스턴스) + Playwright                                           |
| **결제**          | Mock + 선물 코드 시스템 (Toss Payments 미연동)                                         |
| **도메인**        | findably.kr (커스텀, 2026-04-05 전환)                                                  |
| **에러 모니터링** | Sentry                                                                                 |

### 2.1 핵심 아키텍처 — 두 가지 워크로드

```
[WL1: 크롤링 파이프라인]
사용자 URL 제출
   ↓
/api/onboarding/submit-url (Vercel Server Action)
   ↓
n8n Webhook 트리거 (Elest.io HTTP POST)
   ↓
n8n Workflow (Playwright + 외부 API 10건 fan-out)
  ├─ Playwright HTML 크롤링
  ├─ PageSpeed Insights API
  ├─ CrUX API
  ├─ Safe Browsing API
  ├─ SSL Labs API
  ├─ Mozilla Observatory v2 API
  ├─ robots.txt / sitemap.xml / llms.txt 파서
  ├─ CMS 감지 (Wappalyzer)
  └─ 모바일 크롤링
   ↓
POST /api/crawl/complete (Vercel API Route, Bearer 인증)
   ↓
runDiagnosisFree() — 룰 기반 점수 → Supabase update
   ↓
if (tier === 'paid') → trigger-analysis 호출

[WL2: 유료 분석 파이프라인]
/api/payment/trigger-analysis (Vercel API Route, maxDuration=300)
   ↓
runDiagnosisPaid()
   ├─ 5 AI 에이전트 병렬 실행 (Anthropic Sonnet 4)
   │   ├─ technical (~30-60s)
   │   ├─ seo       (~30-60s)
   │   ├─ geo       (~30-60s)
   │   ├─ content   (~30-60s)
   │   └─ competitors (~30-60s)
   │   → Promise.allSettled, SDK timeout 90s, maxRetries=0
   └─ CMO 검증 (Anthropic Opus 4, ~30s, Promise.race timeout)
   ↓
aggregateResults() + score-aggregator (5 매크로 가중 평균)
   ↓
Supabase update (status='completed')
```

### 2.2 두 워크로드의 본질적 차이

| 항목              | WL1 (크롤링)               | WL2 (유료 분석)                |
| ----------------- | -------------------------- | ------------------------------ |
| 실행 위치         | n8n (외부 시스템)          | Vercel Lambda (in-process)     |
| 통신 패턴         | **외부 webhook 콜백**      | in-process 함수 호출           |
| 총 소요 시간      | ~30-60초                   | ~120초 (5 에이전트 병렬 + CMO) |
| Playwright 의존   | ✅ (~200MB Chromium)       | ❌                             |
| 호출 빈도         | 월 ~110건 (무료+유료 모두) | 월 ~10건 (유료만)              |
| **fix 커밋 비율** | **12건+**                  | **6건+**                       |

---

## 3. 인시던트 통계 (2026-03-10 ~ 2026-04-06, 약 4주)

| 지표                                 | 수치                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| 학습 사례 (`docs/learnings.md` 기록) | **44건**                                                          |
| 전체 fix 커밋                        | **50+건**                                                         |
| n8n / 외부 콜백 관련 fix             | 17건 (전체 fix의 ~34%)                                            |
| Vercel Lambda 수명 관련 fix          | 8건                                                               |
| AI / Claude API 관련 fix             | 6건                                                               |
| 데이터 일관성 / 멱등성 fix           | 5건                                                               |
| 테스트 / E2E fix                     | 8건                                                               |
| **2026-04-06 하루 fix** (최다)       | **6건**                                                           |
| 같은 패턴 2회 이상 재발              | 4건 (Claude maxTokens, n8n 콜백 URL, 멱등성 가드, race condition) |

### 시간 분포 (주요 인시던트만)

```
3월 19일 ┃ ████ Vercel fire-and-forget + n8n trailing slash (4건)
3월 20일 ┃ ███  n8n workflow JSON 시크릿 + dev endpoint 노출 (3건)
3월 23일 ┃ ██   Claude 모델 ID + push 누락 (2건)
3월 24일 ┃ █    Claude maxTokens 1차 (1건)
4월 01일 ┃ █████ Mozilla Observatory v2 + Google API + n8n localhost + 빌드 함정 + 대시보드 쿼리 (5건)
4월 03일 ┃ ██   Vercel Hobby after() Lambda timeout + 카피 불일치 (2건)
4월 05일 ┃ █    Supabase OAuth 커스텀 도메인 (1건)
4월 06일 ┃ ████████ 6건 fix + 6건 AI 이탈 + race condition + 멱등성 + maxDuration 누적
```

→ 시간이 갈수록 **사건 빈도가 증가**, 4월 6일 하루에만 6건의 fix가 몰림. 깨짐 패턴이 안정화되지 않고 새로운 패턴이 계속 드러나는 추세.

---

## 4. 카테고리별 분석

### 카테고리 1: Vercel 서버리스 환경 + Lambda 수명 (8건)

**핵심 패턴**: Vercel Functions의 Lambda 수명, `maxDuration`, `after()` 사용 시 한계가 누적적으로 드러남.

**주요 사례**:

1. **2026-03-19 — Fire-and-forget 패턴 실패**
   - 증상: `void triggerCrawl(...)` 후 `redirect()` → n8n 웹훅 미전송
   - 원인: Vercel은 응답 후 Lambda freeze. `void promise`는 await 없이 종료
   - 해결: `void` → `await` 패턴 또는 Next.js 15 `after()` API 사용

2. **2026-04-03 — Vercel Hobby `after()` Lambda 타임아웃 → 분석 영구 고착**
   - 증상: 유료 분석 status가 30분+ `analyzing`에서 멈춤. Anthropic 로그 `code 499 client disconnected`
   - 원인: `maxDuration` 미설정 → 기본 10초 → `after()` 콜백 도중 강제 종료. catch 블록도 안 돌아 status 영구 고착
   - 해결: `maxDuration=60` (Hobby 한계) → 후일 `maxDuration=300` (Pro)

3. **2026-04-06 — `maxDuration` 단순 상향만으로 시간 누적 문제 해결 불가**
   - 증상: `maxDuration=120` → 504. `maxDuration=300` → 405초+ 미완료
   - 원인: 한도 자체가 아닌 retry 시간 누적 폭발
   - 해결: 5개 fix 일괄 적용 (SDK timeout 명시 + retry 병렬화 + Opus fallback 제거)

**누적된 대증요법** (3회 이상 같은 항목 변경):

- `maxDuration`: 60 → 120 → 300 (3회 상향)
- `after()` 도입 → `after()` 제거 → 동기 실행으로 변경
- Opus 2차 fallback 추가 → 제거

**의심**: 이 카테고리의 fix는 **근본 원인이 아닌 증상 추적**일 가능성이 높음. 진짜 답은 Lambda 수명에 의존하지 않는 외부 워커 또는 durable execution.

---

### 카테고리 2: n8n 외부 콜백 패턴 (9건 사례, 17건 fix)

**핵심 패턴**: n8n(Elest.io) → Vercel(Next.js)로 HTTP 콜백을 보내는 경로에서 깨짐 발생. **n8n 노드 자체 실패는 0건**.

**주요 사례**:

1. **2026-03-19 — Trailing slash 308 → POST→GET 변환 → 405**
   - n8n axios가 308 redirect 추적 시 메서드를 GET으로 변환 (HTTP 스펙 위반이지만 흔한 클라이언트 동작)
   - 해결: `POST` + `GET` 두 핸들러 모두 export

2. **2026-03-20 — Workflow JSON 시크릿 하드코딩 → Git 노출**
   - n8n export JSON에 Firecrawl API 키 + Bearer 토큰 평문
   - 해결: 플레이스홀더 + `.gitignore`

3. **2026-04-01 — Localhost 접근 불가 → 로컬 단독 테스트 불가**
   - n8n(Elest.io)이 외부 서버 → `localhost:3600`에 콜백 못 보냄
   - 결론: 외부 콜백 의존 = 로컬 통합 테스트 구조적 불가

4. **2026-04-06 — 커스텀 도메인 전환 후 콜백 URL stale → 파이프라인 전면 중단**
   - `findably.vercel.app` → `findably.kr` 전환 후 n8n workflow의 콜백 URL 미동기화
   - Vercel이 308 redirect 반환 → axios POST→GET 변환 → body 손실 → 콜백 자체가 Vercel 로그에 안 남음
   - 발견까지 4시간 추적 + Elest.io n8n workflow 재활성화 사이클 필요

5. **2026-04-06 — handleCallback 멱등성 부재 → DB write 폭주 + score 변동**
   - 동일 진단 7c0a7f6d가 `completed` 상태인데도 33-80초 간격으로 6번+ 재실행
   - 매번 PageSpeed/SSL/Observatory 결과 변동으로 score가 50→53→... 다른 값
   - 해결: 페이로드 검증 직후 status 확인 → terminal state면 early return

**현재 적용된 방어 (사후)**:

- `findably.kr` 영구 고정
- workflow JSON 플레이스홀더 + `.gitignore`
- POST + GET 핸들러 모두 export
- handleCallback 멱등성 가드
- `maxDuration=60` (crawl/complete 라우트)

**미해결 리스크**: 패턴 자체가 약함. 새 도메인 변경, 환경 변경, n8n 업데이트 시 새로운 깨짐 패턴이 또 드러날 가능성. 17건은 **사후 fix**이며, 다음 깨짐을 막을 보장은 없음.

---

### 카테고리 3: AI / Claude API 호출 (6건)

**주요 사례**:

1. **2026-03-23 — Claude API 모델 ID 네이밍**
   - `claude-sonnet-4-6-20250514` (마케팅명) → 404
   - 정답: `claude-sonnet-4-20250514` (마이너 버전 제외)
   - 영향: 5개 에이전트 모두 404 → 10건 빈 리포트 생성

2. **2026-03-24 — `maxTokens` 부족 → JSON 절삭 → 빈 리포트 (2회 재발)**
   - 1차 fix: content/competitors만 2048→4096
   - 2차 재발: technical/seo/geo는 2048 그대로 방치
   - 디버깅 단서: `output_tokens === maxTokens`면 한도에 걸린 것
   - 규칙: 모든 에이전트 동일 기준 적용

3. **2026-04-06 — 5-Agent retry 직렬 + Opus fallback → 시간 폭발**
   - SDK 기본 `maxRetries=2` + 우리 retry 로직 중복 → SDK retries=0으로 차단
   - retry for-loop 직렬 → `Promise.allSettled` 병렬
   - Opus 2차 fallback 60초+ → 제거

**현재 패턴**:

- 모든 에이전트 `maxTokens=4096` 통일
- SDK `timeout: 90_000ms, maxRetries: 0` 명시
- retry는 우리 로직에서만, 병렬화
- Opus 2차 fallback 제거

---

### 카테고리 4: 단일 진실 소스(Single Source of Truth) 부재 (3건)

**주요 사례**:

1. **2026-04-06 — 종합 점수 불일치: PDF 1페이지 62점 vs 2페이지 72점**
   - 원인: 2개의 점수 계산 경로 (`engine.ts evaluate()` + `score-aggregator.ts aggregateScores()`)
   - 두 값이 DB 컬럼(`diagnoses.total_score`) + JSON 필드(`analysis_data.overallScore.score`)에 동시 저장
   - 추가로 CMO가 `executive_summary` 자유 텍스트로 또 다른 점수 환각
   - 해결: `analysis_data.overallScore.score` canonical 확정 + CMO 프롬프트 가드 ("재계산 금지, 입력값 그대로 인용")

2. **2026-04-06 — `transitionStatus` 멱등성 noop → `updated_at` 갱신 안 됨**
   - 동일 status 호출 시 DB write skip → 디버깅 마커로 활용 불가
   - 해결: 시작 시점 `supabase.update` 직접 호출 (transitionStatus 우회)

**규칙**: 중요 표시값은 1곳에만 저장. AI 자유 생성 필드에 숫자 환각 가드 필수.

---

### 카테고리 5: 외부 API 가격 / 한계 / 서비스 변경 (3건)

1. **2026-04-01 — Mozilla Observatory v1 서비스 종료 → 502 상시 발생**
   - v1 → v2 마이그레이션 (`observatory-api.mdn.mozilla.net/api/v2/scan`)
   - 단서: 모든 도메인에서 502 → 단일 사이트 문제가 아닌 API 자체 종료

2. **2026-04-01 — Google API 키 권한 분리**
   - "API 활성화" ≠ "API 키 권한". 별도 설정
   - 해결: "키를 제한하지 않음" 또는 명시적 API 추가

3. **2026-04-06 — Inngest 가격 검증 누락**
   - 학습값 $25/mo → 실제 $75/mo (3배 차이)
   - 무료 티어 "함수당 5 concurrent step" 제약을 첫 조사에서 누락
   - 규칙: 외부 도구 추천 시 공식 페이지 fetch 필수, 학습값 인용 금지

---

### 카테고리 6: Auth / OAuth / Redirect (1건)

1. **2026-04-05 — Supabase OAuth 커스텀 도메인 Redirect URL 미등록**
   - Supabase에 `findably.vercel.app/auth/callback`만 등록 → `findably.kr/auth/callback` 폴백 실패
   - `/?code=...`가 루트에 도착 → `exchangeCodeForSession()` 미실행 → 세션 미생성
   - 해결: Supabase Dashboard에 모든 도메인 등록

---

### 카테고리 7: DB 쿼리 패턴 / 멱등성 (4건)

1. **2026-04-01 — 대시보드 쿼리가 최신 1개만 조회 → failed가 결과 차단**
   - `ORDER BY created_at DESC LIMIT 1` → 최신이 failed면 이전 completed 결과 못 봄
   - 해결: 상태 우선순위 쿼리 (진행중 > completed > failed)

2. **2026-04-06 — PaidAnalyzingState race condition**
   - 무료 진단인데 `PaidAnalyzingState`가 무조건 `trigger-analysis` 호출 → `crawl_data=null` → catch에서 `status='failed'` 마킹 → 정상 무료 진단을 망가뜨림
   - 해결: 프론트 가드 + 백엔드 tier 가드 (이중 방어)

3. **2026-04-06 — handleCallback 멱등성 부재** (앞 카테고리 2 참조)

**규칙**: 외부 콜백 라우트는 멱등성 가드 필수. Tier 가드 같은 사전 조건 검증은 프론트+백엔드 이중.

---

### 카테고리 8: 테스트 / E2E (8건)

1. **2026-03-13 — Vitest fake timers + waitFor 교착**
   - `waitFor()`는 `setTimeout` 폴링 → fake timers가 멈춤 → 무한 대기
   - 해결: `vi.advanceTimersByTimeAsync()` 직접 제어

2. **2026-03-13 — Unstable useRouter mock → useEffect 무한 재실행**
   - 매 render마다 새 객체 반환 → deps 변경 → cleanup+재실행
   - 해결: 모듈 스코프 안정 참조

3. **2026-03-13 — base-ui(shadcn/ui) jsdom 호환 문제**
   - shadcn/ui 컴포넌트가 브라우저 전용 API 사용
   - 해결: 단순 HTML 엘리먼트로 mock

4. **2026-03-16 — Tailwind v4 `@theme inline` hsl() 빈 문자열**
   - `hsl(222 47% 5%)` → 빈 문자열로 resolve
   - 해결: hex만 사용

5. **2026-03-20 — Playwright `force: true` Server Action form 미작동**
   - `force: true`는 actionability check만 우회. DOM 이벤트 전파 방식이 달라 form submit 트리거 안 됨
   - 해결: `page.evaluate(() => form.requestSubmit())`

6. **2026-03-20 — Playwright `toHaveURL` 정규식 함정**
   - `^\/login` 패턴이 전체 URL(`http://...`)에 매칭 시도 → 실패
   - 해결: `^` 앵커 제거

7. **2026-03-20 — In-memory rate limit 테스트 quota 공유**
   - 같은 유저 ID로 동일 API 호출하는 모든 테스트가 quota 공유
   - 해결: 단일 test 안에서 순차 호출

8. **2026-03-21 — Zod `z.string().uuid()` RFC 4122 variant bits**
   - `'11111111-1111-1111-1111-111111111111'` → 4번째 그룹 첫 문자가 `[89abAB]` 아님 → 거부
   - 해결: `'11111111-1111-1111-a111-111111111111'`

---

### 카테고리 9: 빌드 / 배포 함정 (3건)

1. **2026-03-23 — 로컬 커밋만으로 push 누락 → 프로덕션 미반영**
   - `git status -sb`에서 `[ahead 1]` 확인 안 함
   - 규칙: 배포 전 `git status -sb` + `git push` + Vercel 대시보드 3단계 확인

2. **2026-04-01 — 로컬 tsc 통과 ≠ Vercel 빌드 통과**
   - 로컬 `tsc`는 미커밋 파일 포함, Vercel은 Git HEAD만
   - 해결: `git stash && npx next build`로 Git 코드만 빌드 검증

3. **2026-04-06 — `as const` readonly array `.includes()` 좁은 리터럴 타입 에러**
   - `ACCESS.ADMIN_EMAILS.includes(user.email)` → TS2345
   - 해결: `(ACCESS.ADMIN_EMAILS as readonly string[]).includes(...)`

---

### 카테고리 10: AI 작업 프로세스 / 방향 이탈 (5건)

이 카테고리는 **Claude Code(AI 에이전트)가 비개발자 운영자 대신 코드를 작성할 때의 검증 습관 부재**가 반복적으로 사고를 일으킨 패턴.

1. **2026-04-06 — 프로덕션 이슈 발생 시 증거 수집 전 파괴적 DB 작업 금지**
   - Claude가 `pg_stat_statements` 확인 없이 "테이블이 없다"고 오진 → 마이그레이션 10+개 실행 → "drop and recreate all tables" 시도
   - 실제 원인은 코드 버그였음
   - 규칙: READ ONLY → 가설 → 승인 → 실행 순서

2. **2026-04-06 — 외부 서비스 가격/제한 변경 검증 습관**
   - Inngest $25 학습값 인용 → 실제 $75
   - 규칙: 가격/한계/신제품 — 매번 공식 페이지 fetch

3. **2026-04-06 — 값 변경 시 전체 참조처 스캔 → 제시 → 승인 → 일괄 변경**
   - n8n 콜백 URL 변경 시 일부 파일만 수정 → 다른 곳에 stale 남음
   - 규칙: 첫 액션은 항상 `Grep` → 전체 참조처 보고 → 승인 → 일괄

4. **2026-04-06 — 계획 수립 전 지시문 정독 누락 → 얕은 제안**
   - 지시문 파일이 명시되어 있는데 Read 생략하고 메모리 요약만으로 계획 → 세부 요구사항 누락
   - 규칙: 파일 경로가 메시지에 등장하면 첫 tool call은 그 파일 Read

5. **2026-04-06 — 단일 fix 검증 후 추가 fix 결정 패턴**
   - 가설 트리 작성 → 가장 영향 작은 fix 1개 우선 → 검증 → 결과 보고 → 추가 fix 결정
   - 한 번에 5개 일괄 적용하면 어느 것이 효과 있었는지 분리 측정 불가

---

## 5. 미해결 리스크 (현재 진행중)

| #   | 리스크                    | 영향                          | 현재 대응                     | 근본 해결                                        |
| --- | ------------------------- | ----------------------------- | ----------------------------- | ------------------------------------------------ |
| R1  | n8n 콜백 패턴 구조적 약함 | 새 환경 변경 시 재발          | 방어 코드 17건 (사후)         | Trigger.dev 마이그레이션 검토 중                 |
| R2  | Vercel Lambda 수명 한계   | 5-Agent 시간 누적 폭발        | maxDuration=300 + SDK timeout | Vercel Workflow durable execution 또는 외부 워커 |
| R3  | AI 응답 검증 일관성       | 새 에이전트 추가 시 기준 누락 | maxTokens 4096 통일           | structured output (tool use) 검토                |
| R4  | 단일 진실 소스 일관성     | 새 표시값 추가 시 또 불일치   | overallScore canonical 확정   | 데이터 모델 차원 강제 패턴                       |
| R5  | n8n Elest.io 운영 부담    | 비개발자 운영 한계            | 수동 워크플로우 관리          | n8n 의존성 제거                                  |
| R6  | E2E 테스트 커버리지       | 새 race condition 미감지      | 19개 핵심 Flow 커버           | rate limit + 멱등성 시나리오 추가                |

---

## 6. 검토 요청 6가지

다음 6가지에 대한 시니어 개발자의 의견을 요청합니다.

### Q1. n8n 외부 콜백 패턴 — Trigger.dev 마이그레이션이 정답인가?

**배경**: 17건의 fix 중 12건+이 n8n→Vercel 콜백 경로 문제. 어제(2026-04-06) 실시한 v2 비교에서 Trigger.dev v3가 유일하게 GA + Playwright Docker 지원 + 무료 크레딧 안에서 처리 가능($0/mo)으로 평가됨.

**질문**:

- 출시 전 단계에서 1~2주의 마이그레이션 작업 투자가 정당한가?
- 또는 n8n 콜백 패턴을 유지하면서 다른 방어 패턴(예: webhook signature, idempotency key, 자체 retry queue)이 가능한가?
- Trigger.dev v3 + Playwright(1.40.0 고정 워크어라운드) production 운영 사례를 알고 있는가?
- 출시 전이 아니라면 마이그레이션 시점은 언제가 적정한가?

### Q2. Vercel Hobby/Pro Lambda 한계 — 아키텍처 자체 문제 아닌가?

**배경**: `maxDuration`이 60→120→300초로 3회 상향됐고, 그래도 시간 누적 문제가 발생. 8건의 Lambda 수명 관련 fix가 누적됨. 5-Agent 병렬 + retry + CMO의 누적 시간이 300초를 잠재적으로 초과 가능.

**질문**:

- Vercel Pro 300초 한도가 5-Agent 병렬(120초) + retry 시간 + CMO(30초) 워크로드에 적합한가?
- Vercel Workflow durable execution(2025-10 출시, Beta)을 production에 도입할 만한 안정성인가? GA 전 production 사용 사례는?
- 또는 5-Agent를 5개 별도 서버리스 호출로 분리하는 패턴이 답인가? (Lambda 분리, fan-out + aggregate)
- Cloud Run / AWS Lambda 등 다른 서버리스 옵션 검토 가치는?

### Q3. 5-Agent 병렬 fan-out 안정화 패턴

**현재 코드**:

```typescript
const results = await Promise.allSettled([
  runAgentWithRetry(runTechnicalAgent, payload, { timeout: 90_000 }),
  runAgentWithRetry(runSeoAgent, payload, { timeout: 90_000 }),
  runAgentWithRetry(runGeoAgent, payload, { timeout: 90_000 }),
  runAgentWithRetry(runContentAgent, payload, { timeout: 90_000 }),
  runAgentWithRetry(runCompetitorsAgent, payload, { timeout: 90_000 }),
])
// SDK 측 maxRetries: 0 (자체 retry와 중복 차단)
```

**질문**:

- 5개 중 일부 실패 시 partial result로 진단 진행하는 게 옳은가? 또는 전체 실패 처리가 안전한가? (현재는 partial 진행)
- retry는 우리 로직에서만 vs SDK 자체 retry — 어느 게 production-grade인가?
- Anthropic API rate limit (Tier별 RPM/TPM) 측면에서 5 병렬이 적정한가? Tier 1에서 동시 5건이 안전한가?
- CMO 검증 단계 timeout 30초가 적정한가? Opus가 30초 안에 못 끝내는 빈도는?

### Q4. AI 응답 검증 패턴 (maxTokens / schema / fallback)

**현재 패턴**:

- 모든 에이전트 `maxTokens=4096` 통일
- Zod schema validation
- `JSON.parse` 실패 시 fallback (빈 결과 + status='empty')
- output_tokens === maxTokens면 절삭 의심

**질문**:

- maxTokens 절삭 감지 시 자동 재시도(maxTokens 확장)가 더 안전하지 않은가? 현재는 fallback이라 빈 리포트 발생
- Anthropic의 **structured output (tool use)** 사용이 schema validation보다 안전한가? 마이그레이션 권장 여부
- 5-Agent 모두 동일 schema 강제하는 vs 에이전트별 다른 schema가 적정한가?
- AI 응답에 숫자 환각이 들어갈 수 있는 자유 텍스트 필드(executive_summary 등)에 대한 검증 패턴은?

### Q5. 멱등성 가드 패턴

**현재 패턴** (`/api/crawl/complete`):

```typescript
// 페이로드 검증 직후, DB write 전
const { data: existing } = await supabase
  .from('diagnoses')
  .select('status')
  .eq('id', diagnosisId)
  .single()

if (existing?.status === 'completed' || existing?.status === 'failed') {
  return successResponse({ status: 'already_processed' })
}
// ... 이후 saveCrawlResult, runDiagnosis 등
```

**질문**:

- 이 가드가 race condition (동시 콜백 2건이 거의 같은 시각에 도착)에서도 안전한가?
- DB row lock (`SELECT ... FOR UPDATE`) 또는 PostgreSQL advisory lock이 필요한가?
- Stripe webhook 같은 production-grade 외부 콜백 처리 패턴(idempotency key, signature verification, replay protection)을 적용해야 하는가?
- 가드 자체 실패(DB 연결 장애)에는 어떻게 대응? 현재는 가드 실패 시 정상 흐름 진행으로 안전성 우선.

### Q6. Single Source of Truth — 표시값 일관성 강제

**배경**: 종합 점수가 PDF 1페이지(62점)와 2페이지 SWOT(72점)에서 다르게 표시되는 사고 발생. 원인은 두 개의 점수 계산 경로가 서로 다른 위치(DB 컬럼 vs JSON 필드)에 저장되고, 추가로 CMO가 자유 텍스트로 또 다른 점수를 환각.

**현재 해결**:

- `analysis_data.overallScore.score` canonical 확정
- 모든 표시 경로가 이 필드 참조
- CMO 프롬프트에 `<guardrails>` 추가: "재계산 금지, 전달값 그대로 인용"

**질문**:

- AI가 자유롭게 생성하는 long-form 텍스트(executive_summary, swot 등)에 숫자 환각을 막는 더 강력한 패턴이 있는가? (post-processing validator? structured output?)
- 데이터 모델 차원에서 "표시값 = 1곳" 강제하는 방법은? DB 컬럼 vs JSON 필드 — 어느 게 single source로 적합한가?
- `total_score` DB 컬럼을 generated column으로 만들어 JSON 필드에서 자동 derive하는 패턴은?

---

## 7. 부록 A: 학습 사례 풀 리스트 (44건, 시간순)

> 카테고리 태그: [V]ercel / [N]8n / [A]I-Claude / [D]B / [F]rontend / [T]est / [B]uild / [Au]th / [P]rocess / [E]xt-API

| #   | 날짜  | 카테고리 | 한 줄 요약                                                                 |
| --- | ----- | -------- | -------------------------------------------------------------------------- |
| 1   | 03-10 | F        | Tailwind v4 그라데이션 클래스 변경 (`bg-gradient-to-*` → `bg-linear-to-*`) |
| 2   | 03-13 | T        | Vitest fake timers + waitFor 교착                                          |
| 3   | 03-13 | T        | Unstable useRouter mock → useEffect 무한 재실행                            |
| 4   | 03-13 | T        | base-ui(shadcn/ui) jsdom 호환 (단순 HTML mock)                             |
| 5   | 03-16 | F        | Tailwind v4 `@theme inline` hsl() 빈 문자열 (hex 사용)                     |
| 6   | 03-16 | T        | shadcn/ui CardTitle은 `<div>` (Playwright heading 셀렉터 실패)             |
| 7   | 03-16 | T        | Playwright strict mode `.first()` 필수                                     |
| 8   | 03-16 | T        | Playwright 스크롤 검증 — `querySelectorAll` 동적 위치 조회                 |
| 9   | 03-16 | F        | 다크 nav 위 `text-slate-900` 안 보임 (대비 부족)                           |
| 10  | 03-16 | T        | framer-motion `whileInView` Playwright 스크린샷 타이밍                     |
| 11  | 03-19 | V        | Vercel 서버리스 fire-and-forget 패턴 실패                                  |
| 12  | 03-19 | N        | Next.js trailing slash 308 → POST→GET 변환 → 405                           |
| 13  | 03-20 | N        | n8n workflow JSON 시크릿 하드코딩                                          |
| 14  | 03-20 | V        | 디버그 endpoint 프로덕션 가드 누락                                         |
| 15  | 03-20 | T        | Playwright `force: true` Server Action form 미작동                         |
| 16  | 03-20 | T        | Playwright `toHaveURL` 정규식 전체 URL 매칭                                |
| 17  | 03-20 | T        | E2E in-memory rate limit quota 공유                                        |
| 18  | 03-21 | T        | Zod uuid RFC 4122 variant bits 검증                                        |
| 19  | 03-23 | A        | Claude API 모델 ID 네이밍 (점 포함 금지)                                   |
| 20  | 03-23 | B        | 로컬 커밋만으로 프로덕션 수정 완료 선언 — push 누락                        |
| 21  | 03-24 | A        | Claude API maxTokens 부족 → JSON 절삭 (2회 재발)                           |
| 22  | 04-01 | B        | 로컬 tsc 통과 ≠ Vercel 빌드 (Git 미커밋 함정)                              |
| 23  | 04-01 | E        | Mozilla Observatory v1 서비스 종료 → v2 마이그레이션                       |
| 24  | 04-01 | D        | 대시보드 쿼리 최신 1개만 → failed가 영구 차단                              |
| 25  | 04-01 | E        | Google API 키 권한 분리                                                    |
| 26  | 04-01 | N        | n8n 콜백 URL localhost 접근 불가                                           |
| 27  | 04-03 | V        | Vercel Hobby `after()` Lambda timeout → 분석 영구 고착                     |
| 28  | 04-03 | F        | "가입 불필요" 히어로 문구 — 실제 플로우 불일치                             |
| 29  | 04-05 | Au       | Supabase OAuth 커스텀 도메인 Redirect URL 미등록                           |
| 30  | 04-06 | D        | PaidAnalyzingState race condition → status=failed 마킹                     |
| 31  | 04-06 | P        | 프로덕션 이슈 시 증거 수집 전 파괴적 DB 작업 금지                          |
| 32  | 04-06 | P        | 외부 서비스 가격/제한 변경 검증 습관 (Inngest $25→$75)                     |
| 33  | 04-06 | N        | n8n 콜백 URL 커스텀 도메인 stale → 파이프라인 전면 중단                    |
| 34  | 04-06 | P        | 값 변경 시 전체 참조처 스캔 → 승인 → 일괄 변경                             |
| 35  | 04-06 | D        | 중요 표시값 Single Source of Truth 부재 (62 vs 72점)                       |
| 36  | 04-06 | A        | AI 자유 생성 insights rule-id 매핑 함정                                    |
| 37  | 04-06 | D        | 선물 코드 admin 우회 — DB 유니크 제약 회피 패턴                            |
| 38  | 04-06 | B        | `as const` readonly array `.includes()` 타입 에러                          |
| 39  | 04-06 | P        | 계획 수립 전 지시문 정독 누락                                              |
| 40  | 04-06 | N        | 외부 콜백 라우트 멱등성 가드 부재 → DB write 폭주                          |
| 41  | 04-06 | V        | maxDuration 단순 상향만으로 시간 누적 해결 불가                            |
| 42  | 04-06 | D        | transitionStatus 동일 상태 noop → updated_at 갱신 안 됨                    |
| 43  | 04-06 | P        | 단일 fix 검증 후 추가 fix 결정 패턴 (root cause 분리)                      |
| 44  | 04-06 | P        | stuck 화면 디버깅 — 백엔드 → 프론트엔드 격리 진단                          |

---

## 8. 부록 B: 주요 fix 커밋 (시간순 발췌)

```
# n8n / 외부 콜백 (17건)
01e0fd3 fix: vercel 서버리스 fire-and-forget 문제 해결 — n8n 트리거
7d887d3 fix: n8n 콜백 trailing slash 308→GET 변환 대응
f965b4a test: n8n 파이프라인 E2E 테스트 13건 추가 + 안정성 개선
52cc50f fix: 헬스체크 P1+P2 — webhook GET 멱등성 + 크롤링 타임아웃
3a95ac9 fix: 결제가 크롤링 전에 발생해도 crawl_data 폴링 대기
c5eabf3 fix: 무료 진단이 유료 분석 status를 덮어쓰는 race condition
87d7e67 fix: 무료 진단 status 고착 버그 — tier만으로 유료 판단
055006c fix: 프론트엔드 트리거 수정 — credentials 추가 + isPaid 조건 제거
c59d9bc fix: 무료 진단이 trigger-analysis로 failed 마킹되는 race condition
da8c1c4 docs: n8n 콜백 복구 기록 (커스텀 도메인 stale 4시간 추적)
8300d97 fix(crawl): add idempotency guard to handleCallback
... (총 17건)

# Vercel Lambda 수명 (8건)
83588fe fix: vercel lambda maxDuration 60초 설정
1fa4d09 fix: vercel hobby 60초 한도에 맞춰 전체 파이프라인 타임아웃 조정
4fdd204 fix: 유료 분석 Vercel 타임아웃 — after() API + 글로벌 2분 타임아웃
75b39fb fix: 유료 분석 아키텍처 — 프론트엔드 직접 트리거 방식
a154187 fix: vercel pro 업그레이드 반영 — opus 복원 + 타임아웃 여유
88f52b9 fix: trigger-analysis에서 after() 제거 → 동기 실행으로 변경
58079f9 fix(diagnosis-paid): trigger-analysis maxDuration 120 → 300
6bdbea0 fix(diagnosis-paid): phase 3 fix 5개 — 시간 예산 재배분

# AI / Claude API (6건)
137002d fix: 유료 분석 파이프라인 빈 리포트 — Claude API 모델 ID 수정
4f15034 fix: technical/seo/geo 에이전트 maxTokens 2048→4096
43122a4 fix: 유료 분석 에이전트 maxTokens 증가 + 한국 시장 맥락 프롬프트
7ec711e fix: cmoVerificationResponse 타입에 priority_adjustments 추가
d0f2411 fix: 유료 리포트 프롬프트를 컨설팅펌 수준으로 전면 개선
f4548d6 fix(report): phase a — overallScore 단일화 + CMO 점수 언급 가드

# 데이터 일관성 (5건)
20bc987 fix: 데이터 흐름 정밀 점검 — 유료 필드 파싱 통합
ad67f1d fix: 대시보드 쿼리를 completed 우선 조회로 변경
f4548d6 fix(report): overallScore 단일화
06883ec feat(report): phase a — 누수 카드 캡/가중/중복통합

# 빌드 / 배포 (3건)
72d8b0c fix: update committer email
... (Git 미커밋 / push 누락 사고는 commit이 아닌 운영 사고)
```

---

## 9. 참고 자료

| 문서                          | 용도                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `docs/learnings.md`           | 전체 학습 기록 (44건) — 각 사례의 증상/원인/해결/규칙 상세                                                               |
| `docs/n8n-alternatives.md`    | n8n 대체 도구 비교 v1 (2026-04-06) — 운영 안정성 항목 누락된 잘못된 결론                                                 |
| `docs/n8n-alternatives-v2.md` | n8n 대체 도구 비교 v2 (2026-04-07) — 운영 안정성 중심 재평가, Trigger.dev v3 / Vercel Workflow / Vercel Queues 상세 비교 |
| `docs/PRD.md`                 | 제품 요구사항 명세                                                                                                       |
| `docs/module-boundary.md`     | 10개 features/ 모듈 의존성 맵 + 어댑터 패턴                                                                              |
| `docs/design-system.md`       | 디자인 토큰 + 컴포넌트 매핑                                                                                              |
| `CLAUDE.md`                   | 프로젝트 개발 규칙 + 검증 게이트                                                                                         |

---

## 10. 검토자에게 드리는 부탁

본 프로젝트는 **비개발자 1인이 Claude Code를 활용해 빠르게 만든 출시 전 SaaS**입니다. 위의 사고들은 모두 정직하게 기록된 실제 운영 상황이며, **숨기지 않고 외부 검토를 받기 위해 작성**된 자료입니다.

검토 시 다음을 우선 고려해 주시면 감사하겠습니다:

1. **출시 전 리스크의 우선순위** — 어느 것이 출시 차단 사유이고, 어느 것이 출시 후 점진적 개선 대상인지
2. **비개발자 운영 가능성** — 시니어 개발자 기준의 "당연한 패턴"이 비개발자 + AI 협업 환경에서도 운영 가능한지
3. **놓친 더 큰 문제** — 우리가 카테고리화한 10개 외에 더 본질적인 구조적 문제가 있는지 (예: 보안, RLS, 데이터 모델, 비용 폭주 등)

피드백은 GitHub Issues, 이메일, 또는 직접 이 문서에 PR로 환영합니다.

---

_문서 버전: v1.0 | 작성일 2026-04-07 | 다음 갱신: 검토 피드백 수령 후_
