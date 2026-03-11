# Findably — 진행상황 문서
> **이 파일을 세션 시작 시 첫 번째로 읽으면 100% 이어서 작업 가능**
> 최종 업데이트: 2026-03-11

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | Findably |
| **목적** | URL만 넣으면 AI가 마케팅 진단+실행 자동화하는 올인원 SaaS |
| **기술 스택** | Next.js 15 + Supabase + Tailwind v4 + shadcn/ui + Claude API + n8n |
| **보안 분류** | 🟡 보통 (외부 연동, 비공개 데이터) |
| **MVP 범위** | 7 Epic, 30 Task (온보딩→크롤링→진단→실행→대시보드) |

---

## 완료된 작업

- [x] PRD 작성 완료 (docs/MarketingPilot-SaaS-PRD-v1.md)
- [x] 프로젝트 초기 세팅 (CLAUDE.md, PROGRESS.md, plan.md, docs/architecture.md)

## 진행 중

- [ ] 없음 (초기 설정 완료, 설계 분해 대기)

## 다음 할 일

1. `/kiro:spec-init` → 요구사항 상세화
2. `/kiro:spec-design` → 기술 설계
3. `/kiro:spec-tasks` → Task 분해
4. Task 1.1: Next.js 15 프로젝트 초기화 + Supabase 연동
5. Task 1.2: Supabase 인증 (이메일 + Google OAuth)

---

## 핵심 설계 결정사항

| 결정 | 선택 | 이유 |
|------|------|------|
| DB | Supabase PostgreSQL | 무료, RLS 통합, Edge Functions |
| ORM | Drizzle | 타입 안전, 경량 |
| 인증 | Supabase Auth | 이메일+OAuth 내장, RLS 연동 |
| AI | Claude API (Sonnet) | 한국어 콘텐츠 분석 품질 우수 |
| 자동화 | n8n (self-hosted) | 크롤링 스케줄, 기존 인프라 활용 |
| 크롤링 | Playwright | JS 렌더링 지원, 풍부한 데이터 수집 |
| 이메일 | Resend | 개발자 친화적 API, 합리적 가격 |
| 배포 | Vercel + Railway | Next.js 최적화 + n8n 서버 |

---

## 다음 세션에서 할 일

1. Kiro spec-init으로 요구사항 상세화
2. 또는 바로 Task 1.1 시작 (Next.js 프로젝트 초기화)
