# Requirements Document

## Project Description (Input)
Findably - URL만 넣으면 AI가 마케팅 전체를 진단하고 실행까지 자동으로 해주는 올인원 마케팅 자동화 SaaS. 스타트업 대표가 URL과 간편 설문에 답하면, 크롤링→진단(SEO/GEO/콘텐츠)→실행(Schema Markup/메타태그 최적화)→대시보드까지 원스톱 제공. 기술스택: Next.js 15 + Supabase + Drizzle ORM + Claude API + n8n + Playwright. MVP 범위: 온보딩→크롤링→진단→실행→대시보드 (7 Epic, 30 Task)

## Introduction

Findably는 스타트업 대표가 URL 하나만 입력하면 AI가 마케팅 진단과 실행을 자동으로 해주는 올인원 마케팅 자동화 SaaS입니다.

**목표 사용자**: 온라인 매출에 의존하는 소규모 비즈니스 운영자 (자사몰, 스타트업)

**MVP 범위**: 온보딩 → 크롤링 → 진단 → 실행 → 대시보드까지 완전한 사용자 여정 자동화

**기술 기반**: Next.js 15 + Supabase + Claude API + n8n + Playwright 기반의 풀스택 자동화

**보안 분류**: 🟡 중간 (외부 API 연동, 고객 비공개 데이터 처리. MVP에서는 결제 제외)

---

## Requirements

### Requirement 1: 사용자 인증 및 계정 관리

**Objective:** 스타트업 대표로서, 이메일 또는 Google OAuth로 빠르게 가입/로그인하고 싶으므로, 별도의 인증 시스템 구축 비용을 아울 수 있습니다.

#### Acceptance Criteria
1. When 사용자가 회원가입 페이지에 접근, Findably 인증 시스템은 이메일 입력 필드 + 비밀번호 필드 + Google OAuth 버튼을 표시해야 합니다.
2. When 사용자가 이메일과 비밀번호를 입력 후 '회원가입' 버튼 클릭, Findably 인증 시스템은 Supabase Auth를 통해 계정을 생성하고 인증 이메일을 발송해야 합니다.
3. When 사용자가 Google OAuth 버튼 클릭, Findably 인증 시스템은 Google 계정으로 로그인하고 자동으로 사용자 계정을 생성 또는 매핑해야 합니다.
4. If 사용자가 인증 이메일 링크를 클릭하지 않은 경우, Findably 인증 시스템은 로그인 시도 시 "이메일 인증이 필요합니다" 메시지를 표시해야 합니다.
5. When 사용자가 로그인 페이지에서 이메일과 비밀번호 입력 후 로그인, Findably 인증 시스템은 JWT 토큰을 발급하고 대시보드로 리디렉트해야 합니다.
6. If 사용자가 존재하지 않는 이메일로 로그인 시도, Findably 인증 시스템은 "등록되지 않은 이메일입니다" 메시지를 표시해야 합니다.
7. The Findably 인증 시스템은 모든 인증 관련 민감 정보(비밀번호, 토큰)를 환경변수에서만 관리하고 하드코딩하면 안 됩니다.

---

### Requirement 2: 데이터베이스 스키마 설계

**Objective:** 데이터 엔지니어로서, 중앙화된 DB 스키마를 설정하고 싶으므로, 크롤링, 진단, 실행 결과를 일관성 있게 저장할 수 있습니다.

#### Acceptance Criteria
1. The Findably DB 스키마는 다음 테이블을 포함해야 합니다: `companies` (사용자가 추가한 웹사이트), `crawl_results` (크롤링 데이터), `diagnoses` (진단 점수 및 분석), `action_items` (개선 항목), `generated_assets` (생성된 Schema Markup, 메타 태그).
2. When Findably가 새 사용자를 생성, 데이터베이스는 자동으로 `companies` 테이블에 user_id FK를 갖는 행을 준비해야 합니다.
3. When 크롤링 엔진이 데이터를 반환, Findably DB는 `crawl_results` 테이블에 크롤링 타임스탬프, 크롤링 상태 (완료/실패), 원본 HTML, 파싱된 메타 데이터를 저장해야 합니다.
4. While 크롤링이 진행 중, Findably는 company_id별로 RLS(Row Level Security)를 적용하여 사용자가 자신의 데이터만 조회하도록 강제해야 합니다.
5. When 진단 엔진이 점수를 계산, Findably DB는 `diagnoses` 테이블에 SEO 점수, GEO 점수, 콘텐츠 점수, 종합 점수, 등급(A/B/C/D/F), 생성 타임스탬프를 저장해야 합니다.
6. The Findably DB 스키마의 모든 사용자 관련 행에는 회사(company) 기준 Supabase RLS 정책이 적용되어야 합니다.

---

### Requirement 3: 기본 레이아웃 및 라우팅 구조

**Objective:** UX 디자이너로서, 일관된 네비게이션 구조를 원하므로, 사용자가 혼동 없이 각 페이지를 이동할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 다음 라우팅 구조를 제공해야 합니다: `/` (랜딩), `/(auth)/login`, `/(auth)/signup`, `/onboarding`, `/dashboard`, `/dashboard/[company_id]`.
2. When 비인증 사용자가 `/dashboard`에 접근, Findably는 `/login`으로 리디렉트해야 합니다.
3. When 인증된 사용자가 `/onboarding`을 완료, Findably는 `/dashboard`로 자동 리디렉트해야 합니다.
4. The Findably 레이아웃은 모든 인증된 페이지에 헤더(로고, 사용자 메뉴, 로그아웃 버튼) + 사이드바/탭 네비게이션을 포함해야 합니다.
5. When 사용자가 로그아웃 버튼 클릭, Findably는 세션을 삭제하고 `/` (랜딩 페이지)로 리디렉트해야 합니다.
6. The Findably는 Next.js 15 App Router를 사용하고 모든 라우팅 로직은 `src/app/` 디렉토리에만 위치해야 합니다.

---

### Requirement 4: 랜딩 페이지 구현

**Objective:** 마케팅 담당자로서, 랜딩 페이지가 제품 가치를 3초 안에 전달하기를 원하므로, 방문자가 회원가입/로그인으로 전환됩니다.

