# n8n Setup Guide — Findably MVP

> 작성일: 2026-03-12
> n8n을 로컬 개발환경 및 Railway 프로덕션에 배포하는 완전한 가이드

---

## Overview

Findably는 n8n을 자동화 엔진으로 사용합니다:

- **용도**: 웹사이트 크롤링, 메타 데이터 추출, Schema Markup 생성
- **배포 대상**:
  - **로컬 개발**: Docker Compose (PostgreSQL 백엔드)
  - **프로덕션**: Railway (관리형 PostgreSQL)
- **웹훅**: Next.js에서 n8n 워크플로우를 HTTP POST로 트리거

---

## Part 1: 로컬 개발 환경 설정

### 1.1 Docker 설치

```bash
# macOS (Homebrew)
brew install docker
# 또는 Docker Desktop 설치: https://www.docker.com/products/docker-desktop

# Docker daemon이 실행 중인지 확인
docker --version
# Output: Docker version XX.X.X
```

### 1.2 docker-compose.yml 확인

`/docker-compose.yml`이 프로젝트 루트에 있으며, 다음을 포함합니다:

- **n8n service**: `http://localhost:5678`
- **PostgreSQL service**: `localhost:5433` (Supabase local과 충돌 방지)

### 1.3 로컬 n8n 실행

```bash
# 1. .env 파일 생성 (선택사항 - 기본값 사용 시)
# cp n8n/.env.example .env.local

# 2. Docker Compose로 시작
docker-compose up -d

# 3. 로그 확인 (n8n 초기화 대기)
docker-compose logs -f n8n

# 예상 출력:
# ... n8n ready on http://0.0.0.0:5678
```

### 1.4 n8n UI 접속

```
URL: http://localhost:5678
사용자: admin@example.com (기본값)
비밀번호: your_secure_password_here (기본값)
```

**변경하려면 docker-compose.yml에서 환경변수 편집:**

```yaml
N8N_BASIC_AUTH_USER: your_email@example.com
N8N_BASIC_AUTH_PASSWORD: your_secure_password
```

그 후 컨테이너 재시작:

```bash
docker-compose restart n8n
```

### 1.5 워크플로우 임포트

#### 자동 임포트 (권장)

```bash
# 1. n8n UI 접속: http://localhost:5678
# 2. 좌측 메뉴 → "Workflows"
# 3. "Import from file" 클릭
# 4. n8n/workflows/findably-crawl.json 선택
```

#### 수동 생성

n8n UI에서 다음 노드들을 추가:

1. **Webhook** (ID: webhook-trigger)
   - 경로: `/webhook/findably-crawl`
   - 메서드: POST
   - 응답: "First node returns data"

2. **Code** (ID: validate-input)
   ```javascript
   // 입력 검증
   const { company_id, url, industry, company_size } = $json.body;
   if (!company_id || !url || !industry || !company_size) {
     throw new Error('Missing required parameters');
   }
   return { company_id, url, industry, company_size, status: 'pending' };
   ```

3. **HTTP Request** (ID: fetch-webpage)
   - URL: `{{ $json.url }}`
   - 메서드: GET

4. **연결**: webhook-trigger → validate-input → fetch-webpage

### 1.6 웹훅 테스트

```bash
curl -X POST http://localhost:5678/webhook/findably-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "url": "https://example.com",
    "industry": "ecommerce",
    "company_size": "small"
  }'

# 예상 응답: 200 OK
```

### 1.7 로컬 개발 중단

```bash
# n8n 및 PostgreSQL 종료
docker-compose down

# 데이터 삭제 (완전 재설정)
docker-compose down -v
```

---

## Part 2: 프로덕션 배포 (Railway)

### 2.1 Railway 계정 생성

