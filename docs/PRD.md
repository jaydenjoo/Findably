# Findably — AI 마케팅 진단 SaaS PRD

> Version: 3.0 | 작성일: 2026.03.12
> 원본: Findably-서비스기획서-v3.0.md (건당 과금 모델)

---

## 1. 제품 비전

> URL 하나 넣으면, AI가 "당신 사이트의 마케팅 점수는 47점입니다. 이것부터 고치세요"라고 알려주는 서비스

병원 건강검진과 같은 구조:
1. 접수 (URL만 입력)
2. 검사 (60개+ 항목 자동)
3. 결과지 (종합 점수 + 우선순위 실행 계획)

**핵심 차별점:** SEO(구글 검색) + GEO(AI 검색) 통합 진단. "AI가 당신을 추천하는가?"를 측정.

---

## 2. 만들지 않을 것 (Not Doing)

| 안 합니다 | 이유 |
|----------|------|
| 광고 대행 (Google Ads/Meta) | "진단"이지 "치료"가 아님 |
| SNS 포스팅 대행 | Buffer/Hootsuite 영역 |
| 디자인/로고 제작 | Canva 영역 |
| 대기업 전용 기능 | 스타트업/소규모만 집중 |
| 네이버 블로그 대필 | 콘텐츠 대행 아닌 "방향 제시" |
| 월 구독 (Phase 1) | 건당 결제만 MVP |
| 주간 자동 재검사 | Phase 2 |
| GSC/GA4 연동 | Phase 2 |

---

## 3. 타겟 고객

**김대표 (32세, 스타트업 CEO)**
- 팀 5명, 마케팅 담당 = 본인
- "제품은 좋은데 아무도 모른다"
- 에이전시 월 300만원은 부담

**박실장 (28세, 주니어 마케터)**
- SEO 개념은 아는데 구체적 실행법 모름
- 대표에게 "잘 하고 있다" 증명 자료 필요

**타겟 업종:** B2B SaaS / 쇼핑몰(자사몰) / 전문서비스(병원, 학원, 컨설팅) / 교육 / 스타트업

---

## 4. 문제 정의

```
예전: "카페 추천" → 구글/네이버 검색 → 파란 링크 중 클릭
지금: "이 근처 카페 추천해줘" → ChatGPT/Perplexity → AI가 바로 답변

문제: AI가 답변할 때 "당신의 사이트"를 언급 안 하면?
→ 고객이 당신을 못 찾음
→ 경쟁사만 추천됨
```

Findably가 해결:
- 구글 검색에서 잘 보이는지 (SEO)
- AI에서 언급되는지 (GEO)
- 둘 다 진단 + 고치는 법까지

---

## 5. 제품 아키텍처

### 4-Layer 크롤링 엔진

```
[입력] URL (+ 선택 정보)
    ↓
━━━ Layer 1: 직접 크롤링 (n8n + Playwright) ━━━  비용 0원
    HTML메타, H1~H6, Schema, robots.txt, sitemap, llms.txt,
    내부링크, 이미지ALT, 깨진링크, CMS감지, 보안, 모바일
    ↓
━━━ Layer 2: Google 무료 API 4종 ━━━  비용 0원
    PageSpeed Insights, CrUX, Safe Browsing, Search Console(연동시)
    ↓
━━━ Layer 3: 오픈소스 도구 ━━━  비용 0원
    Wappalyzer, Lighthouse, Mozilla Observatory, SSL Labs
    ↓
━━━ Layer 4: 유료 API (성장 후) ━━━  사용량 비례
    Moz Free(MVP~), DataForSEO(100명+), Ahrefs(500명+)
    ↓
[분석] 룰 기반 점수 + AI 인사이트
    ↓
[출력] 리포트
```

### 5-Agent 병렬 분석 (유료)

```
[Phase 1: 동시 검사] (~30초)
    ├─ 🔧 기술 전문가    → 속도, 보안, 모바일
    ├─ 🔍 SEO 전문가     → 검색 최적화
    ├─ 🤖 GEO 전문가     → AI 검색 노출 + 인용 추적
    ├─ 📝 콘텐츠 전문가  → 글 품질, 구조, 전문성
    └─ 🏢 경쟁사 분석가  → 경쟁사 병렬 분석 비교

[Phase 2: 결과 합치기] (~10초)
    → 점수 합산 + 우선순위 정리

[Phase 3: CMO 검증] (~10초)
    → 리포트 품질 확인 + 오류 필터
```

