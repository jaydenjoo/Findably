# Findably 모니터링 파이프라인 PRD

> **프로젝트**: Findably — 파이프라인 모니터링 & 크롤 안정화
> **작성일**: 2026-04-07
> **상태**: Jayden 승인 대기
> **예상 소요**: Epic 3개, Task 9개, 총 8~12시간
> **보안 분류**: 🟡 일반 (n8n 자동화 허용)

---

## 1. 목적

4주간 50+ fix 커밋 중 **51%가 n8n 콜백(17건) + Vercel Lambda(8건)** 관련.
인시던트의 공통점: **문제 발생 후 수시간~하루 뒤에야 수동 발견**.

이 PRD는 두 가지를 해결한다:

1. **크롤 워크플로우 강화** — 반복된 인시던트의 방어 코드를 워크플로우 레벨에서 적용
2. **자동 모니터링** — 30분 주기 헬스체크 → Supabase 기록 → 대시보드 시각화

---

## 2. 기능 요구사항

### 해야 할 것

| #   | 기능                      | 설명                                                                        |
| --- | ------------------------- | --------------------------------------------------------------------------- |
| F1  | Supabase 모니터링 테이블  | `pipeline_health`, `crawl_executions`, `alerts` 3개 테이블 + 뷰 3개         |
| F2  | Crawl v3 강화             | API 키 Credential화, 308 방지, retry, Quality Gate, 실행 기록 Supabase 저장 |
| F3  | Monitor v2 워크플로우     | 30분 주기 4개 서비스 체크 → Supabase 저장 → 이상 시 알림                    |
| F4  | `/api/health` 라우트      | 모니터링용 헬스체크 엔드포인트 (GET → 200 OK)                               |
| F5  | `/admin/monitor` 대시보드 | 파이프라인 상태, 크롤 성공률, 알림 목록 시각화                              |
| F6  | Crawl v3 실행 기록 저장   | 크롤 완료 시 `crawl_executions` 테이블에 결과 기록                          |

### 만들지 않을 것 (Not Doing)

| #   | 제외 항목                  | 이유                                                    |
| --- | -------------------------- | ------------------------------------------------------- |
| N1  | Trigger.dev 마이그레이션   | 별도 PRD로 분리 (더 큰 아키텍처 변경)                   |
| N2  | 유료 분석(WL2) 모니터링    | 이 PRD는 크롤(WL1)만. WL2는 Trigger.dev 마이그레이션 후 |
| N3  | Slack/Email 알림 노드      | Jayden이 n8n에서 직접 연결 (알림 채널 선택은 운영 결정) |
| N4  | Grafana/외부 모니터링 도구 | Supabase + 자체 대시보드로 충분                         |
| N5  | n8n Crawl v2 수정          | v3를 새로 만들고 v2는 비활성화 (롤백 가능)              |
| N6  | 결제/인증 관련 모니터링    | 🔴 보안 분류 — n8n 스코프 밖                            |

---

## 3. 스택

| 레이어     | 기술                                 | 비고                         |
| ---------- | ------------------------------------ | ---------------------------- |
| 워크플로우 | n8n 2.8.0 (Elest.io)                 | Crawl v3 + Monitor v2        |
| DB         | Supabase PostgreSQL                  | 모니터링 테이블 3개 + 뷰 3개 |
| Frontend   | Next.js 15 (App Router)              | `/admin/monitor` 페이지      |
| 파일       | 제공된 JSON 2개 + SQL 1개 + 스펙 1개 | 이전 대화에서 생성 완료      |

---

## 4. Epic → Task 분해

### Epic 1: 인프라 준비 (Supabase + API)

> 예상: 2~3시간

#### Task 1-1: Supabase 모니터링 테이블 생성 (30분)

#### Task 1-2: `/api/health` 헬스체크 라우트 생성 (30분)

#### Task 1-3: `/api/crawl/complete` probe 처리 추가 (30분)

### Epic 2: n8n 워크플로우 배포 (Jayden 수동)