1. [railway.app](https://railway.app) 접속
2. GitHub로 로그인 (또는 이메일 가입)
3. 새 프로젝트 생성

### 2.2 PostgreSQL 데이터베이스 추가

Railway에서 관리형 PostgreSQL을 제공합니다:

```bash
# Railway 대시보드에서:
# 1. "Create" → "Database" → "PostgreSQL" 클릭
# 2. 자동으로 DB_CONNECTION_URL 생성됨

# 또는 수동으로:
# HOST: your-db.railway.internal
# PORT: 5432
# USER: postgres
# PASSWORD: (자동 생성)
# DATABASE: railway
```

### 2.3 n8n Docker 이미지 배포

#### 옵션 A: Railway CLI 사용

```bash
# 1. Railway CLI 설치
npm install -g @railway/cli

# 2. Railway 로그인
railway login

# 3. 프로젝트 링크
railway link

# 4. n8n 배포
railway up

# Dockerfile.n8n을 사용하도록 지정 (프롬프트에서)
# 또는 railway.json에서 설정
```

#### 옵션 B: Railway 웹 대시보드

```
1. Railway 대시보드 → "New Service"
2. "GitHub Repo" 선택 (Findably repo 연결)
3. 또는 "Docker Image" 선택 → "n8nio/n8n:latest" 입력
4. Environment 탭에서 변수 설정 (아래 참조)
5. Deploy 클릭
```

### 2.4 환경변수 설정 (Railway 대시보드)

Railway → 프로젝트 → Variables 탭에 추가:

```
# 보안
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=your_email@example.com
N8N_BASIC_AUTH_PASSWORD=your_very_secure_password_here (최소 12글자)

# 프로토콜
N8N_PROTOCOL=https
N8N_HOST=0.0.0.0
N8N_PORT=5678

# 환경
NODE_ENV=production
LOG_LEVEL=info

# 데이터베이스 (Railway PostgreSQL)
# DB_CONNECTION_URL은 Railway 자동 생성 (다른 서비스와 동일하면 정의 필수)
DB_TYPE=postgres
DB_POSTGRE_HOST=${{POSTGRES_HOST}}
DB_POSTGRE_PORT=${{POSTGRES_PORT}}
DB_POSTGRE_USER=${{POSTGRES_USER}}
DB_POSTGRE_PASSWORD=${{POSTGRES_PASSWORD}}
DB_POSTGRE_DATABASE=${{POSTGRES_DB}}
```

### 2.5 Webhook URL 확보

Railway 배포 완료 후:

```
1. Railway 대시보드 → n8n 서비스 → "Deployments"
2. 최신 배포의 URL 확인
   예: https://findably-n8n-production.up.railway.app

3. Webhook URL 구성:
   https://findably-n8n-production.up.railway.app/webhook/findably-crawl
```

### 2.6 Vercel에 n8n Webhook URL 설정

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables:

```
N8N_WEBHOOK_BASE_URL=https://findably-n8n-production.up.railway.app
N8N_WEBHOOK_URL=https://findably-n8n-production.up.railway.app/webhook/findably-crawl
```

### 2.7 웹훅 연결성 테스트

```bash
# Railway n8n 호출 테스트
curl -X POST https://findably-n8n-production.up.railway.app/webhook/findably-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "url": "https://example.com",
    "industry": "ecommerce",
    "company_size": "small"
  }'

# 응답 확인:
# - 200 OK: 웹훅 작동
# - 401 Unauthorized: Basic Auth 설정 확인
# - 404 Not Found: 웹훅 경로 확인
```

---

## Part 3: 워크플로우 개발

### 3.1 n8n 노드 타입

Findably에서 사용하는 주요 노드:

| 노드 | 용도 | 설정 |
|------|------|------|
| **Webhook Trigger** | n8n 워크플로우 시작 | 경로: `/webhook/findably-crawl` |
| **Code** | 데이터 검증 & 변환 | JavaScript 코드 실행 |
| **HTTP Request** | 외부 API 호출 | 메서드: GET/POST, URL: 동적 |
| **Cheerio** | HTML 파싱 | CSS 선택자로 데이터 추출 |
| **Supabase** | DB 쓰기 | 테이블: crawl_results, diagnoses |
| **Respond to Webhook** | 응답 반환 | 상태코드, JSON 바디 |

### 3.2 워크플로우 구조 (findably-crawl)

```
Webhook 수신
    ↓
입력 검증 (company_id, url, industry, company_size)
    ↓
웹사이트 크롤링 (HTTP GET)
    ↓
HTML 파싱 (메타태그, H1-H6, 링크 등)
    ↓
Schema Markup 파싱 (JSON-LD)
    ↓
PageSpeed Insights API 호출 (성능 점수)
    ↓
결과 저장 (Supabase: crawl_results 테이블)
    ↓
성공 응답 반환
```

### 3.3 디버깅

#### n8n UI에서:

1. 워크플로우 선택 → "Execute Workflow" 버튼
2. 왼쪽 패널: 각 노드의 입력/출력 확인
3. "Logs" 탭에서 에러 메시지 확인

#### CLI 로그:

```bash
# Docker 컨테이너 로그
docker-compose logs -f n8n

# 또는 Railway CLI
railway logs
```

#### 샘플 데이터 테스트:

```bash
curl -X POST http://localhost:5678/webhook/findably-crawl \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 999,
    "url": "https://www.example.com",
    "industry": "ecommerce",
    "company_size": "small"
  }'
```

---

## Part 4: 보안 및 모니터링

### 4.1 Basic Auth 보안

**로컬 개발:**
```bash
# docker-compose.yml 수정
N8N_BASIC_AUTH_USER: dev@example.com
N8N_BASIC_AUTH_PASSWORD: dev_password_123
```

**프로덕션 (Railway):**
```
N8N_BASIC_AUTH_USER: admin@findably.com
N8N_BASIC_AUTH_PASSWORD: [최소 16글자, 대문자+숫자+특수문자 포함]
```

### 4.2 API Key 관리

n8n API를 사용하려면 (Optional):

```bash
# n8n UI → Settings → API
# 새 API Key 생성 후 Vercel 환경변수에 추가
N8N_API_KEY=key_xxx
```

### 4.3 헬스 체크

```bash
# n8n 상태 확인
curl http://localhost:5678/api/v1/health

# 또는 Railway
curl https://findably-n8n-production.up.railway.app/api/v1/health

# 응답: { "status": "up" }
```

### 4.4 모니터링

#### 실행 로그:

n8n UI → "Executions" 탭에서 모든 워크플로우 실행 기록 확인

#### 에러 알림:

1. n8n → Workflow settings → Error handling
2. "On Error" → 이메일 또는 Slack 알림 설정

#### Sentry 통합 (선택사항):

Findably Next.js 앱에서 n8n 호출 실패는 자동으로 Sentry에 기록됨.

---

## Part 5: 문제 해결

### 문제: "Cannot connect to database"

```bash
# PostgreSQL이 실행 중인지 확인
docker ps | grep postgres

# 만약 실행 안 됨:
docker-compose up postgres -d

# 연결 문자열 확인
docker-compose logs postgres
```

### 문제: "Webhook returns 401 Unauthorized"

```
원인: Basic Auth 자격증명 없음

해결:
1. n8n UI에서 수동 로그인
2. 또는 curl에 -u 옵션 추가:
   curl -u admin@example.com:password ...
```

### 문제: "Cannot reach n8n webhook from Vercel"

```
원인: Railway n8n이 아직 배포 중이거나 URL이 잘못됨

확인:
1. Railway 대시보드에서 배포 완료 확인
2. Vercel에서 N8N_WEBHOOK_URL 재확인
3. curl로 웹훅 수동 테스트 (위 참조)
4. Railway 또는 Vercel 로그 확인
```

### 문제: "Workflow execution timeout"

```
원인: 크롤링이 너무 오래 걸림

해결:
1. 웹사이트가 너무 큼 → timeout 증가
2. 네트워크 느림 → 재시도 정책 추가
3. n8n Code 노드에서:

   const response = await fetch(url, {
     timeout: 10000  // 10초
   });
```

---

## Part 6: 워크플로우 내보내기/공유

### 내보내기:

```bash
# n8n UI → Workflows → findably-crawl
# "Download" 클릭 → JSON 파일 저장
# → n8n/workflows/ 폴더에 저장
```

### 임포트:

```bash
# n8n UI → Workflows → "Import from file"
# 또는 프로그래밍 방식:
# n8n API를 통해 자동 배포 가능
```

---

## Reference

- [n8n 공식 문서](https://docs.n8n.io/)
- [n8n Docker](https://docs.n8n.io/hosting/installation/docker/)
- [n8n Webhooks](https://docs.n8n.io/nodes/n8n-nodes-base.webhook/)
- [Railway 배포](https://docs.railway.app/)
- [Findably Architecture](./architecture.md)
- [Deployment Guide](./deployment.md)

---

## Next Steps

- [ ] 로컬 docker-compose 실행 후 웹훅 테스트
- [ ] findably-crawl 워크플로우 커스터마이징
- [ ] Railway PostgreSQL 연결 테스트
- [ ] Railway 배포 및 프로덕션 웹훅 확인
- [ ] Sentry 에러 모니터링 통합
