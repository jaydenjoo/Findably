# 현재 계획 (External Memory)
> 이 파일은 /compact, /clear 후에도 살아남는 "외부 메모리"입니다.
> AI가 세션이 리셋되어도 이 파일을 읽으면 맥락을 이어갈 수 있습니다.
> 최종 업데이트: 2026-03-11

---

## 현재 작업

**Epic**: 프로젝트 초기 설정
**Task**: PRD 기반 초기 세팅
**상태**: 완료. 설계 분해 대기 중.

## 기능 목록 (JSON 형식 — AI가 임의 수정하지 않음)

```json
[
  {"id": 1, "epic": "셋업", "description": "Next.js 15 프로젝트 초기화 + Supabase 연동", "status": "not_started", "depends_on": []},
  {"id": 2, "epic": "셋업", "description": "Supabase 인증 (이메일 + Google OAuth)", "status": "not_started", "depends_on": [1]},
  {"id": 3, "epic": "셋업", "description": "DB 스키마 생성 (companies, diagnoses, action_items, generated_assets)", "status": "not_started", "depends_on": [1]},
  {"id": 4, "epic": "셋업", "description": "기본 레이아웃 + 라우팅 구조", "status": "not_started", "depends_on": [1]},
  {"id": 5, "epic": "온보딩", "description": "랜딩 페이지 (히어로 + CTA + 가치 제안)", "status": "not_started", "depends_on": [4]},
  {"id": 6, "epic": "온보딩", "description": "회원가입/로그인 페이지", "status": "not_started", "depends_on": [2, 4]},
  {"id": 7, "epic": "온보딩", "description": "온보딩 스텝 폼 UI (URL 입력 + 3문항)", "status": "not_started", "depends_on": [6]},
  {"id": 8, "epic": "온보딩", "description": "URL 입력 시 크롤링 트리거 API", "status": "not_started", "depends_on": [7]},
  {"id": 9, "epic": "온보딩", "description": "온보딩 완료 → 대시보드 리디렉트", "status": "not_started", "depends_on": [7]},
  {"id": 10, "epic": "크롤링", "description": "n8n 크롤링 워크플로우 설계", "status": "not_started", "depends_on": [1]},
  {"id": 11, "epic": "크롤링", "description": "HTML 파서 (메타 태그, H태그, 링크, 이미지)", "status": "not_started", "depends_on": [10]},
  {"id": 12, "epic": "크롤링", "description": "Schema Markup 파서", "status": "not_started", "depends_on": [10]},
  {"id": 13, "epic": "크롤링", "description": "사이트맵/robots.txt 파서", "status": "not_started", "depends_on": [10]},
  {"id": 14, "epic": "크롤링", "description": "PageSpeed Insights API 연동", "status": "not_started", "depends_on": [10]},
  {"id": 15, "epic": "크롤링", "description": "크롤링 결과 → Supabase 저장", "status": "not_started", "depends_on": [3, 11]},
  {"id": 16, "epic": "진단", "description": "SEO 기초 점수 산출 로직 (룰 기반)", "status": "not_started", "depends_on": [15]},
  {"id": 17, "epic": "진단", "description": "GEO 준비도 점수 산출 로직", "status": "not_started", "depends_on": [15]},
  {"id": 18, "epic": "진단", "description": "Claude API 연동 (콘텐츠 분석 + 인사이트 생성)", "status": "not_started", "depends_on": [15]},
  {"id": 19, "epic": "진단", "description": "종합 점수 산출 + 등급 부여", "status": "not_started", "depends_on": [16, 17]},
  {"id": 20, "epic": "진단", "description": "Quick Win 자동 식별 로직", "status": "not_started", "depends_on": [19]},
  {"id": 21, "epic": "실행", "description": "Schema Markup (JSON-LD) 자동 생성 로직", "status": "not_started", "depends_on": [12, 18]},
  {"id": 22, "epic": "실행", "description": "메타 태그 최적화안 생성 (Claude API)", "status": "not_started", "depends_on": [18]},
  {"id": 23, "epic": "실행", "description": "개선 항목 우선순위 매트릭스 로직", "status": "not_started", "depends_on": [20]},
  {"id": 24, "epic": "실행", "description": "CMS 감지 + CMS별 적용 가이드 텍스트", "status": "not_started", "depends_on": [11]},
  {"id": 25, "epic": "대시보드", "description": "종합 점수 대시보드 (점수 원형 차트 + 카테고리별)", "status": "not_started", "depends_on": [19]},
  {"id": 26, "epic": "대시보드", "description": "개선 항목 리스트 (할 일 목록 UI)", "status": "not_started", "depends_on": [23]},
  {"id": 27, "epic": "대시보드", "description": "Schema Markup 생성 결과 뷰 (코드 복사 기능)", "status": "not_started", "depends_on": [21]},
  {"id": 28, "epic": "대시보드", "description": "메타 태그 최적화안 뷰", "status": "not_started", "depends_on": [22]},
  {"id": 29, "epic": "대시보드", "description": "AI 인사이트 카드 (핵심 문제 3가지 + 추천 액션)", "status": "not_started", "depends_on": [18, 20]},
  {"id": 30, "epic": "인프라", "description": "Vercel 배포 + n8n Railway + 도메인 + 모니터링", "status": "not_started", "depends_on": [25]}
]
```

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| DB | Supabase PostgreSQL + Drizzle ORM | 타입 안전 + RLS + 무료 |
| 인증 | Supabase Auth | OAuth 내장, RLS 연동 |
| AI | Claude API (Sonnet) | 한국어 분석 품질 |
| 크롤링 | n8n + Playwright | JS 렌더링 지원, 스케줄링 |
| 이메일 | Resend | 개발자 친화적 |
| 결제 | Phase 2에서 Toss Payments | MVP 범위 밖 |

## 핵심 식별자 (파일 경로, 설정값)

```
주요 파일:
- docs/PRD.md: 제품 요구사항 (요약)
- docs/MarketingPilot-SaaS-PRD-v1.md: PRD 상세 원본
- docs/architecture.md: 아키텍처 결정
- src/db/schema.ts: DB 스키마 (생성 예정)
- src/app/: 라우팅 (생성 예정)

환경변수 (예정):
- NEXT_PUBLIC_SUPABASE_URL: Supabase URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase 공개 키
- SUPABASE_SERVICE_ROLE_KEY: 서버 전용 키
- ANTHROPIC_API_KEY: Claude API 키
- RESEND_API_KEY: 이메일 발송 키
```

## 현재 세션 메모

- PRD 기반 초기 설정 완료 (2026-03-11)
- 프로젝트명: MarketingPilot → Findably 변경
- 보안 등급: 🟡 보통 (MVP에서 결제 제외)
- 다음: Kiro spec-init 또는 바로 Task 1.1 시작
