# Secrets Management Guide

> 민감한 정보(API 키, 토큰, 비밀번호) 관리 방법 및 보안 절차 문서
> 최종 업데이트: 2026-03-12

---

## 목차

1. [환경변수 개요](#환경변수-개요)
2. [필수 비밀정보 목록](#필수-비밀정보-목록)
3. [개발 환경 설정](#개발-환경-설정)
4. [프로덕션 배포 (Vercel)](#프로덕션-배포-vercel)
5. [n8n 자동화 서버](#n8n-자동화-서버)
6. [비밀정보 검증](#비밀정보-검증)
7. [비밀정보 로테이션](#비밀정보-로테이션)
8. [응급 절차](#응급-절차)

---

## 환경변수 개요

### 원칙

- **절대 하드코딩 금지**: 모든 민감 정보는 환경변수로만 관리
- **Fail-Fast**: 필수 환경변수 누락 시 애플리케이션 시작 실패
- **Validation**: `src/lib/env.ts`에서 Zod 스키마로 검증
- **Type-Safe**: TypeScript로 타입 안전성 확보

### 환경변수 로드 순서

```
1. src/instrumentation.ts (앱 시작 시)
   → validateEnv() 호출 → 필수 변수 검증

2. src/lib/env.ts
   → getEnvConfig() 사용하여 타입 안전한 설정 객체 반환

3. 각 모듈에서 getEnvConfig() 호출
   → Supabase, Claude API, n8n 등 초기화
```

---

## 필수 비밀정보 목록

### Supabase (인증 + 데이터베이스)

| 변수명 | 유형 | 저장 위치 | 노출 가능 여부 |
|--------|------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL | Vercel, Railway | ✅ 공개 (클라이언트에 노출) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 토큰 | Vercel, Railway | ✅ 공개 (Anon = 공개 키) |
| `SUPABASE_SERVICE_ROLE_KEY` | 토큰 | Vercel, Railway | ❌ 비밀 (서버 전용) |
| `DATABASE_URL` | 연결문자열 | Vercel, Railway | ❌ 비밀 (서버 전용) |

**획득 방법**:
- Supabase Dashboard → Settings → API → Copy
- 또는 Supabase CLI: `supabase projects list` → 프로젝트 선택

**예시** (실제 값 아님):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:your_password@xxxxx.supabase.co:5432/postgres
```

---

### Claude API (AI 분석)

| 변수명 | 유형 | 저장 위치 | 노출 가능 여부 |
|--------|------|---------|--------------|
| `ANTHROPIC_API_KEY` | API Key | Vercel, Railway | ❌ 비밀 |

**획득 방법**:
1. [console.anthropic.com](https://console.anthropic.com) 접속
2. Settings → API Keys → Create Key
3. "sk-ant-..." 형태의 키 복사

**사용처**:
- `src/lib/ai/claude-analyzer.ts` — 콘텐츠 분석
- `src/lib/generation/meta-optimizer.ts` — 메타 태그 최적화
- 호출 비용: ~$0.003 / 1K 토큰 (Sonnet)

**예시**:
```
ANTHROPIC_API_KEY=sk-ant-d2F2ZXJm...
```

---

### Google PageSpeed Insights API

| 변수명 | 유형 | 저장 위치 | 노출 가능 여부 |
|--------|------|---------|--------------|
| `GOOGLE_PAGESPEED_API_KEY` | API Key | Vercel, Railway | ❌ 비밀 |

**획득 방법**:
1. [Google Cloud Console](https://console.cloud.google.com)
2. 프로젝트 생성 → API & Services → Enable PageSpeed Insights API
3. Credentials → API Key 생성

**사용처**:
- n8n 크롤링 워크플로우
- 성능 점수 수집

**예시**:
```
GOOGLE_PAGESPEED_API_KEY=AIzaSyD...
```

---

### n8n (크롤링 자동화)

| 변수명 | 유형 | 저장 위치 | 노출 가능 여부 |
|--------|------|---------|--------------|
| `N8N_WEBHOOK_BASE_URL` | URL | Vercel, Railway | ✅ 공개 (Webhook URL) |
| `N8N_API_KEY` | API Key | Vercel, Railway | ❌ 비밀 |

**획득 방법** (Railway에서):
1. Railway Dashboard → n8n 프로젝트 → Variables
2. `N8N_WEBHOOK_BASE_URL` 확인 (예: `https://n8n-xxxx.railway.app`)
3. n8n UI → Settings → API → Generate API Key

**사용처**:
- 온보딩 Step 3 완료 시 크롤링 트리거
- `src/actions/onboarding.ts` — API 호출

**예시**:
```
N8N_WEBHOOK_BASE_URL=https://n8n.railway.app
N8N_API_KEY=your_n8n_api_key
```

---

### Sentry (에러 모니터링) — 선택사항

| 변수명 | 유형 | 저장 위치 | 노출 가능 여부 |
|--------|------|---------|--------------|
| `SENTRY_DSN` | URL | Vercel, Railway | ❌ 비밀 |

**획득 방법**:
1. [sentry.io](https://sentry.io) → Dashboard → Settings → Client Keys
2. DSN 복사 (https://xxxx@sentry.io/xxxxx 형태)

**예시**:
```
SENTRY_DSN=https://key@sentry.io/project-id
```

---

### 애플리케이션 설정

| 변수명 | 유형 | 저장 위치 | 노출 가능 여부 |
|--------|------|---------|--------------|
| `NEXT_PUBLIC_APP_URL` | URL | Vercel, Railway | ✅ 공개 |

**용도**: 인증 콜백, 이메일 링크 등에서 절대 URL 필요

**개발 환경**:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**프로덕션**:
```
NEXT_PUBLIC_APP_URL=https://findably.com
```

---

## 개발 환경 설정

### 1단계: `.env.local` 파일 생성

```bash
# 프로젝트 루트에서
cp .env.example .env.local
```

### 2단계: 각 비밀정보 채우기

```bash
# .env.local 편집
NEXT_PUBLIC_SUPABASE_URL=<Supabase에서 복사>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase에서 복사>
SUPABASE_SERVICE_ROLE_KEY=<Supabase에서 복사>
DATABASE_URL=<Supabase 연결 문자열>
ANTHROPIC_API_KEY=<console.anthropic.com에서 복사>
GOOGLE_PAGESPEED_API_KEY=<Google Cloud에서 복사>
N8N_WEBHOOK_BASE_URL=<Railway n8n URL>
N8N_API_KEY=<n8n에서 생성>
NEXT_PUBLIC_APP_URL=http://localhost:3000
SENTRY_DSN=  # 선택사항 (비워두어도 됨)
```

### 3단계: 검증

```bash
# 필수 환경변수가 모두 설정되었는지 확인
npm run dev

# 개발 서버 시작 성공 = 환경변수 모두 정상
```

**주의**: `.env.local`은 `.gitignore`에 포함되므로 Git에 커밋되지 않음

---

## 프로덕션 배포 (Vercel)

### 1단계: Vercel 대시보드에서 환경변수 설정

1. Vercel Dashboard → Project Settings → Environment Variables
2. 각 변수명 입력 후 값 설정 (복사-붙여넣기)

```
변수명: NEXT_PUBLIC_SUPABASE_URL
값: https://xxxxx.supabase.co
환경: Production, Preview, Development (선택)

변수명: ANTHROPIC_API_KEY
값: sk-ant-xxxxx
환경: Production, Preview 만 선택 (보안)
```

### 2단계: 공개 vs 비공개 변수 구분

**공개 변수** (`NEXT_PUBLIC_*`):
- 클라이언트(브라우저)에 노출되어도 괜찮음
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Vercel: Production, Preview, Development 모두 체크

**비공개 변수**:
- 서버에서만 사용, 클라이언트에 절대 노출 금지
- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `N8N_API_KEY`
- Vercel: Production, Preview 만 체크 (Development는 unchecked)

### 3단계: 배포 및 검증

```bash
# main 브랜치에 push
git push origin main

# Vercel은 자동으로 빌드 시작
# Vercel Dashboard에서 빌드 로그 확인
# ✅ Build successful = 환경변수 정상 로드됨
```

**에러 시**:
- "invalid environment variables" → 필수 변수 누락
- "API_KEY must be a valid URL" → URL 형식 오류
- Vercel Logs에서 자세한 에러 확인

---

## n8n 자동화 서버

### Railway에서 n8n 환경변수 설정

1. Railway Dashboard → n8n 프로젝트 → Variables 탭
2. 다음 변수 추가:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `N8N_BASIC_AUTH_ACTIVE` | true | 기본 인증 활성화 |
| `N8N_BASIC_AUTH_USER` | admin | 관리자 계정 |
| `N8N_BASIC_AUTH_PASSWORD` | 보안된 비밀번호 | 최소 8자 |
| `DB_TYPE` | postgresdb | PostgreSQL 사용 |
| `DB_POSTGRESDB_CONNECTION_URL` | 연결 문자열 | Railway에서 제공 |

### n8n 크롤링 워크플로우에서 사용할 환경변수

n8n UI에서 Webhook 수신 시:

```json
{
  "company_id": "company_123",
  "url": "https://example.com",
  "supabase_url": "{{ env.SUPABASE_URL }}",
  "supabase_key": "{{ env.SUPABASE_KEY }}"
}
```

---

## 비밀정보 검증

### 자동 검증 (Git Hooks)

Commit 전 Gitleaks로 하드코딩된 비밀정보 검사:

```bash
# 수동 검증 (언제든지)
npm run secrets:check

# 출력 예
# ✅ No secrets found
# 또는
# ❌ Found 1 secret in src/lib/config.ts:line 42
```

### Gitleaks 규칙

`.gitleaks.toml`에서 다음 패턴 감지:

- Anthropic API Key: `sk-ant-[a-zA-Z0-9]{48}`
- Supabase JWT: `eyJhbGc...` (JWT 형식)
- Google API Key: `AIza[0-9A-Za-z-_]{35}`
- 일반 API Key: `api_key = "..."`

### Allowlist (예외 처리)

테스트 코드와 `.env.example`은 자동으로 제외됨 (`.gitleaks.toml` 설정)

```toml
[allowlist]
  paths = [
    ".env.example$",
    "*.test.(ts|js)$",
    "__tests__/.*"
  ]
```

---

## 비밀정보 로테이션

### 언제 로테이션할까?

- 팀원 이탈 시
- 비밀정보 노출 의심 시
- 정책적으로 주기적 로테이션 (분기별)
- 보안 감사 후

### 로테이션 단계

#### 1. Anthropic API Key

```bash
# 1. console.anthropic.com에서 새 키 생성
# 2. Vercel에서 환경변수 업데이트
ANTHROPIC_API_KEY=<NEW_KEY>
# 3. 배포 확인
# 4. console.anthropic.com에서 이전 키 삭제
```

#### 2. Supabase Service Role Key

⚠️ **주의**: 서비스 롤 키 변경 시 RLS 정책이 영향받을 수 있음

```bash
# 1. Supabase Dashboard → Settings → API → Regenerate Key
# 2. Vercel에서 환경변수 업데이트
SUPABASE_SERVICE_ROLE_KEY=<NEW_KEY>
# 3. 배포 확인
# 4. 이전 키는 자동 무효화됨
```

#### 3. N8N API Key

```bash
# 1. n8n UI → Settings → API → Regenerate Key
# 2. Vercel 환경변수 업데이트
N8N_API_KEY=<NEW_KEY>
# 3. Railway n8n 환경변수도 동기화 필요한 경우 업데이트
# 4. 배포 및 n8n 워크플로우 테스트
```

#### 4. Google PageSpeed API Key

```bash
# 1. Google Cloud Console → Credentials → 이전 키 삭제 → 새 키 생성
# 2. Vercel 환경변수 업데이트
GOOGLE_PAGESPEED_API_KEY=<NEW_KEY>
# 3. 배포 확인
```

---

## 응급 절차

### 시나리오 1: API Key가 실수로 Git 커밋됨

```bash
# 1. 즉시 비밀정보 재생성 (위 로테이션 참조)
# 2. Git 히스토리에서 제거 (선택)
git filter-branch --tree-filter 'rm .env.local' HEAD

# 3. 팀에 알림
# 4. GitHub Secret Scanning 모니터링
```

### 시나리오 2: 변수가 누락되어 배포 실패

```bash
# Vercel 로그에서 확인:
# Error: Invalid environment variables
# ANTHROPIC_API_KEY is required

# 해결:
# 1. Vercel Dashboard → Environment Variables 확인
# 2. 누락된 변수 추가
# 3. 새 배포 트리거 (Settings → Deployments → Redeploy)
```

### 시나리오 3: 프로덕션에서 API 호출 실패

```bash
# 에러: "401 Unauthorized" from Claude API

# 확인:
# 1. Sentry 대시보드에서 에러 상세 확인
# 2. ANTHROPIC_API_KEY가 올바른지 검증
# 3. 해당 API의 요금제 상태 확인
# 4. Rate Limit 초과 여부 확인

# 해결:
# 1. API Key 재생성 및 배포
# 2. 또는 요금제 업그레이드
```

---

## 체크리스트

### 개발 환경

- [ ] `.env.local` 파일 생성됨
- [ ] 모든 필수 변수 채워짐
- [ ] `npm run dev` 성공
- [ ] `npm run secrets:check` 통과

### 프로덕션 배포

- [ ] Vercel Environment Variables 설정 완료
- [ ] 공개/비공개 변수 구분 올바름
- [ ] 빌드 성공 (no environment variable errors)
- [ ] 배포 후 주요 기능 테스트 (인증, 진단, 크롤링)

### 보안

- [ ] `.env.local` .gitignore 포함 확인
- [ ] `npm run secrets:check` 정기적 실행
- [ ] API Key 로테이션 스케줄 수립
- [ ] 팀원의 비밀정보 접근 권한 최소화

---

## 참고 링크

- [Next.js 환경변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase 문서](https://supabase.com/docs)
- [Anthropic API 문서](https://docs.anthropic.com)
- [Vercel 환경변수 관리](https://vercel.com/docs/projects/environment-variables)
- [Gitleaks 가이드](https://github.com/gitleaks/gitleaks)
