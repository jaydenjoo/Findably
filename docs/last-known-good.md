# Last Known Good — Findably 프로덕션 상태 추적

> **이 파일의 목적**
> 프로덕션이 "정상"으로 확인된 마지막 시점의 전체 상태를 박제한다.
> 문제가 터지면 "지금 상태 vs 이 파일"을 diff해서 뭐가 바뀌었는지 즉시 찾는다.
> **절대로 이 파일을 추측으로 채우지 말 것** — 실제 검증 완료 후에만 갱신.

---

## 1. 🟢 마지막 검증된 정상 상태 (Last Verified Good)

> **⚠️ 현재 비어있음 — 다음 검증 성공 시 Jayden이 직접 기입**

```
마지막 검증 일시: (미확정)
Git SHA:         (미확정)
Vercel 배포 ID:  (미확정)
n8n workflow:    (미확정)
검증자:          (미확정)
```

### 적용된 Supabase 마이그레이션 (정상 시점 기준)

_다음 검증 성공 시, 아래 쿼리 결과를 붙여넣기:_

```sql
SELECT version, name FROM supabase_migrations.schema_migrations
WHERE name ILIKE '%findably%' OR version >= '20260101000000'
ORDER BY version;
```

### 설정되어 있어야 하는 환경변수 (이름만 — 값 금지)

_Vercel 대시보드 기준 — 다음 검증 성공 시 현재 이름 목록을 붙여넣기:_

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
N8N_WEBHOOK_URL
N8N_WEBHOOK_SECRET
CRAWL_EXECUTE_SECRET
NEXT_PUBLIC_SITE_URL
RESEND_API_KEY
TOSS_SECRET_KEY
NEXT_PUBLIC_TOSS_CLIENT_KEY
SENTRY_DSN
CRON_SECRET
(이 외 추가 시 여기 이름만 추가)
```

### 검증 통과한 사용자 시나리오

- [ ] 로그인 (이메일)
- [ ] 로그인 (Google OAuth)
- [ ] URL 제출 → 3분 이내 무료 리포트 완료
- [ ] 대시보드에서 점수/Quick Win 정상 렌더
- [ ] 선물코드 결제 → 상세 분석 2분 이내 완료
- [ ] Toss 결제 → 상세 분석 2분 이내 완료
- [ ] PDF 다운로드 작동
- [ ] Sentry 대시보드 에러 0건 (최근 1시간)

---

## 2. 🔴 현재 상태 (Current State)

> **자동 갱신 아님** — 세션 작업 중 상황 바뀌면 여기 기록

```
마지막 점검 일시: 2026-04-06 12:20 KST
Git SHA:         8f7d569 (docs: save session — CEO + Eng review 완료)
상태:            🔴 고장 (프로덕션 분석 플로우 실패)
```

### 알려진 문제

**P0 — 프로덕션 무료 진단 플로우 고장**

- **증상**: URL 제출 → 5분 후 `status=failed` 마킹, `crawl_data=NULL`
- **근본 원인**: `src/app/(dashboard)/dashboard/_components/PaidAnalyzingState.tsx:98-114`의 useEffect가 `isPaid` 여부 무관하게 `/api/payment/trigger-analysis`를 호출. 호출된 라우트는 `runDiagnosisPaid()`를 실행하는데, 무료 진단은 `crawl_data`가 NULL이라 실패하고 catch 블록이 `.update({ status: 'failed' })`를 실행.
- **증거**: pg_stat_statements에서 `SELECT status → SELECT url,crawl_data,... → UPDATE status` 순서 확인됨 (03:13:41 시점)
- **수정 방안**: `PaidAnalyzingState`에 `if (!isPaid) return` 추가 + `trigger-analysis` 라우트에 tier 가드 추가
- **상태**: 🔴 미수정 (Jayden 승인 대기)

**미커밋 변경 (Lane A/B 작업분)**

- `src/features/diagnosis-free/types.ts` 외 20+ 파일
- 신규 파일: `src/lib/adapters/email.ts`, `src/app/api/nps/`, `src/app/api/self-report/`, `src/lib/analytics/`
- 신규 마이그레이션: `007_findably_analytics_events.sql` ~ `010_findably_self_reports_recrawl_completed.sql`
- **상태**: 프로덕션 배포 안 됨. 로컬에만 존재.

### DB 재마이그레이션 이력 (이번 세션)

세션 중 내가 Findably 관련 테이블 전체를 drop 후 재생성했음:

```
findably_drop_all_v1_tables_2026_04_06  (20260406030615) — 전체 drop
findably_v2_complete_schema_2026_04_06  (20260406030732) — 통합 재생성
```

**중요**: chatsio-v1 공유 Supabase 프로젝트이므로 `user_profiles, shops, products, optimizations, prompts, prompt_versions` 등 chatsio 테이블은 건드리지 않음.

---

## 3. 📋 "정상"으로 마킹하는 기준 (Verification Checklist)

> 아래 **모두 통과**해야 Section 1 갱신 가능. 하나라도 실패하면 갱신 금지.

### Tier 1 — 기본 동작 (필수)

- [ ] `https://findably.kr` 로딩 — Sentry 에러 없음
- [ ] 이메일 로그인 성공
- [ ] Google OAuth 로그인 성공
- [ ] URL 제출 폼 작동 (폼 검증 포함)
- [ ] `/onboarding/analyzing` 페이지 정상 표시

### Tier 2 — 핵심 플로우 (필수)