> 예상: 1~2시간 (Jayden이 n8n UI에서 직접)

#### Task 2-1: n8n Credential 3개 생성

#### Task 2-2: Crawl v3 import + 테스트

#### Task 2-3: Monitor v2 import + 테스트

### Epic 3: 대시보드 구현 (Claude Code)

> 예상: 4~6시간

#### Task 3-1: `/admin/monitor` 페이지 — 상태 + 서비스 카드 (1.5시간)

#### Task 3-2: 크롤 실행 이력 + 성공률 차트 (1.5시간)

#### Task 3-3: 알림 목록 + Acknowledge 기능 (1시간)

---

## 5. 완료 기준

| #   | 기준                             | 검증 방법                                                     |
| --- | -------------------------------- | ------------------------------------------------------------- |
| AC1 | 모니터링 테이블에 데이터 쌓임    | Supabase에서 `SELECT * FROM findably_pipeline_health LIMIT 5` |
| AC2 | 30분마다 헬스체크 자동 실행      | n8n Executions 탭에서 30분 간격 기록 확인                     |
| AC3 | 308 redirect 감지 시 알림        | `findably_alerts`에 critical 레코드 생성                      |
| AC4 | 대시보드에서 현재 상태 확인 가능 | `/admin/monitor` 접속 → 4개 서비스 카드 표시                  |
| AC5 | 크롤 실행마다 이력 기록          | `findably_crawl_executions`에 레코드 생성                     |
| AC6 | admin만 대시보드 접근            | 비로그인/일반 사용자 → redirect                               |

---

## 6. 의존성 & 리스크

| 리스크                                                                            | 영향                         | 대응                                       |
| --------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------ |
| n8n Credential의 `$credentials` 표현식이 HTTP Request 노드에서 지원 안 될 수 있음 | API 키 참조 실패             | Header Auth Credential 타입으로 대체       |
| Supabase service_role key가 n8n에 저장됨                                          | 키 노출 시 전체 DB 접근 가능 | n8n Credential 암호화 + Elest.io 접근 제한 |
| Monitor probe가 실제 콜백 로직을 트리거할 수 있음                                 | 잘못된 진단 생성             | `_isProbe: true` 필드로 백엔드에서 필터    |

---

# Claude Code 지시문

> 아래는 Findably 프로젝트의 Claude Code 세션에서 사용할 지시문입니다.
> Epic 1(Task 1-1 ~ 1-3)과 Epic 3(Task 3-1 ~ 3-3)이 Claude Code 스코프입니다.
> Epic 2는 Jayden이 n8n UI에서 수동 진행합니다.

---

## 📌 세션 시작 시 필수 읽기

```
PROGRESS.md, CLAUDE.md, docs/learnings.md
```

---

## Task 1-1: Supabase 모니터링 테이블 생성

