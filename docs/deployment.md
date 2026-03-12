# Findably MVP — Deployment Guide

> 최종 업데이트: 2026-03-12
> 이 문서는 Findably MVP를 Vercel(프론트엔드)과 Railway(n8n)에 배포하는 방법을 설명합니다.

---

## Overview

Findably는 다음 인프라로 구성됩니다:

| 컴포넌트                | 배포 대상      | 목적              |
| ----------------------- | -------------- | ----------------- |
| **Next.js 15 Frontend** | Vercel         | 사용자 인터페이스 |
| **Supabase PostgreSQL** | Supabase Cloud | 데이터베이스      |
| **n8n Automation**      | Railway        | 크롤링 워크플로우 |
| **Sentry**              | Sentry Cloud   | 에러 모니터링     |
| **PostHog**             | PostHog Cloud  | 사용자 분석       |

---

## Phase 1: Vercel 배포 (프론트엔드)

### 1.1 사전 준비

**필수 사항:**

- GitHub 저장소 (이미 푸시됨)
- Vercel 계정 (vercel.com 가입)
- 모든 환경변수 준비 (아래 참조)

### 1.2 Vercel에서 프로젝트 연결

#### 단계 1: Vercel Dashboard 접속

```
1. https://vercel.com/dashboard 접속
2. "Add New..." → "Project" 클릭
3. "Import Git Repository" → GitHub 저장소 선택
```

#### 단계 2: 프로젝트 설정

```
프로젝트명: findably (또는 원하는 이름)
Framework Preset: Next.js (자동 감지)
Build Command: pnpm build (vercel.json에서 자동 감지)
Output Directory: .next (자동 감지)
Install Command: pnpm install --frozen-lockfile (vercel.json에서 자동 감지)
```

**Screenshot 예시:**

- Framework: Next.js
- Build Settings 체크 → 자동 감지됨 (vercel.json 참조)

### 1.3 환경변수 설정

#### Vercel Dashboard에서 환경변수 추가

```
Settings → Environment Variables 탭
```

다음 환경변수를 추가합니다 (**모두 필수**):

**공개 변수 (NEXT*PUBLIC*):**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (Supabase에서 복사)
NEXT_PUBLIC_APP_URL=https://findably.vercel.app (또는 커스텀 도메인)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/... (Sentry에서 복사)
NEXT_PUBLIC_POSTHOG_KEY=phc_... (PostHog에서 복사)
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com
```

**비공개 변수 (서버 측 환경):**

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (Supabase 대시보드에서 복사)
DATABASE_URL=postgresql://... (Supabase Connection String)
ANTHROPIC_API_KEY=sk-ant-v7-... (Anthropic 콘솔에서 복사)
GOOGLE_PAGESPEED_API_KEY=AIzaSy... (Google Cloud Console에서 복사)
N8N_WEBHOOK_URL=https://n8n.railway.app/webhook/findably-crawl
N8N_WEBHOOK_BASE_URL=https://n8n.railway.app
SENTRY_AUTH_TOKEN=sntrys_... (Sentry에서 복사)
```

**Environment 선택:**

- `Production`: 모든 환경변수
- `Preview`: 위와 동일 (테스트 용도)
- `Development`: 로컬 개발용 (`.env.local` 사용, Vercel 불필요)

#### 각 환경변수 값 확보 방법

**Supabase:**

```
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. Settings → API 탭
4. "Project URL" → NEXT_PUBLIC_SUPABASE_URL
5. "anon public" → NEXT_PUBLIC_SUPABASE_ANON_KEY
6. "service_role secret" → SUPABASE_SERVICE_ROLE_KEY
7. Databases → Connection string (URI) → DATABASE_URL
```

**Anthropic API:**

```
1. https://console.anthropic.com 접속
2. API Keys 탭
3. "Create Key" → ANTHROPIC_API_KEY 복사
```

**Google PageSpeed Insights API:**

```
1. https://console.cloud.google.com 접속
2. APIs & Services → Enabled APIs
3. "PageSpeed Insights API" 활성화
4. 좌측 Credentials → Create Credentials → API Key
5. GOOGLE_PAGESPEED_API_KEY 복사
```

**Sentry:**

```
1. https://sentry.io/auth/login 접속
2. 조직 및 프로젝트 선택
3. Settings → Projects → findably-mvp
4. Client Keys (DSN) → NEXT_PUBLIC_SENTRY_DSN 복사
5. Settings → Auth Tokens → "Create Token"
6. Scope: org:read, project:releases:write
7. SENTRY_AUTH_TOKEN 복사
```

