# Findably — Architecture Decision Records (ADR)

> 주요 아키텍처 결정과 그 이유를 기록합니다.
> 최종 업데이트: 2026-03-11

---

## ADR-001: 프론트엔드 프레임워크 — Next.js 15 (App Router)
- **날짜**: 2026-03-11
- **상태**: ✅ 승인됨
- **맥락**: SaaS 대시보드 + 랜딩 페이지 + 온보딩 플로우를 단일 프레임워크로 구현 필요
- **선택지**:
  - A: Next.js 15 — 장점: Server Components, ISR, Vercel 최적화 / 단점: 학습 곡선
  - B: Remix — 장점: 웹 표준 / 단점: 생태계 작음
  - C: SvelteKit — 장점: 빌드 크기 작음 / 단점: UI 라이브러리 부족
- **결정**: Next.js 15 (App Router)
- **이유**: Server Components로 성능 최적화, shadcn/ui 호환, Vercel 배포 최적화
- **결과**: Tailwind v4 + shadcn/ui 조합으로 빠른 UI 구축 가능

---

## ADR-002: 데이터베이스 — Supabase PostgreSQL + Drizzle ORM
- **날짜**: 2026-03-11
- **상태**: ✅ 승인됨
- **맥락**: 사용자 데이터, 크롤링 결과, 진단 점수 저장. RLS로 데이터 격리 필수
- **선택지**:
  - A: Supabase + Drizzle — 장점: 무료, RLS, 타입 안전 / 단점: 자체 호스팅 불가
  - B: PlanetScale + Prisma — 장점: MySQL, 브랜칭 / 단점: 무료 티어 축소
  - C: Neon + Drizzle — 장점: 서버리스 / 단점: Edge Functions 없음
- **결정**: Supabase PostgreSQL + Drizzle ORM
- **이유**: 무료 티어 충분, Auth 통합, RLS로 멀티테넌시, Edge Functions 지원
- **결과**: 인증-DB-API가 하나의 플랫폼에서 관리됨

---

## ADR-003: 크롤링 엔진 — n8n + Playwright
- **날짜**: 2026-03-11
- **상태**: ✅ 승인됨
- **맥락**: 고객 URL을 크롤링하여 메타 태그, Schema Markup, 성능 데이터 수집
- **선택지**:
  - A: n8n + Playwright — 장점: JS 렌더링, 스케줄링, 시각적 워크플로우 / 단점: 자체 호스팅 필요
  - B: Puppeteer + Cron — 장점: 직접 제어 / 단점: 인프라 관리
  - C: Cheerio (정적 파싱) — 장점: 가볍고 빠름 / 단점: SPA 크롤링 불가
- **결정**: n8n (self-hosted on Railway) + Playwright
- **이유**: 기존 n8n 인프라 활용, JS 렌더링 페이지 대응, 워크플로우 시각화
- **결과**: Railway 비용 발생, 모니터링 자동화도 n8n으로 확장 가능

---

## ADR-004: AI 엔진 — Claude API (Sonnet)
- **날짜**: 2026-03-11
- **상태**: ✅ 승인됨
- **맥락**: 한국어 콘텐츠 분석, 인사이트 생성, 메타 태그 최적화안 작성
- **선택지**:
  - A: Claude API (Sonnet) — 장점: 한국어 품질 우수, 긴 컨텍스트 / 단점: Anthropic API 의존
  - B: GPT-4o — 장점: 넓은 생태계 / 단점: 한국어 분석 품질 열세
  - C: Gemini 2.5 — 장점: 무료 티어 / 단점: API 안정성 미확인
- **결정**: Claude API (Sonnet)
- **이유**: 한국어 마케팅 콘텐츠 분석 품질, 200K 토큰 컨텍스트, 구조화된 출력
- **결과**: Anthropic API 비용 발생, 토큰 사용량 모니터링 필요

---

## 디렉토리 구조 (예정)

```
src/
├── app/                    # 라우팅 (비즈니스 로직 금지)
│   ├── (auth)/             # 인증 관련 (로그인, 회원가입)
│   ├── (marketing)/        # 랜딩 페이지
│   ├── dashboard/          # 대시보드 (인증 필요)
│   └── onboarding/         # 온보딩 플로우
├── actions/                # Server Actions
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── dashboard/          # 대시보드 전용 컴포넌트
│   ├── onboarding/         # 온보딩 전용 컴포넌트
│   └── landing/            # 랜딩 페이지 컴포넌트
├── db/
│   └── schema.ts           # Drizzle 스키마 (진실의 원천)
├── lib/
│   ├── supabase/           # Supabase 클라이언트
│   ├── validations/        # Zod 스키마
│   └── utils.ts            # 유틸리티
├── types/                  # 타입 정의 (OST)
└── constants/              # 상수 (하드코딩 금지)
```

---

## 데이터 흐름 (MVP)

```
[사용자] → URL 입력
    ↓
[온보딩 폼] → 3문항 응답 + URL
    ↓
[API Route] → n8n 웹훅 트리거
    ↓
[n8n + Playwright] → HTML 크롤링
    ├── 메타 태그 파싱
    ├── Schema Markup 파싱
    ├── 사이트맵/robots.txt 파싱
    └── PageSpeed Insights API
    ↓
[Supabase] ← 크롤링 결과 저장
    ↓
[진단 엔진]
    ├── 룰 기반: SEO 점수 + GEO 점수
    └── Claude API: 콘텐츠 분석 + 인사이트
    ↓
[Supabase] ← 진단 결과 저장
    ↓
[대시보드] → 종합 점수 + Quick Win + Schema Markup 생성
```