```markdown
# Task 1-1: Supabase 모니터링 테이블 생성

## 목표

n8n 모니터링 데이터를 저장할 Supabase 테이블 3개 + 뷰 3개를 생성한다.

## 지시

1. `supabase/migrations/` 폴더에 새 마이그레이션 파일 생성
   - 파일명: `XXX_findably_monitoring.sql` (XXX = 다음 번호)
2. 아래 내용을 포함:
   - `findably_pipeline_health` 테이블 (헬스체크 기록)
   - `findably_crawl_executions` 테이블 (크롤 실행 기록)
   - `findably_alerts` 테이블 (알림 이력)
   - 인덱스: created_at DESC, status 필터, diagnosis_id
   - RLS 정책: admin 이메일(hidream72@gmail.com)만 접근
   - 뷰 3개: v_health_summary_24h, v_crawl_success_rate_7d, v_unacknowledged_alerts
3. `findably_crawl_executions`에 `request_id` UNIQUE 인덱스 추가 (멱등성)

## 스키마 참조

프로젝트 루트에 `findably-monitoring-migration.sql` 파일이 있다면 그것을 기반으로.
없으면 아래 스키마로 생성:

### findably_pipeline_health

- id: UUID PK
- overall_status: TEXT ('healthy'|'warning'|'critical')
- critical_count: INTEGER
- warning_count: INTEGER
- checks: JSONB (배열, [{name, status, code, detail}])
- execution_id: TEXT (n8n 실행 ID)
- created_at: TIMESTAMPTZ

### findably_crawl_executions

- id: UUID PK
- diagnosis_id: UUID NOT NULL
- url: TEXT NOT NULL
- request_id: TEXT (멱등성 키, UNIQUE)
- status: TEXT ('success'|'partial'|'failed'|'quality_rejected')
- data_completeness: INTEGER (0-100)
- duration_sec: INTEGER
- success_sources: TEXT[]
- failed_sources: TEXT[]
- error_details: JSONB
- callback_status: TEXT ('success'|'failed'|'skipped'|'redirect')
- callback_status_code: INTEGER
- execution_id: TEXT
- created_at: TIMESTAMPTZ

### findably_alerts

- id: UUID PK
- alert_type: TEXT ('health_critical'|'health_warning'|'callback_failed'|'low_quality'|'crawl_failed')
- severity: TEXT ('critical'|'warning'|'info')
- message: TEXT
- diagnosis_id: UUID (nullable)
- health_check_id: UUID FK → pipeline_health
- crawl_execution_id: UUID FK → crawl_executions
- acknowledged: BOOLEAN DEFAULT FALSE
- acknowledged_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ

## 검증

- `npx supabase db diff` 또는 Supabase SQL Editor에서 실행 확인
- 3개 테이블 + 3개 뷰 + RLS 정책 존재 확인

## 스코프 제한

- 기존 테이블(diagnoses 등) 수정 금지
- 새 테이블만 추가
```

---

## Task 1-2: `/api/health` 헬스체크 라우트 생성

```markdown
# Task 1-2: /api/health 헬스체크 라우트

## 목표

n8n 모니터링 워크플로우가 Vercel 서비스 상태를 확인할 수 있는 엔드포인트를 만든다.

## 지시

1. `src/app/api/health/route.ts` 생성
2. GET 요청에 대해:
   - Supabase 연결 테스트 (간단한 SELECT 1)
   - 응답: { status: 'ok', timestamp, supabase: 'connected'|'error' }
   - HTTP 200 반환
3. POST/PUT/DELETE → 405 Method Not Allowed
4. 인증 불필요 (공개 엔드포인트)
5. maxDuration 설정 불필요 (가벼운 라우트)

## 주의사항

- 민감한 정보(DB 버전, 내부 IP 등) 노출 금지
- Supabase 연결 실패 시에도 HTTP 200 반환 (status 필드로 구분)
  → n8n이 HTTP 에러와 서비스 에러를 구분하기 위함

## 검증

- `curl https://findably.kr/api/health` → 200 + JSON
- `curl -X POST https://findably.kr/api/health` → 405
```

---

## Task 1-3: `/api/crawl/complete` probe 처리 추가

````markdown
# Task 1-3: 콜백 라우트에 모니터 probe 필터 추가

## 목표

n8n Monitor가 콜백 URL 가용성을 확인하기 위해 보내는 probe 요청을
실제 크롤 처리와 분리한다.

## 지시

1. `src/app/api/crawl/complete/route.ts` (또는 해당 핸들러) 수정
2. 요청 body에 `_isProbe: true`가 있거나 헤더에 `X-Monitor-Probe: true`가 있으면:
   - DB 작업 없이 즉시 응답: { status: 'probe_ok', timestamp }
   - HTTP 200 반환
3. 기존 로직은 변경하지 않음 — probe 필터를 **가장 앞에** 추가

## 코드 위치

handleCallback 함수 또는 POST handler의 최상단에 추가:

```typescript
// Monitor probe 필터 (가장 먼저 실행)
if (body._isProbe || request.headers.get('X-Monitor-Probe') === 'true') {
  return NextResponse.json({
    status: 'probe_ok',
    timestamp: new Date().toISOString(),
  })
}
```
````

## 검증

- probe 요청: 200 + probe_ok 응답
- 일반 요청: 기존 로직 그대로 동작
- probe가 diagnoses 테이블에 레코드 생성하지 않음 확인

## 스코프 제한

- handleCallback의 기존 로직 변경 금지
- probe 필터 1개만 추가

````

---

## Task 3-1: `/admin/monitor` 대시보드 — 상태 + 서비스 카드

```markdown
# Task 3-1: 모니터링 대시보드 — 메인 레이아웃