---

## 6. Free/유료 분기

| | 무료 (0원) | 건당 (9.9만원) | 월 구독 (19.9만원, Phase 2) |
|--|----------|------------|------------------------|
| 간단 리포트 (웹) | ✅ | ✅ | ✅ |
| AI 인용 가능성 체크 | ✅ (구조 예측) | ✅ (실제 추적) | ✅ (주간 추적) |
| 상세 리포트 (웹+PDF) | ❌ | ✅ 1건 | ✅ 무제한 |
| 경쟁사 비교 | ❌ | ✅ 3개사 | ✅ 5개사 |
| 90일 실행 계획 | ❌ | ✅ | ✅ |
| 코드 자동 생성 | ❌ | ✅ 1회 | ✅ 무제한 |
| 주간 재검사/추적 | ❌ | ❌ | ✅ |

**전환 장치:**
- 샘플 리포트 — 가상 회사 "그린테크" 풀 버전 공개 (블러 없음)
- BlurOverlay — 유료 기능은 보이되 접근 차단
- Quick Win 1개 무료 제공 → "더 보려면 결제"

---

## 7. User Flow

### Flow 1: 무료 진단 (핵심)
```
랜딩 → 회원가입(이메일/구글) → URL 입력 → AI 분석(~2분, 프로그레스바)
→ 간단 리포트 (점수 + 문제 3개 + Quick Win 1개 + AI 인용 가능성)
```

### Flow 2: 샘플 열람
```
대시보드 "샘플 보기" → /reports/sample (그린테크 풀 리포트) → "나도 받고 싶다" → 결제 CTA
```

### Flow 3: 유료 결제 → 상세 진단
```
결제 CTA 클릭 → Toss Payments 9.9만원 → 결제 완료 → 5-Agent 병렬 분석 트리거
→ 상세 리포트 (60개+ 항목 + 경쟁사 비교 + 90일 계획 + PDF)
```

### Flow 4: PDF 다운로드
```
상세 리포트 → "PDF 다운로드" 클릭 → ReportLab 생성 → 다운로드
```

### Flow 5: 실행 도구
```
상세 리포트 → Schema 코드 생성 → CMS별 적용 가이드 → 복사 → 사이트에 적용
```

### Flow 6: robots.txt 차단 시
```
크롤링 시도 → 차단 감지 → 대체 데이터(PageSpeed, SSL 등 60%) 수집
→ "일부 항목 제한됨" 안내 + GSC 연동 유도 → 가능한 범위로 리포트 생성
```

---

## 8. 에러 상태 (5+2 패턴)

| 상태 | 보여줄 것 | 유저 액션 |
|------|---------|----------|
| 로딩 중 | Skeleton UI | 기다리기 |
| 정상 | 데이터 표시 | — |
| 데이터 없음 | "아직 진단 결과가 없습니다" + 진단 시작 버튼 | 진단 시작 |
| 에러 | "잠시 후 다시 시도해주세요" + 재시도 버튼 | 재시도 |
| 오프라인 | "인터넷 연결을 확인해주세요" | 연결 후 자동 복구 |
| 404 | "찾으시는 페이지가 없습니다" + 홈 버튼 | 홈으로 |
| 500 | "서버에 문제가 발생했습니다" + Sentry 자동 리포트 | 재시도/홈 |

---

## 9. 기술 스택

| 역할 | 도구 | 비용 |
|------|------|------|
| 프론트엔드 | Next.js 15 (SSR) + shadcn/ui + Tailwind CSS v4 | 0원 |
| DB + 인증 | Supabase (PostgreSQL + Auth + RLS) | 무료~Pro |
| AI 분석 | Claude API (Sonnet 4.6) | 유료만 ~500원/건 |
| 자동화 | n8n (Elest.io) | 기존 구독 |
| 크롤링 | Playwright | 0원 |
| 이메일 | Resend | 소량 무료 |
| 결제 | Toss Payments | 수수료만 |
| 호스팅 | Vercel | 무료~Pro |
| 에러 감지 | Sentry | 무료 티어 |
| PDF | ReportLab (Python) | 0원 |