- [ ] 무료 진단: URL 제출 → **3분 이내** `status=completed` 확인
- [ ] 무료 리포트 렌더: 점수 게이지 + Quick Win + 카테고리 점수 표시
- [ ] n8n 콜백 성공 (crawl_data NOT NULL)
- [ ] 룰 기반 진단 엔진 실행 (analysis_data NOT NULL)

### Tier 3 — 결제 플로우 (필수)

- [ ] 선물코드 또는 Toss 결제 → 상세 분석 트리거
- [ ] 유료 진단: 결제 완료 → **2분 이내** `status=completed` 확인
- [ ] 5-Agent 분석 결과 모두 채워짐 (technical/seo/geo/content/competitors)
- [ ] CMO 검증 결과 채워짐

### Tier 4 — 부가 기능 (권장)

- [ ] PDF 다운로드 생성 성공
- [ ] 이메일 알림 발송 (Resend)
- [ ] 대시보드 "진단 이력" 탭 작동

### Tier 5 — 관측성 (권장)

- [ ] Sentry 에러 0건 (최근 1시간)
- [ ] Supabase `get_logs` 에러 0건
- [ ] Vercel Function logs 500 에러 0건

---

## 4. 🔄 업데이트 프로토콜 (언제/어떻게 갱신)

### 언제 갱신하나

**✅ 갱신해야 할 때**

1. **Tier 1~3 전부 통과 확인 직후** — Section 1을 현재 상태로 덮어쓰기
2. **새 기능 배포 후 프로덕션 검증 완료 직후**
3. **긴급 수정(hotfix) 배포 후 정상 작동 확인 직후**
4. **환경변수/n8n workflow 변경 후 검증 완료 직후**

**❌ 갱신하면 안 되는 때**

- 로컬에서만 테스트 통과 (프로덕션 미검증)
- 코드만 배포, 사용자 시나리오 미검증
- "아마 될 것 같다" 정도의 추정
- Tier 1~3 중 하나라도 실패

### 어떻게 갱신하나

1. **검증 체크리스트 실행** (Section 3) — 하나씩 수동으로 확인
2. **스냅샷 수집** — 아래 명령어 실행:

   ```bash
   # Git SHA
   git rev-parse HEAD

   # 현재 마이그레이션 목록 (Supabase MCP)
   # SELECT version, name FROM supabase_migrations.schema_migrations
   # WHERE name ILIKE '%findably%' ORDER BY version;

   # Vercel 배포 ID
   # Vercel 대시보드 → Deployments → 최상단 deployment ID 복사
   ```

3. **Section 1 업데이트** — 수집한 정보로 덮어쓰기
4. **Section 6에 변경 이력 추가** — 날짜 + SHA + 변경 사유
5. **Git 커밋** — `docs: last-known-good 갱신 — {SHA} 검증 완료`

---

## 5. 🚨 문제 발생 시 진단 순서 (READ ONLY 우선)

> **파괴적 작업(DB drop, env 변경, git reset) 금지**. 증거 먼저 수집.

### Step 1 — 증거 수집 (1~3분)

```bash
# 1. 현재 SHA와 last-known-good SHA 비교
git rev-parse HEAD
# → docs/last-known-good.md Section 1과 비교

# 2. 이후 커밋 확인
git log {LAST_GOOD_SHA}..HEAD --oneline

# 3. 미커밋 변경 확인
git status -sb
```

### Step 2 — Supabase 진단 (Supabase MCP)

```sql
-- 최근 쿼리 패턴
SELECT query, calls, mean_exec_time::int AS avg_ms, stats_since
FROM pg_stat_statements
WHERE query ILIKE '%diagnoses%'
ORDER BY stats_since DESC NULLS LAST
LIMIT 20;

-- 최근 실패 진단
SELECT id, status, created_at, updated_at,
  (crawl_data IS NOT NULL) AS has_crawl,
  (analysis_data IS NOT NULL) AS has_analysis
FROM public.diagnoses
ORDER BY created_at DESC LIMIT 5;
```

그리고 API/Postgres 로그:

```
mcp__claude_ai_Supabase__get_logs(service="api")
mcp__claude_ai_Supabase__get_logs(service="postgres")
```

### Step 3 — 가설 수립 + Jayden 보고

- 증거 요약 + 추정 원인 1~3개
- "파괴적 작업 제안"이 아니라 **"추가 확인 명령 제안"**
- Jayden 승인 후 다음 단계

### Step 4 — 수정 계획 + 승인 → 실행

- **절대 금지**: 증거 없이 "일단 DB 재마이그레이션해볼게요" / "환경변수 재설정해볼게요"
- **허용**: "증거 X 때문에 원인은 Y로 추정됩니다. Z 파일을 수정하겠습니다. 승인해주세요."

### 디버깅 체크리스트 (docs/learnings.md 참조)

`docs/learnings.md`의 "에러 발생 시 디버깅 체크포인트" 섹션 A~G 먼저 확인.

---

## 6. 📜 변경 이력

| 날짜       | SHA     | 상태    | 변경 사유                                                                        | 갱신자          |
| ---------- | ------- | ------- | -------------------------------------------------------------------------------- | --------------- |
| 2026-04-06 | 8f7d569 | 🔴 고장 | 초기 파일 생성 — PaidAnalyzingState race condition 버그 발견, 프로덕션 고장 상태 | Claude + Jayden |

---

## 📌 이 파일 쓰는 원칙

1. **추측 금지, 검증만 기록** — "아마 될 것 같다"는 여기 안 들어감
2. **시크릿 금지** — 환경변수 이름만, 값/해시/prefix 금지
3. **Section 1 덮어쓰기 방식** — 히스토리는 Section 6에만
4. **Jayden이 최종 결정** — Claude는 제안만, 커밋은 Jayden 승인 후