**PostHog:**

```
1. https://app.posthog.com 접속
2. Project Settings → API Keys
3. "Project API Key" → NEXT_PUBLIC_POSTHOG_KEY
4. Host: https://us.posthog.com (기본값)
```

### 1.4 자동 배포 설정

#### Main 브랜치에 자동 배포

```
Vercel Dashboard → Settings → Git
Deploy on Push: Enabled (기본값)
```

**동작:**

- `git push origin main` → 자동으로 Vercel에서 빌드 및 배포
- 빌드 실패 시 GitHub에 체크 표시 (빨강)
- 빌드 성공 시 GitHub에 배포됨 표시 (녹색)

#### Feature 브랜치에 Preview 배포

```
Branch가 GitHub에 푸시됨 → Vercel 자동 Preview 생성
Preview URL: https://findably-[branch-name].vercel.app
```

**사용:**

```bash
git checkout -b feature/add-schema-generation
git push origin feature/add-schema-generation
# Vercel에서 자동으로 preview URL 생성
# GitHub PR 코멘트에서 "Visit Preview" 링크 클릭
```

### 1.5 빌드 검증

Vercel에서 빌드 로그 확인:

```
Vercel Dashboard → Deployments 탭 → 최신 배포 선택
```

**성공 기준:**

```
✓ Build completed successfully
✓ 크기: ~1-2 MB (Next.js 최적화)
✓ 함수: ~20-30개 (API Routes + Server Actions)
```

**실패 시:**

- **TypeScript 에러**: `pnpm build` 로컬에서 실행 후 수정
- **테스트 실패**: 없음 (빌드 파이프라인에 포함 안 됨)
- **환경변수 누락**: Vercel Dashboard에서 환경변수 다시 확인

---

## Phase 2: 커스텀 도메인 연결 (필수)

### 2.1 도메인 구입

도메인 레지스트라에서 구입 (예: Namecheap, Route53, Cloudflare):

```
findably.com (또는 원하는 도메인)
```

**레지스트라 선택 가이드:**

| 서비스         | 특징                          | 비용    |
| -------------- | ----------------------------- | ------- |
| **Namecheap**  | 저렴, 관리 UI 직관적          | $8/년~  |
| **Route53**    | AWS 통합, DNS 자동화 우수     | $0.5/월 |
| **Cloudflare** | 무료 DNS, CDN 통합, DDoS 보호 | 무료~   |
| **GoDaddy**    | 초보자 친화적, 24/7 지원      | $12/년~ |

### 2.2 Vercel에 도메인 추가

#### 방법 1: Vercel DNS 사용 (권장)

```
1. Vercel Dashboard → Settings → Domains
2. "Add Domain" 클릭
3. "findably.com" 입력
4. "Add" 클릭
5. Vercel이 자동으로 DNS 레코드 생성
```

**장점:** 자동 SSL, 간편한 관리, 도메인 레지스트라에서 Nameserver만 변경

#### 방법 2: 기존 DNS 제공자 유지 (CNAME)

```
1. Vercel Dashboard → Settings → Domains
2. "findably.com" 입력 후 "Add"
3. Vercel이 제공하는 CNAME 값 복사
4. 도메인 레지스트라의 DNS 설정으로 이동
```

### 2.3 DNS 레코드 설정

#### 옵션 A: Vercel Nameserver로 변경 (권장)

도메인 레지스트라의 Nameserver 설정 변경:

```
기존 nameserver → Vercel의 nameserver로 변경:
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**단계:**

```
1. 도메인 레지스트라 대시보드 접속
2. DNS / Nameserver 설정 찾기
3. 기존 nameserver 삭제
4. Vercel nameserver 추가
5. 변경사항 저장
6. DNS 전파 대기 (5분~48시간)
```

**예시 (Namecheap):**

```
Namecheap Dashboard
→ Domain List
→ Manage (해당 도메인)
→ Nameservers
→ "Custom DNS" 선택
→ ns1.vercel-dns.com 추가
→ ns2.vercel-dns.com 추가
→ Save
```

#### 옵션 B: CNAME 레코드 추가 (기존 DNS 제공자 유지)

```
레코드 타입: CNAME
호스트명: @ (또는 www)
값: cname.vercel-dns.com
TTL: 3600 (또는 auto)
```

### 2.4 SSL 인증서 자동 발급

Vercel은 Let's Encrypt를 통해 자동으로 SSL 인증서를 발급하고 갱신합니다:

```
특징:
✓ 자동 발급 (일반적으로 10분 이내)
✓ 자동 갱신 (만료 30일 전)
✓ 와일드카드 지원 (*.findably.com)
✓ 추가 비용 없음
```

**확인 단계:**

```
1. Vercel Dashboard → Settings → Domains
2. 도메인 상태 확인 (Verifying... → Valid)
3. https://findably.com 접속
4. 브라우저 주소창의 자물쇠 아이콘 확인
```

### 2.5 DNS 전파 확인

DNS 변경사항이 전 세계에 전파되는 데 시간이 걸립니다:

```bash
# DNS 전파 상태 확인 (여러 방법)