---

## 10. 모듈 경계

| 모듈 | 역할 | 폴더 |
|------|------|------|
| onboarding | 가입, URL 입력, 추가정보 | features/onboarding/ |
| crawling | 4-Layer 데이터 수집 | features/crawling/ |
| diagnosis-free | 룰 기반 점수 (무료) | features/diagnosis-free/ |
| diagnosis-paid | AI 에이전트 분석 (유료) | features/diagnosis-paid/ |
| geo-engine | AI 인용 분석 전문 | features/geo-engine/ |
| competitors | 경쟁사 비교 분석 | features/competitors/ |
| report | 웹 + PDF 리포트 | features/report/ |
| actions | Schema/메타태그 코드 생성 | features/actions/ |
| payment | Toss Payments 건당 결제 | features/payment/ |
| sample | 그린테크 샘플 리포트 | features/sample/ |

**규칙:** 모듈끼리 직접 import 금지. 공통 → shared/로 분리.

---

## 11. 어댑터 목록

| 서비스 | 현재 | 교체 가능 | 경로 |
|--------|------|----------|------|
| AI 분석 | Claude API | OpenAI, Gemini | lib/adapters/ai.ts |
| 결제 | Toss Payments | Stripe | lib/adapters/payment.ts |
| 이메일 | Resend | Postmark | lib/adapters/email.ts |
| 크롤링 | Playwright | Puppeteer | lib/adapters/crawler.ts |
| PDF | ReportLab | Puppeteer PDF | lib/adapters/pdf.ts |

---

## 12. 확장 시나리오

| 원칙 | 비유 | 적용 |
|------|------|------|
| 모듈 분리 | 이동식 벽 사무실 | features/ 독립 폴더 |
| 어댑터 패턴 | 교체 가능한 배관 | lib/adapters/ |
| 설정 외부화 | 조절 다이얼 | config/ 파일 |
| 확장 슬롯 | 빈 콘센트 | 파일 1개 + registry 1줄 |

Phase 2 확장: 월 구독 → monitoring/ 모듈 추가, GSC 연동 → integrations/ 모듈 추가

---

## 13. GEO/SEO 목표

### GEO 점수 산출 (Findably 차별점)

| 항목 | 비중 | 설명 |
|------|------|------|
| AI 인용 가능성 | 25% | AI가 콘텐츠를 인용할 만한가 |
| 브랜드 신뢰 신호 | 20% | 외부에서 브랜드 언급 빈도 |
| 콘텐츠 품질 | 20% | 전문성, 정확성, 구조 |
| 기술 기초 | 15% | 속도, 보안, 모바일 |
| 구조화 데이터 | 10% | Schema Markup, JSON-LD |
| 플랫폼 최적화 | 10% | ChatGPT/Perplexity 각각 대응 |

### AI 인용 추적 (요금제별)

- **무료:** 사이트 구조 기반 예측 점수 (AI API 미호출, 비용 0원)
- **건당:** Claude API로 타겟 키워드 3개 실제 질문 → 언급 여부 확인
- **월 구독 (Phase 2):** 매주 자동 반복 + 변화 추적 + 이메일 알림

### SEO 자체 사이트 적용

- sitemap.xml 자동 생성
- robots.txt (GPTBot, ClaudeBot, PerplexityBot 허용)
- llms.txt 제공
- JSON-LD 구조화 데이터
- 메타 태그 최적화 (title, description, og:*)

---

## 14. 접근성 기준

- WCAG AA 준수
- 키보드 네비게이션 100%
- 색상 대비 4.5:1 이상
- 이미지 alt 태그 필수
- MVP: 한국어 전용
- 텍스트 분리 (messages/ko.json) → 추후 영어 추가 대비

---

## 15. 가격 모델

| | 무료 | 건당 결제 | 월 구독 (Phase 2) |
|--|------|----------|-----------------|
| 가격 | 0원 | 9.9만원/건 | 월 19.9만원 |
| 원가 | 0원 | ~500원/건 | ~2,000원/월 |
| 마진율 | — | 99.5% | 99% |

