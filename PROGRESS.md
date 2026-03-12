# Findably — 진행상황 문서
> **이 파일을 세션 시작 시 첫 번째로 읽으면 100% 이어서 작업 가능**
> 최종 업데이트: 2026-03-12

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Findably |
| **목적** | URL 하나로 SEO+GEO 통합 진단 AI SaaS |
| **기술 스택** | Next.js 15 + Supabase + Tailwind v4 + shadcn/ui |
| **보안 분류** | 🔴 결제(billing) / 🟡 나머지 |
| **과금 모델** | 건당 9.9만원 (Phase 1) |

---

## ✅ 완료된 작업

- [x] PRD v3.0 작성 (건당 과금 모델, 19개 섹션)
- [x] Next.js 15 프로젝트 초기화 (TypeScript + Tailwind v4 + App Router)
- [x] v6.4 스캐폴드 적용 (폴더 구조 + config + adapters + shared)
- [x] shadcn/ui 초기화 + 기본 컴포넌트 (button, card, input, label, badge, skeleton, progress)
- [x] CLAUDE.md / PROGRESS.md / plan.md Findably 맞춤 세팅

## ⏳ 진행 중

- [ ] Epic 1 나머지 (1.3~1.9) — 프로젝트 셋업 마무리

## 🔜 다음 할 일

1. Epic 1.3: Supabase Auth (이메일 + Google)
2. Epic 1.4: DB 스키마
3. Epic 1.5: GNB + 라우팅 + 레이아웃
4. Epic 2.1: 랜딩 페이지

---

## 🔑 핵심 설계 결정사항

| 결정 | 선택 | 이유 |
|------|------|------|
| 과금 모델 | 건당 9.9만원 | MVP 검증 — 구독보다 진입장벽 낮음 |
| 인증 | Supabase Auth | 무료, RLS 통합 |
| 크롤링 | Playwright + n8n | Layer 1 비용 0원 |
| AI | Claude API (Sonnet 4.6) | 유료만 호출 — 원가 ~500원/건 |
| 결제 | Toss Payments | 한국 시장 최적, 건당 결제 지원 |
| 배포 | Vercel | Next.js 최적화 |

---

## 🔜 다음 세션에서 할 일

1. Epic 1.3: Supabase Auth 설정
2. Epic 1.4: DB 스키마 설계 (users, diagnoses, reports, payments)