# 방법 1: nslookup 사용
nslookup findably.com

# 방법 2: dig 사용
dig findably.com

# 방법 3: Online DNS Checker 사용
https://dnschecker.org
```

**예상 결과:**

```
findably.com → ns1.vercel-dns.com / ns2.vercel-dns.com 포인팅
```

### 2.6 환경변수 업데이트

Vercel에 배포된 애플리케이션의 환경변수 업데이트:

```
Vercel Dashboard → Settings → Environment Variables
→ NEXT_PUBLIC_APP_URL 수정
```

**변경 전:**

```
NEXT_PUBLIC_APP_URL=https://findably-production.vercel.app
```

**변경 후:**

```
NEXT_PUBLIC_APP_URL=https://findably.com
```

**적용:**

```
1. 환경변수 저장
2. Vercel Dashboard → Deployments
3. 최신 배포 우측의 "..." 클릭
4. "Redeploy" 선택
5. 재배포 완료 대기
```

### 2.7 도메인 연결 확인

#### 1단계: 기본 접근성 테스트

```bash
# HTTPS 접근 테스트
curl -I https://findably.com

# 예상 응답:
# HTTP/2 200
# content-type: text/html; charset=utf-8
```

#### 2단계: SSL 인증서 확인

```bash
# SSL 인증서 정보 확인
openssl s_client -connect findably.com:443

# 또는 온라인 도구:
# https://www.ssl-shopper.com/ssl-checker.html
```

#### 3단계: 메타데이터 확인

```
1. https://findably.com 접속
2. 브라우저 DevTools → Network 탭
3. 첫 요청 (GET /) 선택
4. Headers 탭에서 다음 확인:
   - Server: Vercel
   - X-Powered-By: Next.js
   - content-type: text/html
```

#### 4단계: SEO 검증

```
1. Google Search Console 접속
   https://search.google.com/search-console
2. 도메인 추가
3. robots.txt 확인
   https://findably.com/robots.txt
4. sitemap.xml 확인
   https://findably.com/sitemap.xml
5. 인덱싱 요청 (Google → "Request Indexing")
```

---

## Phase 3: 배포 후 검증

### 3.1 기본 기능 확인

```bash
# 1. 랜딩 페이지 접근
curl https://findably.vercel.app/
# 예상: 200 OK, HTML 콘텐츠

# 2. 헬스 체크 엔드포인트
curl https://findably.vercel.app/api/health
# 예상: {"status": "healthy", "services": {...}}

# 3. 로그인 페이지
curl https://findably.vercel.app/login
# 예상: 200 OK, login form
```

### 3.2 Lighthouse 성능 검증

```
Vercel Dashboard → Analytics (Web Vitals 탭)
또는
https://pagespeed.web.dev 에서 도메인 입력
```

**기준:**

- First Contentful Paint (FCP): < 1.5초
- Largest Contentful Paint (LCP): < 2.5초
- Cumulative Layout Shift (CLS): < 0.1
- Lighthouse Score: ≥ 80점

### 3.3 환경변수 검증

**프론트엔드에서 사용 가능:**

```javascript
// 클라이언트 컴포넌트에서만 가능
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL); // ✓ 표시됨
```

**서버 컴포넌트에서만:**

```javascript
// Server Component / API Route에서만 가능
console.log(process.env.ANTHROPIC_API_KEY); // ✓ 표시됨 (클라이언트에는 숨김)
```

### 3.4 에러 모니터링 확인

**Sentry Dashboard:**

```
1. https://sentry.io/issues/
2. findably-mvp 프로젝트 선택
3. 에러 없음 확인 또는 에러 발생 시 실시간 감지 테스트
```

**의도적 에러 테스트:**

```javascript
// src/app/test-error/page.tsx (임시)
throw new Error("Sentry test error");
```

### 3.5 사용자 분석 확인

**PostHog Dashboard:**

```
1. https://app.posthog.com/insights
2. 이벤트 트래킹 활성화 확인
3. 테스트 이벤트: signup, login, onboarding_complete
```

---

## Phase 4: n8n 배포 (크롤링 자동화)

> 자세한 가이드: [`docs/n8n-setup.md`](./n8n-setup.md) 참조

n8n은 Findably의 자동화 엔진으로, 웹사이트 크롤링과 데이터 추출을 담당합니다.

### 배포 구성

| 환경          | 대상           | 설정                   |
| ------------- | -------------- | ---------------------- |
| **로컬 개발** | Docker Compose | `docker-compose up -d` |
| **프로덕션**  | Railway        | PostgreSQL 백엔드 포함 |

### 빠른 시작

#### 로컬 개발 (Docker Compose)

```bash
# 1. Docker Compose 시작
docker-compose up -d