**전환 전략:**
- 첫 진단 50% 할인 (4.9만원) — 가격 저항 완화
- 샘플 리포트로 가치 체감 선행

---

## 16. MVP 스코프 (Phase 1 — 6~8주)

### Phase 1 포함
- 온보딩: URL 입력(필수) + 추가정보(선택)
- 4-Layer 크롤링 (Playwright + Google API + 오픈소스)
- 간단 리포트 (룰 기반, AI 미호출, 비용 0원)
- AI 인용 가능성 (무료 — 구조 기반 예측)
- AI 인용 실제 추적 (유료 — Claude API)
- 상세 리포트 (5-Agent 병렬 + CMO 검증)
- 경쟁사 비교 (3개사 병렬)
- 90일 실행 계획 + Quick Win
- Schema/메타태그 코드 생성
- CMS 감지 → 맞춤 적용 가이드
- PDF 다운로드
- 샘플 리포트 (그린테크)
- Free/유료 분기 (BlurOverlay + 샘플 유도)
- 건당 결제 (Toss Payments)
- 5가지 화면 상태 + 404/500
- 접근성 (WCAG AA)
- SEO/GEO 메타데이터
- E2E 테스트 (핵심 3 Flow)
- Sentry + robots.txt 차단 대응

### Phase 2 (이후)
- 월 구독 결제
- 주간 자동 재검사 + 점수 변화 추적
- 주간 AI 인용 자동 추적
- 실행 도구 전체 (월 구독 전용)
- GSC/GA4 연동
- 콘텐츠 브리프 생성

---

## 17. Epic → Task (Phase 1)

### Epic 1: 프로젝트 셋업
- 1.1: Next.js 15 + Supabase + shadcn/ui 초기화
- 1.2: features/ 모듈 구조 + registry + adapters/
- 1.3: Supabase Auth (이메일 + Google)
- 1.4: DB 스키마
- 1.5: GNB + 라우팅 + 레이아웃
- 1.6: config/ (점수 기준, 접근 제어, 메뉴, SEO)
- 1.7: 공통 컴포넌트 (ErrorBoundary, Skeleton, EmptyState, BlurOverlay)
- 1.8: SEO 기반 (metadata, JSON-LD, sitemap, robots.txt, llms.txt)
- 1.9: Sentry + CI/CD

### Epic 2: 온보딩 (최소 입력)
- 2.1: 랜딩 페이지 + SEO
- 2.2: 회원가입/로그인
- 2.3: URL 입력 (필수 1개) + 선택 정보 폼
- 2.4: 분석 대기 화면 (프로그레스바)

### Epic 3: 4-Layer 크롤링 엔진
- 3.1: Playwright 크롤링 (HTML + 메타 + Schema + 링크 + 이미지)
- 3.2: robots.txt 파싱 (AI 봇 14개 체크) + 차단 대응
- 3.3: sitemap.xml + llms.txt 파싱
- 3.4: CMS 감지 (Wappalyzer)
- 3.5: 모바일 크롤링 (375px)
- 3.6: PageSpeed Insights API
- 3.7: CrUX API
- 3.8: Safe Browsing API
- 3.9: SSL Labs + Mozilla Observatory
- 3.10: 크롤링 결과 → Supabase 저장
- 3.11: robots.txt 차단 시 대체 데이터 + 안내 UI

### Epic 4: 진단 엔진
- 4.1: 룰 기반 SEO 점수 (50개+ 룰)
- 4.2: 룰 기반 GEO 점수 (15개+ 룰)
- 4.3: AI 인용 가능성 점수 (룰 기반, 무료)
- 4.4: Quick Win 자동 식별
- 4.5: 종합 점수 + 등급 산출

### Epic 5: AI 상세 분석 (유료)
- 5.1: 5개 에이전트 병렬 실행 (n8n)
- 5.2: Claude API 콘텐츠 품질 분석
- 5.3: AI 인용 실제 추적 (Claude API)
- 5.4: CMO 검증 에이전트
- 5.5: SWOT 자동 생성
- 5.6: 90일 로드맵 자동 생성

### Epic 6: 경쟁사 비교
- 6.1: 경쟁사 자동 탐색 (미입력 시)
- 6.2: 경쟁사 병렬 크롤링
- 6.3: 비교 매트릭스 생성
- 6.4: 갭 분석

