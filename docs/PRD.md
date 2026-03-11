# Findably — AI 마케팅 자동화 SaaS PRD

> Version: 1.0 | 작성일: 2026.03.11
> 원본: docs/MarketingPilot-SaaS-PRD-v1.md (상세 명세 참조, 서비스명 Findably로 변경됨)

## 목적
스타트업 대표가 URL과 5가지 질문에 답하면, AI가 마케팅 전체를 진단하고 실행까지 자동으로 해주는 올인원 마케팅 자동화 SaaS

## 핵심 기능 (5개 모듈)
1. **온보딩 & 데이터 수집** — URL 입력 → 자동 크롤링 + 간편 설문 (5분 완료)
2. **진단 & 분석** — 마케팅 건강 점수 100점 (SEO/콘텐츠/GEO/존재감/전환)
3. **실행 & 최적화** — Schema Markup 자동 생성, 메타 태그 최적화, Quick Win 리스트
4. **모니터링 & 추적** — 주간 자동 재진단, AI 인용 모니터링, 이상 징후 알림
5. **리포팅 & 인사이트** — 주간/월간/분기 리포트, AI 인사이트 자동 생성

## 만들지 않을 것 (Not Doing)
- 범용 마케팅 자동화 (HubSpot/Mailchimp 대체 안 함)
- 광고 집행 대행 (Google Ads/Meta Ads 직접 운영 안 함)
- SNS 콘텐츠 자동 포스팅
- 디자인/크리에이티브 제작
- CRM 기능
- 대기업/엔터프라이즈 대응

## 기술 스택
| 카테고리 | 선택 | 이유 |
|---------|------|------|
| 프론트엔드 | Next.js 15 (App Router) | 고객 대시보드, 온보딩 UI |
| 스타일링 | Tailwind CSS v4 + shadcn/ui | 빠른 UI 구축 |
| DB | Supabase PostgreSQL | 무료, RLS, Edge Functions |
| 인증 | Supabase Auth | 이메일 + Google OAuth |
| AI | Claude API (Sonnet) | 콘텐츠 분석, 인사이트 생성 |
| 자동화 | n8n (self-hosted) | 크롤링 스케줄, 모니터링 |
| 크롤링 | Playwright (Headless) | JS 렌더링 페이지 처리 |
| 이메일 | Resend | 트랜잭셔널 이메일, 리포트 |
| 결제 | Toss Payments (Phase 2) | 구독 결제 |
| 배포 | Vercel + Railway (n8n) | CDN + 서버 |

## 보안 분류
- [x] 🟡 보통 (외부 연동, 비공개 데이터)
- 인증: 이메일/Google OAuth → 🟡
- 고객 URL/비즈니스 데이터 수집 → 🟡
- 결제: MVP 제외, Phase 2에서 추가 → 추가 시 🔴

## MVP 스코프 (Phase 1, 6-8주)
- 온보딩: URL 입력 + 간편 설문 3문항
- 크롤링: 기본 HTML 크롤링
- 진단: 종합 점수 + SEO 기초 + GEO 준비도
- 실행: Schema Markup 자동 생성 + 메타 태그 최적화안
- Quick Win 리스트 (AI 생성)
- 기본 대시보드 (점수 + 개선 항목)
- 무료 + Starter 플랜
- 이메일 인증 + 구글 로그인

## Epic → Task 분해 (MVP)

### Epic 1: 프로젝트 셋업
- [ ] Task 1.1: Next.js 15 프로젝트 초기화 + Supabase 연동
- [ ] Task 1.2: Supabase 인증 (이메일 + Google OAuth)
- [ ] Task 1.3: DB 스키마 생성 (companies, diagnoses, action_items, generated_assets)
- [ ] Task 1.4: 기본 레이아웃 + 라우팅 구조

### Epic 2: 온보딩 플로우
- [ ] Task 2.1: 랜딩 페이지 (히어로 + CTA + 가치 제안)
- [ ] Task 2.2: 회원가입/로그인 페이지
- [ ] Task 2.3: 온보딩 스텝 폼 UI (URL 입력 + 3문항)
- [ ] Task 2.4: URL 입력 시 크롤링 트리거 API
- [ ] Task 2.5: 온보딩 완료 → 대시보드 리디렉트

### Epic 3: 크롤링 엔진
- [ ] Task 3.1: n8n 크롤링 워크플로우 설계
- [ ] Task 3.2: HTML 파서 (메타 태그, H태그, 링크, 이미지)
- [ ] Task 3.3: Schema Markup 파서
- [ ] Task 3.4: 사이트맵/robots.txt 파서
- [ ] Task 3.5: PageSpeed Insights API 연동
- [ ] Task 3.6: 크롤링 결과 → Supabase 저장

### Epic 4: 진단 엔진
- [ ] Task 4.1: SEO 기초 점수 산출 로직 (룰 기반)
- [ ] Task 4.2: GEO 준비도 점수 산출 로직
- [ ] Task 4.3: Claude API 연동 (콘텐츠 분석 + 인사이트 생성)
- [ ] Task 4.4: 종합 점수 산출 + 등급 부여
- [ ] Task 4.5: Quick Win 자동 식별 로직

### Epic 5: 실행 엔진
- [ ] Task 5.1: Schema Markup (JSON-LD) 자동 생성 로직
- [ ] Task 5.2: 메타 태그 최적화안 생성 (Claude API)
- [ ] Task 5.3: 개선 항목 우선순위 매트릭스 로직
- [ ] Task 5.4: CMS 감지 + CMS별 적용 가이드 텍스트

### Epic 6: 대시보드
- [ ] Task 6.1: 종합 점수 대시보드 (점수 원형 차트 + 카테고리별)
- [ ] Task 6.2: 개선 항목 리스트 (할 일 목록 UI)
- [ ] Task 6.3: Schema Markup 생성 결과 뷰 (코드 복사 기능)
- [ ] Task 6.4: 메타 태그 최적화안 뷰
- [ ] Task 6.5: AI 인사이트 카드 (핵심 문제 3가지 + 추천 액션)

### Epic 7: 인프라 & 배포
- [ ] Task 7.1: Vercel 배포 설정
- [ ] Task 7.2: n8n 서버 배포 (Railway/Fly.io)
- [ ] Task 7.3: 도메인 연결 + SSL
- [ ] Task 7.4: 에러 모니터링 (Sentry)
- [ ] Task 7.5: 기본 로깅 + 분석 (Posthog 또는 GA4)

## 완료 기준
- [ ] MVP 핵심 기능 구현 (Epic 1-6)
- [ ] tsc → eslint → build → test 통과
- [ ] 보안 리뷰 완료
- [ ] Vercel 배포 성공
- [ ] 무료 진단 → 점수 확인 → Quick Win 실행 플로우 동작