# 2. n8n UI 접속
# URL: http://localhost:5678
# 기본 계정: admin@example.com / your_secure_password_here

# 3. 웹훅 테스트
curl -X POST http://localhost:5678/webhook/findably-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "url": "https://example.com",
    "industry": "ecommerce",
    "company_size": "small"
  }'
```

#### 프로덕션 (Railway)

```bash
1. https://railway.app 가입
2. GitHub 연결
3. PostgreSQL 데이터베이스 추가
4. n8n Docker 이미지 배포 (Dockerfile.n8n 사용)
5. 환경변수 설정 (아래 참조)
6. Vercel의 N8N_WEBHOOK_URL 업데이트
```

### 환경변수 설정

**Vercel (프론트엔드):**

```
N8N_WEBHOOK_BASE_URL=https://findably-n8n-production.up.railway.app
N8N_WEBHOOK_URL=https://findably-n8n-production.up.railway.app/webhook/findably-crawl
```

**Railway (n8n):**

```
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=your_email@example.com
N8N_BASIC_AUTH_PASSWORD=your_secure_password (최소 16글자)
DB_TYPE=postgres
LOG_LEVEL=info
NODE_ENV=production
```

### 완전한 가이드

상세한 설정 및 문제 해결 방법은 [`docs/n8n-setup.md`](./n8n-setup.md)를 참조하세요.

---

## Branch 배포 전략

### Main 브랜치 (Production)

```
git push origin main
→ Vercel에서 자동 빌드
→ https://findably.vercel.app 배포 (또는 커스텀 도메인)
```

**검증:**

```
모든 환경변수 설정됨
Database 마이그레이션 적용됨
테스트 통과
```

### Feature 브랜치 (Preview)

```
git push origin feature/add-something
→ Vercel에서 자동 preview 빌드
→ https://findably-add-something.vercel.app
```

**사용:**

```
1. PR 생성
2. Vercel Preview URL 클릭
3. 테스트
4. 승인 후 main에 merge
```

### Staging 브랜치 (선택사항)

```
git checkout -b staging
git push origin staging
→ Vercel에서 자동 preview 배포
```

---

## 롤백 및 버전 관리

### Vercel에서 이전 버전으로 롤백

```
Vercel Dashboard → Deployments
→ 원하는 배포 선택
→ "Promote to Production" 클릭
```

### Git에서 이전 커밋으로 되돌리기

```bash
# 가장 최근 커밋 취소
git revert HEAD

# 또는 특정 커밋 상태로 복원
git reset --hard <commit-hash>
git push origin main --force

# ⚠️ --force는 위험! 팀과 상의 후 사용
```

---

## 환경별 배포 체크리스트

### Development (로컬)

- [ ] `.env.local` 파일 생성 및 환경변수 설정
- [ ] `pnpm install` 실행
- [ ] `pnpm dev` 실행 → http://localhost:3000 접근 가능
- [ ] `pnpm build` 성공
- [ ] `pnpm test` 통과

### Preview (Feature Branch)

- [ ] Feature 브랜치 생성 및 푸시
- [ ] GitHub PR 생성
- [ ] Vercel Preview URL 확인
- [ ] 기능 테스트
- [ ] 성능 지표 확인 (Lighthouse)

### Production (Main Branch)

- [ ] 모든 테스트 통과
- [ ] Code Review 완료
- [ ] PR Merge to main
- [ ] Vercel 배포 완료 (자동)
- [ ] 배포 후 검증 (Health Check, 기본 기능)
- [ ] Sentry 에러 모니터링 확인
- [ ] PostHog 분석 확인

---

## 문제 해결

### 1. 빌드 실패: "TypeScript error"

```bash
# 로컬에서 빌드 테스트
pnpm build