### Epic 7: 리포트 + 실행 도구
- 7.1: 대시보드 (점수 카드 + AI 인용 + Quick Win)
- 7.2: 간단 리포트 (무료)
- 7.3: 상세 리포트 (유료, 웹)
- 7.4: PDF 리포트 생성
- 7.5: Schema Markup 코드 생성
- 7.6: 메타태그 최적화안
- 7.7: CMS 감지 기반 맞춤 가이드

### Epic 8: 샘플 리포트
- 8.1: 가상 회사 "그린테크" 데이터 생성
- 8.2: /reports/sample 풀 리포트 페이지

### Epic 9: Free/유료 분기 + 결제
- 9.1: 사용자 상태 미들웨어 (Free/건당)
- 9.2: BlurOverlay 컴포넌트
- 9.3: 유료 전환 CTA 배치
- 9.4: Toss Payments 건당 결제
- 9.5: 결제 완료 → 상세 진단 트리거

### Epic 10: 인프라 + 품질
- 10.1: Vercel 배포 + 도메인
- 10.2: n8n 서버 (Elest.io)
- 10.3: E2E 테스트 (F-001~F-003)
- 10.4: 404/500 에러 페이지
- 10.5: 접근성 + Lighthouse

---

## 18. KPI

| 지표 | 설명 | 6개월 목표 |
|------|------|-----------|
| 무료 진단 수 | 무료로 써본 사람 | 월 500건 |
| Quick Win 실행율 | "바로 고치기" 클릭 비율 | 40% |
| 유료 전환율 | 무료→유료 전환 | 7% |
| 재구매율 | 1번 산 사람이 또 구매 | 30% |
| 추천 유입 | 소개로 유입된 비율 | 20% |

---

## 19. 리스크 + 완화

| 리스크 | 설명 | 대응 |
|--------|------|------|
| 가격 저항 | "9.9만원 비싸다" | 샘플 가치 체감 + 첫 진단 50% 할인 |
| AI 할루시네이션 | 틀린 분석 | 팩트=크롤링, AI=해석만 |
| 기대 관리 | "에이전시보다 부족" | "70% 품질을 1/10 가격에" |
| robots.txt 차단 | 크롤링 불가 | 3단계 대응 (대체+GSC+안내) |
| API 비용 | 비용 급증 | 무료=AI 미호출, 유료=~500원/건 |
| 입력 포기 | 정보를 모름 | URL만 필수, 나머지 AI 자동 |
| 경쟁사 | 시장 경쟁 | GEO 전문 + 한국어 + 실행까지 |

---

## 부록 A: 보안 분류

| 영역 | 등급 | 조치 |
|------|------|------|
| 결제 (billing) | 🔴 높음 | 직접 코드 + 수동 검증, n8n 금지 |
| 인증 | 🟡 일반 | Supabase Auth (검증 라이브러리) |
| 크롤링/진단 | 🟡 일반 | n8n 자동화 허용 |
| 고객 데이터 | 🟡 일반 | Supabase RLS + 최소 수집 |

---

## 부록 B: Site Map

```
/ (랜딩)
├── /login
├── /signup
├── /pricing
├── /onboarding
│   ├── /onboarding/url
│   ├── /onboarding/info
│   └── /onboarding/analyzing
├── /dashboard
├── /diagnosis
│   ├── /diagnosis/overview
│   ├── /diagnosis/seo
│   ├── /diagnosis/geo
│   ├── /diagnosis/content
│   └── /diagnosis/competitors (유료)
├── /reports
│   ├── /reports/sample (무료: 그린테크)
│   ├── /reports/my
│   └── /reports/my/[id] (유료: 상세+PDF)
├── /actions (유료)
│   ├── /actions/schema
│   ├── /actions/meta-tags
│   └── /actions/roadmap
└── /settings
    ├── /settings/profile
    └── /settings/billing
```

---

## 부록 C: 비용 구조

| | 무료 진단 | 유료 진단 |
|--|---------|---------|
| Layer 1~3 크롤링 | 0원 | 0원 |
| Claude API | 0원 (미호출) | ~500원/건 |
| **합계** | **0원** | **~500원/건** |

건당 9.9만원 판매 → 원가율 0.5%
