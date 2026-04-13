# PROGRESS.md — Findably

> 이 파일을 새 세션 시작 시 로드하면 100% 이어서 작업 가능
> 최종 업데이트: 2026-04-13

## 현재 상태

- 현재 Phase: 리포트 신뢰도 강화 (크롤러 오진 수정 + Task 1~4 완료)
- 현재 Task: 완료 — 다음 세션에서 성능 최적화(LCP/모바일) 또는 블로그 인프라
- 빌드 상태: tsc + build 통과 (2026-04-13)

## Epic 진행 현황

| Epic             | 상태            | 비고                                          |
| ---------------- | --------------- | --------------------------------------------- |
| 1. 프로젝트 셋업 | ✅ 완료         | Auth, DB, GNB, config, 공통 컴포넌트, SEO     |
| 2. 온보딩        | ✅ 완료         | 랜딩, 회원가입, URL입력, 분석대기 화면        |
| 3. 크롤링 엔진   | 🔄 3.1~3.9 완료 | 3.10~3.11 미착수                              |
| 4. 진단 엔진     | ✅ 완료         | 67개 룰 (SEO+GEO), AI인용, QuickWin, 종합점수 |
| 5. AI 상세 분석  | ⏳ 미착수       | 유료 기능 (Phase C)                           |
| 6. 경쟁사 비교   | ⏳ 미착수       | 유료 기능 (Phase C)                           |
| 7. 리포트+실행   | 🔄 7.1 완료     | 대시보드 F-패턴 (mock 데이터)                 |
| 8. 샘플 리포트   | ⏳ 미착수       | Phase B                                       |
| 9. 결제          | ⏳ 미착수       | 🔴 보안                                       |
| 10. 인프라+품질  | ⏳ 미착수       |                                               |

## ✅ 완료된 작업 (요약)

### Epic 1: 프로젝트 셋업

- [x] 1.1: Next.js 15 + Supabase + shadcn/ui 초기화
- [x] 1.2: features/ 모듈 구조 + registry + adapters/
- [x] 1.3: Supabase Auth (이메일 + Google) — 10개 서브태스크 완료
- [x] 1.4: DB 스키마 (diagnoses, diagnosis_items + RLS)
- [x] 1.5: GNB + 라우팅 + 레이아웃 (사이드바 포함)
- [x] 1.6: config/ (scoring, access-control, features, seo)
- [x] 1.7: 공통 컴포넌트 (ErrorBoundary, Skeleton, EmptyState, BlurOverlay)
- [x] 1.8: SEO (metadata, JSON-LD, sitemap, robots.txt, llms.txt)

### Epic 2: 온보딩

- [x] 2.1: 랜딩 페이지
- [x] 2.2: 회원가입/로그인
- [x] 2.3: URL 입력 + 선택 정보 폼 (Zod + Server Action)
- [x] 2.4: 분석 대기 화면 (AnalyzingScreen + 폴링)

### Epic 3: 크롤링 엔진 (부분 완료)

- [x] 3.1: Playwright 크롤링 (Layer 1)
- [x] 3.2: robots.txt 파싱 (AI 봇 14개)
- [x] 3.3: sitemap.xml + llms.txt 파싱
- [x] 3.4: CMS 감지
- [x] 3.5: 모바일 크롤링
- [x] 3.6: PageSpeed Insights API
- [x] 3.7: CrUX API
- [x] 3.8: Safe Browsing API
- [x] 3.9: SSL Labs + Mozilla Observatory
- [ ] **3.10: 크롤링 결과 → 진단 엔진 연결** ← 현재
- [ ] 3.11: robots.txt 차단 시 대체 데이터 + 안내 UI

### Epic 4: 진단 엔진

- [x] 4.1: 룰 기반 SEO 점수 (50개+ 룰)
- [x] 4.2: 룰 기반 GEO 점수 (15개+ 룰)
- [x] 4.3: AI 인용 가능성 점수 (구조 기반 예측)
- [x] 4.4: Quick Win 자동 식별
- [x] 4.5: 종합 점수 + 등급 산출

### Epic 7: 리포트 (부분 완료)

- [x] 7.1.1: ScoreGauge 원형 게이지 (SVG + 카운트업)
- [x] 7.1.2: QuickWinCard + AICitationCard 대시보드 컴포넌트
- [x] 7.1.3: 대시보드 F-패턴 레이아웃 통합

## ✅ Session 16차 완료 (2026-04-13) — 마케팅 인프라 최적화

- [x] 유령 파일 수정: logo.png, apple-touch-icon.png 생성 (JSON-LD/iOS 404 해결)
- [x] sitemap에 /terms, /privacy 추가, /login 제거
- [x] robots.txt AI 봇 8→16개 확장
- [x] Vercel Analytics + Speed Insights 설치
- [x] GA4 인프라 구축 (GoogleAnalytics 컴포넌트 + gtag 헬퍼)
- [x] llms.txt 동적 라우트 전환 (FAQ 자동 반영)
- [x] Organization Schema 보강 (contactPoint, foundingDate, knowsAbout)
- [x] 랜딩에 HowTo Schema 추가
- [x] 동적 OG 이미지 (?title=&desc= 파라미터 지원)
- [x] pricing에 Product/Offer JSON-LD + OG/Twitter 메타 추가
- [x] manifest.ts PWA 기초 생성
- [x] Google Search Console 인증 + sitemap 제출
- [x] 네이버 서치어드바이저 인증 완료
- [x] seo.ts 데드코드(LANDING_JSON_LD) 제거
- [x] 네이버 verification 중첩 조건문 버그 수정
- [x] 랜딩 title 브랜드명 중복 수정 (`| Findably | Findably` → `| Findably`)
- [x] Findably 자체 리포트 검증 → 8개 진단 중 5개 오진 발견 (크롤러 품질 이슈)