# 에러 메시지 확인 후 수정
# 예: Property 'xyz' does not exist
# → 해당 타입 정의 확인 및 수정
```

### 2. 환경변수 누락: "Cannot read property 'split' of undefined"

```bash
# 런타임 에러 확인:
# Vercel Dashboard → Deployments → 최신 배포 → "Logs"

# 해결:
# 1. Vercel Dashboard → Settings → Environment Variables 확인
# 2. 환경변수명 정확성 확인 (예: NEXT_PUBLIC_* vs 다른 이름)
# 3. 환경변수 재추가 후 "Redeploy" 클릭
```

### 3. Supabase 연결 실패

```bash
# 에러 메시지: "Cannot read property 'auth' of undefined"

# 확인 사항:
1. NEXT_PUBLIC_SUPABASE_URL 올바른지 확인
2. NEXT_PUBLIC_SUPABASE_ANON_KEY 올바른지 확인
3. Supabase 프로젝트가 active 상태인지 확인
4. RLS 정책이 올바르게 설정되었는지 확인
```

### 4. n8n Webhook 연결 실패

```bash
# 에러: "Failed to trigger crawling: 404"

# 확인:
1. N8N_WEBHOOK_URL이 정확한지 확인
2. n8n 서버가 실행 중인지 확인 (Railway 대시보드)
3. Webhook 경로: /webhook/findably-crawl (정확한 경로 확인)
4. n8n 방화벽 설정 확인 (공개 접근 허용)
```

### 5. SSL 인증서 에러

```bash
# HTTPS에서 접근 불가

# 해결:
1. Vercel Dashboard → Settings → Domains
2. 도메인 상태 확인 (Verifying... → Valid)
3. 10분 정도 대기 후 재시도 (인증서 발급 시간)
4. 여전히 실패 시 CNAME 레코드 재확인
```

---

## 모니터링 및 로깅

### 실시간 로그 확인

**Vercel:**

```
Vercel Dashboard → Deployments → 배포 선택 → "Logs" 탭
```

**Sentry:**

```
https://sentry.io/issues/ → findably-mvp
```

**PostHog:**

```
https://app.posthog.com/insights → 이벤트 트래킹
```

### 알림 설정

**Sentry Alert Rules:**

```
1. https://sentry.io/settings/organizations/[org]/alerts/rules/
2. "Create Alert Rule"
3. 조건: Error Count > 10 in 5 minutes
4. Action: Send email to [admin@example.com]
```

**Vercel Notifications:**

```
Vercel Dashboard → Settings → Notifications
→ Deploy 실패 시 이메일 알림
```

---

## 성능 최적화 (프로덕션)

### Image Optimization

```
✓ next/image 사용
✓ WebP 형식 우선
✓ Lazy loading 활성화
✓ 캐시 TTL: 30일
```

### Bundle 최적화

```
# 번들 크기 확인
npx next/bundle-analyzer

# 목표:
# - Main bundle: < 200KB
# - Page bundles: < 100KB
```

### API 응답 캐싱

```
vercel.json에 Cache-Control headers 설정됨:
- Static assets: 365일
- API responses: 1시간
```

---

## 보안 체크리스트

- [ ] 환경변수에 하드코딩된 시크릿 없음
- [ ] `.env.local`, `.env.production.local` git 커밋 안 함 (.gitignore 확인)
- [ ] Supabase RLS 정책 설정됨
- [ ] API Routes에 인증 검증 있음
- [ ] CORS 설정 올바름
- [ ] XSS/CSRF 보호 활성화
- [ ] 콘텐츠 보안 정책(CSP) 헤더 설정
- [ ] Sentry에서 에러 모니터링 중

---

## Reference

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment/vercel)
- [Supabase 연결 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Sentry Next.js 통합](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [PostHog 설치 가이드](https://posthog.com/docs/product-analytics/install/js)

---

## Contact & Support

배포 중 문제가 발생하면:

1. Vercel 로그 확인
2. GitHub Issues에 에러 메시지 및 스크린샷 제시
3. Sentry 대시보드에서 에러 추적
4. 팀 Slack 채널에 문의