#### Acceptance Criteria
1. The Findably 랜딩 페이지는 히어로 섹션(제목, 부제목, CTA 버튼 2개), Social Proof, 핵심 기능 3개 카드, 사용 방법 3단계, FAQ, CTA 섹션을 포함해야 합니다.
2. When 랜딩 페이지가 로드, Findably는 모든 섹션을 순차 등장 애니메이션(0.1초 간격)으로 표시해야 합니다.
3. The Findably 랜딩 페이지의 CTA 버튼("지금 시작하기", "데모 보기")은 모두 `(auth)/signup` 또는 `/onboarding`으로 링크되어야 합니다.
4. When 사용자가 "지금 시작하기" 버튼 클릭, Findably는 `/signup`으로 이동해야 합니다.
5. The Findably 랜딩 페이지는 모바일(≤480px) / 태블릿(≤768px) / 데스크톱(≥1024px) 모두에서 반응형으로 렌더링되어야 합니다.
6. The Findably 랜딩 페이지는 배경에 미세 도트 패턴 또는 brand-color 블롭을 포함하여 시각적 분위기를 조성해야 합니다.

---

### Requirement 5: 회원가입 및 로그인 페이지

**Objective:** 새로운 사용자로서, 5분 안에 가입 후 서비스를 사용하고 싶으므로, 복잡한 설정 없이 바로 시작할 수 있습니다.

#### Acceptance Criteria
1. When 사용자가 `/(auth)/signup` 페이지에 접근, Findably는 이메일 입력, 비밀번호 입력, 비밀번호 확인, 약관 동의 체크박스, "회원가입" 버튼을 표시해야 합니다.
2. When 사용자가 Google OAuth 버튼 클릭, Findably는 Google 로그인 창을 팝업하고 성공 후 `/onboarding`으로 리디렉트해야 합니다.
3. If 사용자가 존재하는 이메일로 회원가입 시도, Findably는 "이미 등록된 이메일입니다" 메시지를 표시해야 합니다.
4. If 비밀번호가 8글자 미만이거나 특수문자/숫자 없음, Findably는 "비밀번호는 8글자 이상이며 특수문자와 숫자를 포함해야 합니다" 메시지를 표시해야 합니다.
5. When 로그인 페이지에서 사용자가 이메일과 비밀번호 입력 후 "로그인" 버튼 클릭, Findably는 인증 후 JWT 토큰 발급 및 `/onboarding` 또는 `/dashboard`로 리디렉트해야 합니다.
6. If 사용자가 로그인 시 잘못된 비밀번호 입력, Findably는 "이메일 또는 비밀번호가 일치하지 않습니다" 메시지를 표시해야 합니다.
7. The Findably 회원가입/로그인 페이지는 이메일 형식, 비밀번호 강도, 필수 필드를 클라이언트 사이드에서 Zod 스키마로 검증해야 합니다.

---

### Requirement 6: 온보딩 플로우 (Step 1-3)

**Objective:** 새로운 사용자로서, 3가지 간단한 질문과 URL 하나로 진단을 시작하고 싶으므로, 3분 안에 첫 결과를 볼 수 있습니다.