## ✅ Session 17차 완료 (2026-04-13) — 크롤러 오진 수정 + 리포트 신뢰도 강화

### 크롤러 오진 수정 (5건 → 0건, 76점 → 85점)

- [x] Task A: crawl_data 검증 — Firecrawl `onlyMainContent: true`가 `<head>` 제거하여 canonical/schema/OG/links 누락 확인
- [x] Task B: 진단 룰 검증 — OG 키 불일치(`title` vs `og:title`), SSL 가드 미흡 발견
- [x] Fix 1: social-ai.ts OG 키 양방향 호환 (`og['title'] ?? og['og:title']`)
- [x] Fix 2: parse-crawl-v2.ts HTML 폴백 파서 추가 (Firecrawl metadata 비어있으면 raw HTML에서 추출)
- [x] Fix 3: guards.ts SSL 가드 강화 (grade/issuer null이면 평가 skip)
- [x] Fix 4: enrichCrawlData에 fetchHeadMetadata 추가 — 사이트 full HTML 직접 fetch하여 `<head>` 파싱
- [x] Fix 5: 랜딩 page.tsx og:image 실제 구현 누락 수정 (Next.js openGraph 상속 문제)
- [x] 재진단 3회 실행 → 76점 → 84점 → 81점 → **85점** 확인

### 리포트 신뢰도 강화 (Task 1~4 전체 완료)

- [x] Task 1: "스킵" → "확인 불가 ⚠️" 라벨 변경 + skipped 룰 목록 표시 (CategoryScoreCard)
- [x] Task 2: evidence(근거) 표시 — 7개 핵심 룰에 실제 발견 값 표시 (canonical URL, H1 텍스트, Schema 타입, OG값, SSL, 내부 링크)
- [x] Task 3: 카나리 자가진단 — /api/canary + Vercel Cron 매일 09:00 KST + Resend 이메일 알림
- [x] Task 4: 데이터 수집률 배지 — 대시보드 종합 점수 하단에 completeness % 표시

### 코드 리뷰 수정

- [x] extractFromHtml 96줄 중복 제거 → parseHeadFromHtml import로 통합
- [x] evidence 누락 보강 (content.ts, security.ts)

### 이번 세션 커밋 (6건)

1. `a37d27e` fix(diagnosis): 크롤러 오진 5건 수정
2. `3763864` fix(crawling): enrichCrawlData head metadata 직접 fetch
3. `bbf8606` fix(seo): 랜딩 og:image 누락 수정
4. `7df0f7e` feat(diagnosis): task 1+2 확인 불가 + evidence
5. `8402fee` feat(reliability): task 3+4 카나리 + 수집률
6. `1b76b63` refactor(crawling): 중복 제거 + evidence 보강

## ⏭️ 다음 할 일

**성능 최적화 (실제 이슈, 오진 아님)**

- 모바일 43점 — LCP 개선, JS 번들 최적화, dynamic import
- 성능 47~80점 변동 — TTFB 210ms 개선, Edge Runtime 검토

**마케팅 확장:**

1. Epic M-5: 블로그 인프라 구축 (MDX 기반 콘텐츠 SEO)
2. Epic M-6: 전환 최적화 (실시간 카운터, 뉴스레터 캡처)

**제품 기능:**

- Task 3.10: 크롤링 → 진단 엔진 → DB 저장 → 대시보드 연결
- Task 3.11: robots.txt 차단 시 대체 데이터 + 안내 UI

## 🔑 결정사항 기록

| 날짜       | 결정                     | 이유                                 |
| ---------- | ------------------------ | ------------------------------------ |
| 2026-03-12 | @supabase/ssr 사용       | 공식 권장, cookie getAll/setAll 패턴 |
| 2026-03-12 | Server Actions 기반 auth | Next.js 15 권장 패턴, CSRF 자동 방어 |
| 2026-03-13 | chatsio-v1 Supabase 공유 | 무료 티어 제한. findably\_ 접두사    |
| 2026-03-13 | RLS 보안 고도화          | authenticated 제한, search_path 보안 |
| 2026-03-15 | Phase A→B→C 순서         | F-001 End-to-End 완성이 MVP 최우선   |

## 🔑 파이프라인 갭 분석 (Task 3.10)

```
현재 흐름:
  URL입력 → submit-url.ts(INSERT pending) → triggerCrawl(n8n)
  → n8n Layer 1 완료 → POST /api/crawl/webhook
  → runLayers(Layer 2+3) → saveCrawlResult(status=analyzing)
  → ❌ 여기서 끝 (진단 엔진 미실행, 대시보드 mock 데이터)

필요한 연결:
  → saveCrawlResult 후
  → evaluate(crawlData) + calculateAICitationPossibility(crawlData)
  → analysis_data 저장 + total_score/grade 업데이트 + status=completed
  → 대시보드에서 Supabase 실데이터 읽기
```

## 🐛 알려진 이슈

| 이슈                         | 심각도 | 상태                    |
| ---------------------------- | ------ | ----------------------- |
| 대시보드 mock 데이터 사용 중 | 중간   | Task 3.10에서 해결 예정 |

## 💡 교훈

- Tailwind v4: bg-gradient-to-_ → bg-linear-to-_ 변경됨
- Vitest fake timers + waitFor: 교착 → advanceTimersByTimeAsync 사용
- useRouter mock: 안정 참조 필수 (매번 새 객체 → useEffect 무한 재실행)
- shadcn/ui jsdom: @base-ui/react 브라우저 API → 단순 HTML mock 필요