## 목표
파이프라인 현재 상태와 4개 서비스 상태를 한눈에 보여주는 admin 페이지를 만든다.

## 지시
1. `src/app/admin/monitor/page.tsx` 생성 (Server Component)
2. admin 접근 제어: 기존 admin 체크 패턴 사용 (ACCESS.ADMIN_EMAILS)
   - 비인가 → redirect('/login')

### 레이아웃 구성

#### 상단: 파이프라인 상태 배지
- `findably_pipeline_health` 최신 1건 조회
- 상태별 색상: healthy=green, warning=yellow, critical=red
- "Last checked: X분 전" 표시

#### 중단: 4개 서비스 카드 (2x2 그리드)
- 최신 health check의 `checks` JSONB 배열에서 추출
- 각 카드: 서비스명, 상태 아이콘, HTTP 코드, 상세 메시지
- 카드 4개: Vercel Health, Callback URL, Firecrawl API, Observatory v2

#### 새로고침
- 30초마다 `router.refresh()` (useEffect + setInterval)
- 수동 새로고침 버튼

### Supabase 조회
- createClient (서버 컴포넌트용, service_role 아님 — admin RLS 정책 사용)
- 쿼리: `findably_pipeline_health` ORDER BY created_at DESC LIMIT 1

### 디자인
- 기존 Findably 디자인 시스템 (docs/design-system.md) 참조
- Tailwind v4 + shadcn/ui Card 컴포넌트 사용
- 다크 테마 기준

## 검증
- admin 로그인 → `/admin/monitor` 접속 → 상태 배지 + 4개 카드 표시
- 비로그인 → redirect
- 30초 후 자동 새로고침 확인

## 스코프 제한
- 이 Task에서는 상태 배지 + 서비스 카드만
- 차트, 알림 목록, 실행 이력은 Task 3-2, 3-3에서
````

---

## Task 3-2: 크롤 실행 이력 + 성공률 차트

```markdown
# Task 3-2: 크롤 성공률 차트 + 실행 이력 테이블

## 목표

7일간 일별 크롤 성공률 차트와 최근 20건 실행 이력 테이블을 추가한다.

## 지시

1. `/admin/monitor/page.tsx`에 섹션 2개 추가 (서비스 카드 아래)

### 섹션 1: 7일 크롤 성공률 차트

- `v_crawl_success_rate_7d` 뷰 조회
- 일별 바 차트: success(green) / partial(yellow) / failed(red) 스택
- 평균 completeness % 텍스트 표시
- recharts 또는 순수 CSS 바 차트 (가벼운 쪽 선택)

### 섹션 2: 최근 크롤 실행 이력

- `findably_crawl_executions` 최근 20건 조회
- 테이블 컬럼: 시간, URL(truncate), 상태, 소요시간, 완전성%, 실패소스
- 상태별 색상 배지: success=green, partial=yellow, failed=red, quality_rejected=gray
- 행 클릭 → 상세 펼침 (errorDetails 표시) (선택사항, 시간 여유 시)

### 데이터가 없을 때

- "아직 모니터링 데이터가 없습니다. n8n Monitor 워크플로우를 활성화하세요." 안내 표시

## 검증

- 데이터 있을 때: 차트 + 테이블 정상 렌더링
- 데이터 없을 때: 빈 상태 안내 표시
- 모바일 반응형 확인

## 스코프 제한

- 차트 라이브러리 신규 설치 최소화 (recharts가 이미 있으면 사용, 없으면 CSS 바)
- 실시간 웹소켓 불필요 (30초 새로고침으로 충분)
```