#### Acceptance Criteria
1. When 사용자가 `/onboarding`에 진입, Findably는 Step 1 (URL 입력) 페이지를 표시해야 합니다.
2. When 사용자가 Step 1에서 유효한 URL (https://example.com 형식)을 입력 후 "다음" 버튼 클릭, Findably는 Step 2 (업종 선택)로 이동해야 합니다.
3. If 사용자가 유효하지 않은 URL 입력, Findably는 "올바른 URL을 입력하세요 (예: https://example.com)" 메시지를 표시해야 합니다.
4. When 사용자가 Step 2에서 업종(예: 전자상거래, 서비스, 블로그) 선택 후 "다음" 클릭, Findably는 Step 3 (회사 규모)으로 이동해야 합니다.
5. When 사용자가 Step 3에서 회사 규모(1인, 소규모 2-10명, 중규모 11-50명) 선택 후 "시작하기" 버튼 클릭, Findably는 크롤링을 트리거하고 "진단 중..." 로딩 페이지를 표시해야 합니다.
6. The Findably 온보딩 데이터 (URL, 업종, 회사 규모)는 `companies` 테이블에 저장되어야 합니다.
7. While 온보딩이 진행 중, Findably는 진행 표시(Step 1/3, 2/3, 3/3)를 상단에 표시해야 합니다.

---

### Requirement 7: 크롤링 트리거 API

**Objective:** 온보딩 시스템으로서, 사용자가 "시작하기"를 누르면 자동으로 크롤링을 시작하고 싶으므로, 수동 개입 없이 진단을 수행합니다.

#### Acceptance Criteria
1. When 사용자가 온보딩 Step 3를 완료, Findably 백엔드는 n8n 웹훅 (http://n8n-server/webhook/findably-crawl)을 호출하고 company_id와 URL을 전달해야 합니다.
2. When n8n 웹훅이 호출되었으나 URL이 비어있거나 유효하지 않음, Findably는 n8n에서 에러를 반환하고 `crawl_results` 테이블에 상태를 "failed_invalid_url"로 저장해야 합니다.
3. While n8n 크롤링이 진행 중 (타임아웃 300초), Findably 프론트엔드는 로딩 상태를 표시하고 폴링 또는 WebSocket으로 진행 상황을 모니터링해야 합니다.
4. When n8n 크롤링이 완료, Findably는 크롤링 결과(파싱된 메타 데이터, HTML, 스크린샷)를 `crawl_results` 테이블에 저장해야 합니다.
5. If n8n 크롤링이 타임아웃(300초 초과), Findably는 크롤링 상태를 "failed_timeout"으로 저장하고 프론트엔드에 "크롤링이 실패했습니다. 잠시 후 다시 시도하세요" 메시지를 표시해야 합니다.
6. The Findably 크롤링 API는 .env.local의 N8N_WEBHOOK_URL을 사용해야 하고 하드코딩하면 안 됩니다.

---

### Requirement 8: n8n 크롤링 워크플로우 설계

**Objective:** 크롤링 엔진으로서, n8n 워크플로우를 구성하고 싶으므로, 다양한 웹사이트 유형(SPA, 정적, CMS)을 일관되게 처리할 수 있습니다.

#### Acceptance Criteria
1. The n8n 크롤링 워크플로우는 다음 단계를 포함해야 합니다: Webhook 수신 → Playwright 크롤링 → HTML 파싱 → Schema 파싱 → 성능 데이터 수집 → Supabase 저장.
2. When n8n Webhook이 트리거 (company_id, URL), Playwright는 주어진 URL을 headless 브라우저로 열고 3초 대기 후 전체 HTML을 캡처해야 합니다.
3. If Playwright 크롤링 중 네트워크 오류 발생 (타임아웃, 404, 500), n8n은 에러를 로깅하고 Supabase에 상태 "failed_network"를 저장해야 합니다.
4. While HTML 파싱이 진행 중, n8n은 메타 태그 (title, description, og:image, og:type, canonical), H1-H3 태그, 이미지, 내부/외부 링크 수를 추출해야 합니다.
5. The n8n 워크플로우는 모든 크롤링 결과에 타임스탬프, 크롤링 상태, company_id를 포함하여 Supabase에 저장해야 합니다.
6. Where Schema.org 마크업이 포함된 경우, n8n은 JSON-LD 스크립트를 파싱하여 별도 필드에 저장해야 합니다.

---

### Requirement 9: HTML 파서 (메타 태그, H태그, 링크)

**Objective:** 데이터 추출 엔진으로서, HTML에서 핵심 SEO 요소를 정확히 파싱하고 싶으므로, 진단 엔진이 신뢰할 수 있는 데이터를 받습니다.

#### Acceptance Criteria
1. The Findably HTML 파서는 메타 태그(title, description, charset, viewport, og:*, twitter:*) 추출 시 모든 문자 인코딩(UTF-8, EUC-KR 등)을 올바르게 처리해야 합니다.
2. When HTML 파서가 h1, h2, h3 태그 추출, 각 태그의 텍스트 콘텐츠 및 깊이(level)를 구조화된 배열로 저장해야 합니다.
3. If 웹사이트에 title 또는 meta description이 없음, Findably는 "누락" 상태를 명시적으로 기록하고 진단 시 감점 대상으로 표시해야 합니다.
4. The Findably HTML 파서는 모든 <a> 태그의 href를 추출하고, 내부 링크(같은 도메인), 외부 링크(다른 도메인), 깨진 링크(404)로 분류해야 합니다.
5. When HTML에 이미지(<img>) 태그 존재, Findably는 src, alt 텍스트 여부, width/height 속성 여부를 기록해야 합니다.
6. The Findably 파서는 HTML을 DOM 파싱 라이브러리(cheerio 또는 jsdom)를 사용해야 합니다.

---

### Requirement 10: Schema.org 마크업 파서

**Objective:** 구조화 데이터 분석가로서, 웹사이트의 Schema.org 마크업을 감지하고 싶으므로, GEO(Generative Engine Optimization) 준비도를 정확히 평가합니다.

#### Acceptance Criteria
1. When HTML에 JSON-LD 형식의 Schema.org 마크업 포함, Findably 파서는 @type, @context, 핵심 속성(name, description, url, image, aggregateRating 등)을 파싱해야 합니다.
2. The Findably 파서는 다음 Schema 유형을 인식해야 합니다: Product, LocalBusiness, Organization, BlogPosting, FAQPage, BreadcrumbList.
3. If HTML에 Schema.org 마크업이 없음, Findably는 상태를 "no_schema" 또는 "missing"으로 기록해야 합니다.
4. When Microdata 형식의 Schema (itemscope, itemtype, itemprop) 감지, Findably 파서는 이를 JSON 구조로 변환하여 저장해야 합니다.
5. The Findably 파서는 파싱된 모든 Schema를 `crawl_results` 테이블의 `schema_markup` 필드에 JSON 형식으로 저장해야 합니다.

---

### Requirement 11: 사이트맵 및 robots.txt 파서

**Objective:** SEO 분석가로서, 웹사이트의 크롤 접근성을 평가하고 싶으므로, 검색 엔진 친화성을 정량화할 수 있습니다.

#### Acceptance Criteria
1. When n8n 크롤링 시 `/robots.txt` 파일 요청, Findably는 Disallow, Allow, User-agent, Crawl-delay 규칙을 파싱해야 합니다.
2. If `/robots.txt` 파일이 없거나 404 반환, Findably는 상태를 "not_found"로 기록하고 "robots.txt 없음 (기본: 모두 크롤 가능)" 메모를 남겨야 합니다.
3. When `sitemap.xml` 파일 요청, Findably는 <loc>, <lastmod>, <changefreq>, <priority> 요소를 파싱하여 URL 개수와 마지막 업데이트 시간을 기록해야 합니다.
4. If `/sitemap.xml` 파일이 없음, Findably는 `robots.txt`의 Sitemap 지시문을 확인하고 지정된 경로에서 사이트맵 검색해야 합니다.
5. The Findably는 파싱된 사이트맵 정보(URL 개수, 마지막 업데이트)를 `crawl_results` 테이블에 저장해야 합니다.

---

### Requirement 12: PageSpeed Insights API 연동

**Objective:** 성능 분석가로서, PageSpeed Insights 데이터를 자동으로 수집하고 싶으므로, 성능 점수를 진단에 포함할 수 있습니다.

#### Acceptance Criteria
1. When n8n 크롤링 중 모든 URL에 대해 Google PageSpeed Insights API를 호출, Findably는 모바일 및 데스크톱 점수(0-100)를 각각 기록해야 합니다.
2. If PageSpeed Insights API 호출 실패 (quota 초과, 네트워크 오류), Findably는 에러를 로깅하고 점수를 null로 저장하며 진단 시 "데이터 미수집" 상태로 표시해야 합니다.
3. When PageSpeed 점수 수집 완료, Findably는 Core Web Vitals (LCP, FID, CLS) 데이터도 함께 저장해야 합니다.
4. The Findably는 PageSpeed Insights API 키를 .env.local (GOOGLE_PAGESPEED_API_KEY)에서 로드해야 합니다.
5. The Findably는 PageSpeed 점수를 `crawl_results` 테이블의 `performance_metrics` 필드에 JSON 형식으로 저장해야 합니다.

---

### Requirement 13: 크롤링 결과 데이터베이스 저장

**Objective:** 데이터 파이프라인으로서, 크롤링 결과를 안전하고 일관되게 저장하고 싶으므로, 다음 단계(진단)에서 신뢰할 수 있는 데이터를 활용합니다.

#### Acceptance Criteria
1. When n8n 크롤링이 완료, Findably는 다음 데이터를 `crawl_results` 테이블에 저장해야 합니다: company_id, crawled_at, status (success/failed_*), raw_html, meta_tags (JSON), headings (JSON), schema_markup (JSON), performance_metrics (JSON), robots_txt (text), sitemap_info (JSON).
2. The Findably는 원본 HTML을 최대 5MB까지 저장해야 하며, 초과 시 "html_truncated" 플래그를 설정해야 합니다.
3. If 동일 company_id에 대해 재크롤링 발생, Findably는 새 행을 추가하고 이전 행의 `is_latest` 플래그를 false로 업데이트해야 합니다.
4. While 데이터 저장이 진행 중, Findably는 transaction을 사용하여 부분 저장 상태를 방지해야 합니다.
5. The Findably는 모든 크롤링 결과에 대해 company_id 기반 RLS를 적용해야 합니다.

---

### Requirement 14: SEO 점수 산출 로직

**Objective:** SEO 분석가로서, 규칙 기반의 SEO 점수를 산출하고 싶으므로, 객관적이고 재현 가능한 평가 기준을 제공합니다.

#### Acceptance Criteria
1. The Findably SEO 점수는 다음 항목의 가중치 합계로 산출되어야 합니다:
   - Title 태그 존재 및 길이(50-60자): 20점
   - Meta Description 존재 및 길이(120-160자): 20점
   - H1 태그 1개 존재: 15점
   - 모바일 반응형(viewport 메타 태그): 15점
   - 내부 링크 구조(깊이 ≤3): 15점
   - 사이트맵 존재: 10점
   - robots.txt 존재: 5점
   - 총합: 100점

2. When SEO 점수 산출 시 각 항목이 기준을 충족하지 못하면, 해당 항목 점수를 0으로 계산해야 합니다.

3. The Findably SEO 점수 산출 로직은 `src/lib/scoring/seo-scorer.ts` 파일에 구현되어야 합니다.

4. When 진단 기록 생성, Findably는 SEO 점수와 함께 상세 항목별 점수, 부족한 항목 목록을 `diagnoses` 테이블에 저장해야 합니다.

---

### Requirement 15: GEO(Generative Engine Optimization) 준비도 점수 산출

**Objective:** GEO 전문가로서, AI 검색 엔진 최적화 준비 정도를 평가하고 싶으므로, 새로운 검색 트렌드에 대한 준비 상태를 명확히 합니다.

#### Acceptance Criteria
1. The Findably GEO 점수는 다음 항목의 가중치 합계로 산출되어야 합니다:
   - Schema.org 마크업 존재(최소 1개 유형): 30점
   - 구조화된 데이터(Product/Organization/LocalBusiness): 20점
   - FAQ 페이지 Schema: 15점
   - 콘텐츠 길이(≥500자): 15점
   - 이미지 최적화(alt 텍스트, 형식): 15점
   - E-E-A-T 신호(저자, 출판일, 저자 소개): 5점
   - 총합: 100점

2. When GEO 점수 산출 시, 각 항목이 기준을 충족하지 못하면 해당 항목 점수를 0으로 계산해야 합니다.

3. The Findably GEO 점수 산출 로직은 `src/lib/scoring/geo-scorer.ts` 파일에 구현되어야 합니다.

4. When 진단 기록 생성, Findably는 GEO 점수와 함께 상세 항목별 점수, 개선 우선순위를 `diagnoses` 테이블에 저장해야 합니다.

---

### Requirement 16: Claude API 연동 (콘텐츠 분석 및 인사이트)

**Objective:** AI 분석가로서, Claude API로 콘텐츠를 분석하고 싶으므로, 단순 점수 계산을 넘어 맞춤형 인사이트를 제공합니다.

#### Acceptance Criteria
1. When 크롤링 데이터가 준비되면, Findably는 Claude API (Sonnet)를 호출하여 다음 항목을 분석해야 합니다: 콘텐츠 품질 및 명확성, 타겟 키워드 밀도, 경쟁사 대비 독창성, 추천 개선 사항 3가지.

2. The Findably는 Claude 프롬프트에 다음 정보를 전달해야 합니다: 크롤링된 title, description, h1-h3 태그, 본문 텍스트(첫 2000자), meta keywords(있으면), 업종/카테고리.

3. If Claude API 호출 실패 (인증 오류, 토큰 초과), Findably는 에러를 로깅하고 프론트엔드에 "AI 분석이 일시적으로 불가능합니다" 메시지를 표시해야 합니다.

4. When Claude 분석 완료, Findably는 응답을 파싱하여 `diagnoses` 테이블의 `ai_insights` 필드에 JSON 형식으로 저장해야 합니다.

5. The Findably는 Claude API 키를 .env.local (ANTHROPIC_API_KEY)에서 로드해야 합니다.

6. The Findably Claude 분석 호출은 `src/lib/ai/claude-analyzer.ts` 파일에서 관리되어야 합니다.

---

### Requirement 17: 종합 점수 산출 및 등급 부여

**Objective:** 점수 집계 엔진으로서, SEO, GEO, 성능을 통합하고 싶으므로, 사용자가 한눈에 마케팅 건강도를 파악합니다.

#### Acceptance Criteria
1. The Findably 종합 점수는 다음 공식으로 계산되어야 합니다:
   - 종합 점수 = (SEO 점수 × 0.35) + (GEO 점수 × 0.35) + (성능 점수 × 0.2) + (AI 점수 × 0.1)

2. When 종합 점수 계산 완료, Findably는 다음 등급을 부여해야 합니다:
   - A: 85-100점
   - B: 70-84점
   - C: 55-69점
   - D: 40-54점
   - F: 0-39점

3. The Findably는 종합 점수, 등급, 각 항목별 세부 점수(SEO/GEO/성능/AI)를 `diagnoses` 테이블에 저장해야 합니다.

4. When 진단이 완료, Findably는 사용자에게 "귀사 마케팅 건강도: A등급 (87점)" 형태로 표시해야 합니다.

---

### Requirement 18: Quick Win 자동 식별 로직

**Objective:** 실행 엔진으로서, 즉시 실행 가능한 개선 항목(Quick Win)을 자동으로 식별하고 싶으므로, 사용자가 빠르게 가시적 결과를 볼 수 있습니다.

#### Acceptance Criteria
1. The Findably Quick Win은 다음 조건을 충족해야 합니다:
   - 구현 시간 ≤ 1시간
   - 기술 복잡도 낮음 (코딩 불필요 또는 복사-붙여넣기)
   - 예상 효과: SEO/GEO 점수 +5점 이상

2. When 크롤링 데이터 분석, Findably는 다음을 Quick Win으로 식별해야 합니다:
   - Title 태그 누락 → 추천 title 제공
   - Meta Description 누락 → 추천 description 제공
   - H1 태그 누락 → H1 추가 권고
   - Schema.org 마크업 전혀 없음 → 기본 Organization Schema 제공
   - 이미지 alt 텍스트 누락 → 수정 목록 제공

3. The Findably는 각 Quick Win에 우선순위(높음/중간/낮음)를 부여하고 SEO 점수 예상 증가분을 표시해야 합니다.

4. When Quick Win 목록 생성, Findably는 `action_items` 테이블에 item_type (quick_win/standard/long_term), priority, expected_impact_score, description을 저장해야 합니다.

---

### Requirement 19: 종합 진단 결과 생성 및 저장

**Objective:** 진단 시스템으로서, 모든 분석 결과를 통합하고 싶으므로, 대시보드에서 일관된 데이터를 표시할 수 있습니다.

#### Acceptance Criteria
1. When 모든 분석(SEO, GEO, 성능, AI, Quick Win)이 완료, Findably는 `diagnoses` 테이블에 다음 정보를 저장해야 합니다: company_id, crawl_result_id, diagnosed_at, seo_score, geo_score, performance_score, overall_score, grade, ai_insights (JSON), quick_wins (JSON), action_items (JSON).

2. The Findably는 동일 company_id에 대해 재진단 발생 시 새 행을 추가하고 이전 행의 `is_latest` 플래그를 false로 업데이트해야 합니다.

3. While 진단이 진행 중, Findably 프론트엔드는 "진단 중... (SEO 분석 30%, GEO 분석 60%, ...)" 형태의 진행 상황을 표시해야 합니다.

4. If 진단 중 특정 단계 실패 (예: Claude API 오류), Findably는 해당 항목을 "데이터 수집 실패"로 표시하고 다른 항목은 계속 진행해야 합니다.

5. The Findably는 진단 결과에 대해 company_id 기반 RLS를 적용해야 합니다.

---

### Requirement 20: Schema Markup (JSON-LD) 자동 생성 로직

**Objective:** 구조화 데이터 생성기로서, 자동으로 Schema 마크업을 생성하고 싶으므로, 사용자가 복사-붙여넣기만으로 적용할 수 있습니다.

#### Acceptance Criteria
1. When 진단 완료, Findably는 웹사이트의 업종과 크롤링된 정보를 기반으로 다음 Schema 유형을 생성해야 합니다:
   - 모든 사이트: Organization Schema (회사명, 로고, 연락처)
   - 전자상거래: Product Schema (상품명, 가격, 리뷰)
   - 블로그/뉴스: BlogPosting Schema (제목, 저자, 발행일)
   - 로컬 비즈니스: LocalBusiness Schema (주소, 영업시간, 연락처)

2. The Findably 생성된 Schema는 JSON-LD 형식이어야 하고, 다음 구조를 포함해야 합니다:
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Organization",
     "name": "회사명",
     "url": "https://example.com",
     "logo": "https://example.com/logo.png",
     "description": "회사 설명",
     "contactPoint": {
       "@type": "ContactPoint",
       "telephone": "+82-...",
       "contactType": "Customer Service"
     }
   }
   ```

3. When Schema 생성 시, Findably는 크롤링된 데이터를 자동으로 필드에 매핑해야 합니다 (예: og:image → logo, meta description → description).

4. If 필수 정보(예: 회사명)가 없음, Findably는 사용자 입력 필드를 프롬프트해야 합니다.

5. The Findably는 생성된 Schema를 `generated_assets` 테이블에 저장해야 합니다.

---

### Requirement 21: 메타 태그 최적화안 생성 (Claude API 기반)

**Objective:** 메타 태그 최적화 전문가로서, AI가 맞춤형 메타 태그 개선안을 생성하고 싶으므로, 사용자는 가이드에 따라 즉시 적용할 수 있습니다.

#### Acceptance Criteria
1. When 진단 완료, Findably는 Claude API를 호출하여 다음 메타 태그 최적화안을 생성해야 합니다:
   - 현재 Title → 추천 Title (50-60자, 키워드 포함)
   - 현재 Description → 추천 Description (120-160자, 호출-to-action 포함)
   - 추천 OG Tags (og:title, og:description, og:image, og:type)
   - 추천 Twitter Card Tags (twitter:title, twitter:description, twitter:image)

2. The Findably는 Claude 프롬프트에 다음을 포함해야 합니다: 업종, 현재 title/description, 크롤링된 키워드, 타겟 고객층.

3. When 메타 태그 최적화안 생성 시, Findably는 각 태그에 대해 "현재값 → 추천값" 비교와 개선 이유(예: "키워드 '전자상거래' 추가, CTR 예상 +15%")를 포함해야 합니다.

4. The Findably는 생성된 메타 태그를 HTML 코드 스니펫 형태로 제공해야 합니다 (복사 버튼 포함).

5. The Findably는 메타 태그 최적화안을 `generated_assets` 테이블에 저장해야 합니다.

---

### Requirement 22: 개선 항목 우선순위 매트릭스

**Objective:** 개선 우선순위 엔진으로서, 모든 개선 항목을 우선순위순으로 정렬하고 싶으므로, 사용자가 효율적으로 실행할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 모든 `action_items` (Quick Win, 표준, 장기)를 다음 기준으로 정렬해야 합니다:
   - **영향도** (Impact): SEO/GEO 점수 증가분 (높음/중간/낮음)
   - **난이도** (Effort): 구현 시간 및 기술 복잡도 (낮음/중간/높음)
   - **우선순위**: (Impact 높음 × Effort 낮음) > (Impact 높음 × Effort 높음) > (Impact 중간 × Effort 낮음)

2. When 우선순위 결정 시, Findably는 우선순위 점수를 계산해야 합니다: 우선순위 점수 = (Impact 수치) / (1 + Effort 수치).

3. The Findably 대시보드는 우선순위순으로 정렬된 action_items를 "할 일" 리스트 형태로 표시해야 합니다.

4. When 사용자가 특정 action_item을 완료 표시, Findably는 상태를 "completed"로 업데이트하고 진단 점수를 재계산해야 합니다(선택 사항).

---

### Requirement 23: CMS 감지 및 적용 가이드

**Objective:** CMS 지원 엔진으로서, 웹사이트 CMS를 자동으로 감지하고 싶으므로, 사용자에게 CMS별 맞춤 가이드를 제공할 수 있습니다.

#### Acceptance Criteria
1. When 크롤링 시 다음 CMS를 감지해야 합니다: WordPress, Shopify, WIX, 카페24, 고도몰, 아임웹, Blogger, Medium, 그 외 감지 불가.

2. The Findably는 다음 신호로 CMS를 식별해야 합니다:
   - Meta Generator 태그 (예: <meta name="generator" content="WordPress 6.0">)
   - 스크립트 경로 (예: /wp-content/, /cdn/shop/, /_nuxt/)
   - 특정 클래스/ID 패턴 (예: .wp-content, #wix-container)

3. When CMS 감지 완료, Findably는 `crawl_results` 테이블의 `detected_cms` 필드에 저장해야 합니다.

4. The Findably는 다음 CMS별 적용 가이드를 `src/lib/cms-guides/` 디렉토리에 텍스트로 저장해야 합니다:
   - WordPress: Theme 설정 → SEO 플러그인(Yoast) 권장
   - Shopify: 테마 편집기 → Meta 태그 영역 위치
   - WIX: 고급 SEO → 마크업 추가 위치
   - 카페24/고도몰: 상품 정보 → 메타 태그 입력 필드

5. When 대시보드 표시, Findably는 감지된 CMS의 적용 가이드를 "CMS별 적용 방법" 섹션에 표시해야 합니다.

---

### Requirement 24: 종합 점수 대시보드 (Circular Progress + Category Breakdown)

**Objective:** 대시보드 설계자로서, 사용자가 종합 점수를 직관적으로 이해하고 싶으므로, 시각적으로 마케팅 건강도를 한눈에 파악합니다.

#### Acceptance Criteria
1. The Findably 대시보드 상단에는 다음 요소를 포함해야 합니다:
   - 중앙 원형 차트: 종합 점수(0-100), 등급(A/B/C/D/F), 색상(Green A/Yellow B/Orange C/Red D-F)
   - 부제목: "귀사 마케팅 건강도: A등급 (87점) 🎉"
   - 진단 타임스탬프: "2026-03-11 11:30 기준"

2. When 대시보드 로드, Findably는 점수를 0에서 실제 점수까지 1초 동안 애니메이션으로 표시해야 합니다.

3. The Findably는 종합 점수 아래 카테고리별 점수를 4개 가로 카드로 표시해야 합니다:
   - SEO (35% 가중치): 점수/100
   - GEO (35% 가중치): 점수/100
   - 성능 (20% 가중치): 점수/100
   - AI 분석 (10% 가중치): 점수/100

4. When 사용자가 각 카테고리 카드 클릭, Findably는 해당 카테고리 상세 항목을 표시해야 합니다 (예: SEO 클릭 → Title, Description, H1, ... 각 항목별 ✓/✗).

5. The Findably 대시보드는 원형 차트에 진행률 인디케이터(0-100의 호)를 표시해야 하고, 중앙에는 점수와 등급을 텍스트로 표시해야 합니다.

---

### Requirement 25: 개선 항목 리스트 (To-Do 형식)

**Objective:** 액션 아이템 관리자로서, 개선할 항목들을 체계적으로 나열하고 싶으므로, 사용자가 우선순위대로 실행할 수 있습니다.

#### Acceptance Criteria
1. The Findably 대시보드의 "개선 항목" 섹션은 다음을 포함해야 합니다:
   - 우선순위 배지 (높음/중간/낮음) + 아이콘
   - 항목명 (예: "Title 태그를 35자 이하로 수정")
   - 예상 효과: "SEO 점수 +10점"
   - 난이도 표시: "1시간 이내"
   - "이미 완료" 체크박스 (선택 사항)

2. When 개선 항목 리스트 표시, Findably는 우선순위순으로 정렬해야 합니다 (높음 → 중간 → 낮음).

3. The Findably는 개선 항목을 3가지로 분류하여 탭으로 제공해야 합니다:
   - Quick Win (1시간 이내, 즉시 실행)
   - 표준 개선 (1-8시간)
   - 장기 개선 (8시간 이상)

4. When 사용자가 개선 항목 클릭, Findably는 상세 정보(설명, 이유, 적용 방법, CMS별 가이드)를 모달 또는 펼침 형태로 표시해야 합니다.

---

### Requirement 26: Schema Markup 생성 결과 뷰 (코드 복사 기능)

**Objective:** 개발자 경험 디자이너로서, 생성된 Schema를 쉽게 복사-붙여넣기 가능하게 하고 싶으므로, 기술 지식이 없는 사용자도 적용할 수 있습니다.

#### Acceptance Criteria
1. The Findably "Schema Markup" 탭은 다음을 표시해야 합니다:
   - 생성된 Schema 코드 (JSON-LD, 문법 강조)
   - "복사" 버튼 (클릭 시 "복사되었습니다!" 토스트)
   - 사전 설정된 Schema 유형 선택 버튼 (Organization, Product, BlogPosting, LocalBusiness)
   - "HTML에 추가하는 방법" 안내 텍스트

2. When 사용자가 다른 Schema 유형 선택 (예: Product → BlogPosting), Findably는 코드를 즉시 새로 생성하여 표시해야 합니다.

3. When "복사" 버튼 클릭, Findably는 JavaScript의 Clipboard API를 사용하여 코드를 복사하고 "복사되었습니다!" 토스트(2초)를 표시해야 합니다.

4. The Findably는 생성된 각 Schema 코드에 주석을 포함해야 합니다 (예: <!-- 조직 정보 -->, <!-- 상품 정보 -->).

5. If 필수 정보가 누락되어 완전한 Schema를 생성할 수 없음, Findably는 사용자 입력 필드를 표시하고 입력 후 코드를 재생성해야 합니다.

---

### Requirement 27: 메타 태그 최적화안 뷰

**Objective:** 마케팅 담당자로서, 메타 태그 개선안을 시각적으로 비교하고 싶으므로, 변경 전후를 명확히 이해할 수 있습니다.

#### Acceptance Criteria
1. The Findably "메타 태그 최적화" 탭은 다음 레이아웃을 제공해야 합니다:
   - 좌측: 현재 메타 태그 (회색 배경, 읽기 전용)
   - 우측: 추천 메타 태그 (파란색 강조, 변경된 부분 굵게)
   - 중앙: 개선 이유 설명 (예: "핵심 키워드 '전자상거래' 추가로 CTR 예상 +15%")

2. When 메타 태그 비교 표시, Findably는 다음 항목을 포함해야 합니다:
   - <title>
   - <meta name="description">
   - <meta property="og:title">
   - <meta property="og:description">
   - <meta property="og:image">
   - <meta name="twitter:title">
   - <meta name="twitter:description">
   - <meta name="twitter:image">

3. When 사용자가 추천 메타 태그 복사 버튼 클릭, Findably는 완전한 HTML 코드 블록을 복사해야 합니다:
   ```html
   <title>추천 제목 (60자)</title>
   <meta name="description" content="추천 설명 (160자)">
   ...
   ```

4. The Findably는 메타 태그 길이 가이드를 표시해야 합니다 (예: Title 50-60자, Description 120-160자).

---

### Requirement 28: AI 인사이트 카드 (핵심 문제 3가지 + 추천 액션)

**Objective:** AI 분석 전문가로서, 사용자에게 상위 3가지 핵심 문제와 구체적 해결책을 제시하고 싶으므로, 사용자가 전략적 의사결정을 할 수 있습니다.

#### Acceptance Criteria
1. The Findably 대시보드의 "AI 인사이트" 섹션은 다음 3가지 카드를 표시해야 합니다:
   - **문제 #1**: "Title 태그가 키워드를 포함하지 않아 검색 노출도가 낮습니다"
   - **추천 액션**: "Title을 '키워드 - 회사명 | 설명' 형식으로 수정하세요. 예: '전자상거래 솔루션 - 스타트업용 쇼핑몰 | 무료 체험'"
   - **예상 효과**: "검색 노출도 +35%, CTR +20%"

2. When AI 인사이트 생성, Findably는 Claude API 응답을 파싱하여 상위 3가지 문제를 추출하고 우선순위순으로 정렬해야 합니다.

3. The Findably는 각 인사이트 카드에 아이콘(⚠️ 문제, 💡 팁, 🎯 액션) + 배경색(빨강/노랑/파랑)을 포함해야 합니다.

4. When 사용자가 인사이트 카드 클릭, Findably는 모달에서 상세 설명, 관련 action_item, 참고 자료 링크를 표시해야 합니다.

5. The Findably AI 인사이트는 한국어로 작성되어야 하고, 실행 가능하며 구체적인 가이드를 포함해야 합니다.

---

### Requirement 29: 대시보드 데이터 새로고침 및 재진단 버튼

**Objective:** 대시보드 관리자로서, 사용자가 언제든 재진단을 트리거할 수 있기를 원하므로, 최신 데이터를 기반으로 점수를 업데이트할 수 있습니다.

#### Acceptance Criteria
1. The Findably 대시보드 상단에는 "재진단" 버튼이 있어야 합니다.

2. When 사용자가 "재진단" 버튼 클릭, Findably는 다음을 수행해야 합니다:
   - n8n 크롤링 웹훅 재트리거
   - "진단 중..." 로딩 상태 표시 (진행률 표시)
   - 완료 후 자동으로 대시보드 데이터 새로고침

3. If 이전 진단 후 1시간 이내 재진단 요청 시, Findably는 "방금 진단했습니다. 1시간 후 다시 시도하세요" 경고를 표시해야 합니다 (비용 절감).

4. When 재진단 완료, Findably는 "✓ 재진단 완료! 점수가 업데이트되었습니다" 토스트를 표시해야 합니다.

---

### Requirement 30: Vercel 배포 설정

**Objective:** DevOps 엔지니어로서, Vercel에 자동 배포 설정을 구성하고 싶으므로, Git push 시 자동으로 프로덕션에 배포됩니다.

#### Acceptance Criteria
1. The Findably는 GitHub 리포지토리와 Vercel 프로젝트를 연결해야 합니다.

2. When main 브랜치에 push, Vercel은 자동으로 빌드 및 배포를 시작해야 합니다.

3. The Findably Vercel 환경 변수는 다음을 포함해야 합니다: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ANTHROPIC_API_KEY, N8N_WEBHOOK_URL, GOOGLE_PAGESPEED_API_KEY.

4. If 빌드 실패 (TypeScript 에러, 테스트 실패), Vercel은 배포를 중단하고 GitHub에 상태를 "실패"로 표시해야 합니다.

5. When 배포 성공, Findably는 고유 URL (예: findably-production.vercel.app) 및 커스텀 도메인(예: findably.com)에서 접근 가능해야 합니다.

---

### Requirement 31: n8n 서버 배포 (Railway/Fly.io)

**Objective:** 자동화 인프라 관리자로서, n8n을 외부 서버에 배포하고 싶으므로, 프로덕션 크롤링 작업을 안정적으로 실행할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 n8n을 Railway 또는 Fly.io에 Docker 컨테이너로 배포해야 합니다.

2. When n8n 배포, 다음 환경 변수를 설정해야 합니다: N8N_BASIC_AUTH_ACTIVE, N8N_BASIC_AUTH_USER, N8N_BASIC_AUTH_PASSWORD, DB_CONNECTION_URL (PostgreSQL).

3. The Findably n8n 인스턴스는 다음을 포함해야 합니다:
   - 크롤링 워크플로우 (main workflow)
   - 에러 처리 및 재시도 로직
   - Webhook 로깅 및 모니터링
   - 성능 메트릭 (크롤링 시간, 성공률)

4. When n8n 서버 다운타임 발생, Findably는 이메일 알림을 관리자에게 발송해야 합니다.

5. The Findably는 n8n의 Webhook URL을 .env.local (N8N_WEBHOOK_URL)에 저장해야 합니다.

---

### Requirement 32: 도메인 연결 및 SSL 설정

**Objective:** 인프라 관리자로서, 커스텀 도메인 (findably.com 등)을 Vercel에 연결하고 싶으므로, 전문적인 서비스 URL을 제공할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 DNS provider(Namecheap, Route53 등)에서 도메인을 구입하고 Vercel에 연결해야 합니다.

2. When Vercel에 도메인 추가, CNAME 레코드를 DNS에 설정해야 합니다 (Vercel 제공 값).

3. The Findably는 자동 HTTPS/SSL 인증서를 Vercel Let's Encrypt에서 발급받아야 합니다 (자동).

4. When 도메인 연결 완료, https://findably.com (또는 해당 도메인)에서 접근 가능해야 합니다.

5. If SSL 인증서 갱신 필요, Vercel이 자동으로 처리해야 합니다 (Let's Encrypt 자동 갱신).

---

### Requirement 33: 에러 모니터링 및 로깅 (Sentry)

**Objective:** 운영 관리자로서, 프로덕션 에러를 실시간으로 감지하고 싶으므로, 사용자 영향을 최소화할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 Sentry를 프론트엔드(Next.js) 및 백엔드(API Routes)에 통합해야 합니다.

2. When 프론트엔드 에러 발생 (예: unhandled exception, 404), Sentry가 자동으로 캡처하고 관리자에게 알림을 보내야 합니다.

3. When API Route에서 에러 발생 (예: Supabase 연결 오류, Claude API 오류), Sentry가 스택 트레이스, 요청 컨텍스트, 사용자 정보를 기록해야 합니다.

4. The Findably는 Sentry 대시보드에서 에러 추세, 영향받은 사용자 수, 에러 빈도를 조회할 수 있어야 합니다.

5. The Findably는 critical 에러(인증 실패, DB 다운)에 대해 이메일 + Slack 알림을 발송해야 합니다.

---

### Requirement 34: 기본 로깅 및 분석 (PostHog 또는 GA4)

**Objective:** 분석 담당자로서, 사용자 행동과 제품 메트릭을 추적하고 싶으므로, 데이터 기반 개선을 할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 PostHog 또는 GA4를 프론트엔드에 통합해야 합니다.

2. When 사용자가 다음 이벤트를 수행, 분석 도구가 기록해야 합니다:
   - 회원가입 (signup)
   - 로그인 (login)
   - 온보딩 시작 (onboarding_start)
   - 온보딩 완료 (onboarding_complete)
   - 재진단 (re_diagnose)
   - Schema Markup 복사 (schema_copied)
   - 메타 태그 복사 (meta_tag_copied)

3. The Findably는 다음 메트릭을 추적해야 합니다:
   - DAU/WAU (일일/주간 활성 사용자)
   - 온보딩 완료율 (%)
   - 평균 세션 시간
   - 기능별 사용률 (진단, 복사, 재진단)

4. When 분석 대시보드에서, 관리자는 국가/디바이스/브라우저별 사용자 세그멘테이션을 조회할 수 있어야 합니다.

---

## Non-Functional Requirements

### Requirement 35: 보안 — 데이터 보호 및 접근 제어

**Objective:** 보안 담당자로서, 사용자 데이터를 보호하고 싶으므로, GDPR/개인정보보호법 요구사항을 만족할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 Supabase RLS를 모든 테이블에 적용해야 하며, 사용자는 자신의 company_id 데이터만 조회/수정할 수 있어야 합니다.

2. When 사용자 로그인, Findably는 JWT 토큰을 발급하고, 모든 API 요청에서 토큰을 검증해야 합니다.

3. The Findably는 모든 사용자 입력(URL, 텍스트)을 Zod 스키마로 검증해야 하고, 유효하지 않은 입력은 거절해야 합니다.

4. If SQL injection 또는 XSS 공격 시도 감지, Findably는 요청을 거절하고 관리자에게 알림을 보내야 합니다.

5. The Findably는 모든 민감 정보(API 키, 비밀번호)를 .env.local 환경 변수에서만 관리하고 소스 코드에 하드코딩하면 안 됩니다.

6. When 프로덕션 배포, Findably는 TLS 1.2 이상의 HTTPS만 지원해야 합니다.

---

### Requirement 36: 성능 — 페이지 로드 시간 및 응답 시간

**Objective:** 성능 최적화 담당자로서, 빠른 사용자 경험을 제공하고 싶으므로, 이탈률을 줄일 수 있습니다.

#### Acceptance Criteria
1. The Findably 랜딩 페이지 First Contentful Paint (FCP)는 1.5초 이하여야 합니다.

2. When 대시보드 로드, Time to Interactive (TTI)는 3초 이하여야 합니다.

3. When API 요청(진단, 스코어 조회) 발생, 응답 시간은 2초 이하여야 합니다 (n8n 크롤링 제외).

4. The Findably는 Next.js Image 컴포넌트를 사용하여 모든 이미지를 최적화해야 합니다 (webp, lazy loading).

5. When 프로덕션 배포, Findably의 Lighthouse 점수는 최소 80점 이상이어야 합니다 (Performance).

---

### Requirement 37: 성능 — 크롤링 타임아웃 및 재시도

**Objective:** 크롤링 안정성 관리자로서, 장시간 크롤링을 방지하고 싶으므로, 서버 자원을 보호할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 크롤링 타임아웃을 300초(5분)로 설정해야 합니다.

2. If 크롤링이 타임아웃, Findably는 자동으로 1회 재시도해야 합니다 (지수 백오프).

3. If 재시도 후에도 실패, Findably는 상태를 "failed_timeout"으로 저장하고 사용자에게 알림을 보내야 합니다.

4. The Findably는 n8n에서 병렬 크롤링 작업 수를 최대 5개로 제한해야 합니다 (Playwright 리소스 관리).

---

### Requirement 38: 접근성 — WCAG 2.1 AA 준수

**Objective:** 접근성 담당자로서, 모든 사용자가 서비스를 사용할 수 있기를 원하므로, 장애인 차별을 방지할 수 있습니다.

#### Acceptance Criteria
1. The Findably의 모든 버튼, 링크, 입력 필드는 키보드로 탐색 가능해야 합니다 (Tab, Enter).

2. The Findably는 모든 이미지에 의미 있는 alt 텍스트를 포함해야 합니다 (예: alt="종합 점수: A등급, 87점").

3. When 색상 대비 검토, Findably는 명도(contrast ratio) 4.5:1 이상을 만족해야 합니다 (WCAG AA 기준).

4. The Findably는 스크린 리더(NVDA, JAWS, VoiceOver)에서 페이지 구조를 올바르게 읽을 수 있어야 합니다 (시맨틱 HTML, ARIA 라벨).

5. When 폼 입력 오류 발생, Findably는 오류 메시지를 텍스트와 색상 모두로 표시해야 합니다 (색상만으로 표시 금지).

---

### Requirement 39: 로깅 및 감시 — API 요청/응답 로깅

**Objective:** 운영 관리자로서, 모든 중요 작업을 기록하고 싶으므로, 문제 발생 시 추적 및 분석을 할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 모든 인증 관련 이벤트(로그인, 로그아웃, 회원가입)를 데이터베이스 또는 로깅 서비스에 기록해야 합니다.

2. When API 요청 발생, Findably는 다음을 로깅해야 합니다: 타임스탐프, 사용자 ID, 요청 경로, HTTP 메서드, 응답 상태, 응답 시간.

3. If 에러 발생, Findably는 에러 메시지, 스택 트레이스, 요청 컨텍스트를 로깅해야 합니다.

4. The Findably 로그는 최소 30일간 보관해야 하며, 이후 삭제하거나 아카이브해야 합니다.

---

### Requirement 40: 운영 — 서비스 상태 체크 및 헬스 엔드포인트

**Objective:** 운영 엔지니어로서, 서비스 정상 작동 상태를 모니터링하고 싶으므로, 다운타임을 빠르게 감지할 수 있습니다.

#### Acceptance Criteria
1. The Findably는 `/api/health` 엔드포인트를 제공해야 하며, Supabase, Claude API, n8n의 연결 상태를 체크해야 합니다.

2. When `/api/health` 호출, Findably는 다음을 반환해야 합니다:
   ```json
   {
     "status": "healthy" | "degraded" | "unhealthy",
     "timestamp": "2026-03-11T11:30:00Z",
     "services": {
       "database": "healthy",
       "claude_api": "healthy",
       "n8n": "degraded"
     }
   }
   ```

3. If 서비스 상태가 "unhealthy", Findably는 관리자에게 이메일/Slack 알림을 보내야 합니다.

4. When 헬스 체크 응답 시간이 5초 초과, Findably는 상태를 "degraded"로 표시해야 합니다.