---

## Task 3-3: 알림 목록 + Acknowledge 기능

````markdown
# Task 3-3: 알림 목록 + Acknowledge

## 목표

미확인 알림 목록을 표시하고, admin이 확인 처리(acknowledge)할 수 있게 한다.

## 지시

1. `/admin/monitor/page.tsx`에 알림 섹션 추가 (차트 아래)

### 알림 목록

- `v_unacknowledged_alerts` 뷰 조회 (미확인만)
- 각 알림: 시간, 타입 배지, severity 색상, 메시지 (pre-formatted)
- severity별: critical=red-bg, warning=yellow-bg, info=blue-bg

### Acknowledge 기능

- 개별 "확인" 버튼 → Server Action으로 UPDATE
- "전체 확인" 버튼 → 미확인 알림 일괄 UPDATE
- Server Action:
  ```typescript
  'use server'
  async function acknowledgeAlert(alertId: string) {
    await supabase
      .from('findably_alerts')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', alertId)
    revalidatePath('/admin/monitor')
  }
  ```
````

### 알림 없을 때

- "✅ 미확인 알림이 없습니다" 표시

## 검증

- 알림 있을 때: 목록 표시 + 확인 버튼 작동
- 확인 후: 목록에서 사라짐
- 전체 확인: 모든 알림 일괄 처리

## 스코프 제한

- 알림 히스토리(확인 완료된 과거 알림) 조회는 이 Task에 포함하지 않음
- Slack/Email 알림 발송은 n8n 측 작업 (여기서 안 함)

````

---

## 공통 규칙 (모든 Task에 적용)

```markdown
## 공통 규칙

### 검증 게이트
매 Task 완료 시 반드시:
1. `tsc --noEmit` 통과
2. `npx next build` 통과
3. 관련 테스트 통과 (있는 경우)

### learnings.md 확인
- Task 시작 전 `docs/learnings.md` 읽기
- 특히 관련 학습 사례:
  - #13: API 키 평문 하드코딩 금지
  - #12: trailing slash 308 → POST→GET 변환
  - #23: Mozilla Observatory v1→v2 마이그레이션
  - #25: Google API 키 권한 분리
  - #33: 콜백 URL stale 4시간 추적
  - #40: 멱등성 가드 부재 → DB write 폭주

### 스코프 크리프 금지
- 요청 외 기능 추가 금지
- "이것도 같이" → "다음 Task로 제안합니다"

### OAR 보고
Task 완료 시:
- **O**bservation: 무엇을 확인했는가
- **A**ction: 무엇을 했는가
- **R**ationale: 왜 이 방법을 선택했는가

### Supabase 접근
- 서버 컴포넌트: createServerClient (쿠키 기반, RLS 적용)
- Server Action: createServerClient (쿠키 기반, RLS 적용)
- n8n: service_role key (RLS 우회) — 코드에서 직접 사용 금지
- 클라이언트: createBrowserClient (RLS 적용)

### 파일 위치 컨벤션
- 마이그레이션: `supabase/migrations/`
- API 라우트: `src/app/api/`
- 페이지: `src/app/admin/monitor/`
- Server Actions: 페이지 파일 내 또는 `src/app/admin/monitor/actions.ts`
````

---

## 실행 순서 요약

```
Phase 1: 인프라 (Claude Code)
  Task 1-1 → 1-2 → 1-3 → tsc + build 검증

Phase 2: n8n 배포 (Jayden 수동)
  Task 2-1 → 2-2 → 2-3 → n8n 테스트 실행

Phase 3: 대시보드 (Claude Code)
  Task 3-1 → 3-2 → 3-3 → tsc + build + E2E 검증

완료 후: Crawl v2 비활성화 + v3 활성화 (Jayden 수동)
```
