# 현재 계획 (External Memory)

> 이 파일은 /compact, /clear 후에도 살아남는 "외부 메모리"입니다.
> AI가 세션이 리셋되어도 이 파일을 읽으면 맥락을 이어갈 수 있습니다.
> 최종 업데이트: 2026-03-13

---

## 🎯 현재 작업

**상태**: Epic 1 ✅ 완료 → Epic 2 (온보딩) 진입 대기
**완료**: 1.1~1.9 전체 (커밋 7973d6d + 40c5cd8)
**다음**: Epic 2.1 랜딩 페이지 + SEO

## 📋 기능 목록 (JSON 형식 — AI가 임의 수정하지 않음)

```json
[
  {
    "id": "1.1",
    "description": "Next.js 15 + Supabase + shadcn/ui 초기화",
    "status": "done",
    "depends_on": []
  },
  {
    "id": "1.2",
    "description": "features/ 모듈 구조 + registry + adapters/",
    "status": "done",
    "depends_on": ["1.1"]
  },
  {
    "id": "1.3",
    "description": "Supabase Auth (이메일 + Google)",
    "status": "done",
    "depends_on": ["1.1"]
  },
  {
    "id": "1.4",
    "description": "DB 스키마 (5개 테이블 + RLS + 타입)",
    "status": "done",
    "depends_on": ["1.3"]
  },
  {
    "id": "1.5",
    "description": "GNB + 라우팅 + 레이아웃",
    "status": "done",
    "depends_on": ["1.1"]
  },
  {
    "id": "1.6",
    "description": "config/ (점수, 접근제어, 메뉴, SEO)",
    "status": "done",
    "depends_on": ["1.1"]
  },
  {
    "id": "1.7",
    "description": "공통 컴포넌트 (ErrorBoundary, Skeleton, EmptyState, BlurOverlay)",
    "status": "done",
    "depends_on": ["1.1"]
  },
  {
    "id": "1.8",
    "description": "SEO 기반 (metadata, JSON-LD, sitemap, robots.txt, llms.txt)",
    "status": "done",
    "depends_on": ["1.1"]
  },
  {
    "id": "1.9",
    "description": "Sentry + CI/CD",
    "status": "done",
    "depends_on": ["1.1"]
  }
]
```

## 🏗️ 아키텍처 결정

| 결정              | 선택             | 이유                       |
| ----------------- | ---------------- | -------------------------- |
| 과금 모델         | 건당 9.9만원     | MVP 검증용, 구독은 Phase 2 |
| 무료 진단 AI 호출 | 안 함 (룰 기반)  | 비용 0원 유지              |
| 유료 진단         | 5-Agent 병렬     | aimarketing 검증 패턴      |
| 결제              | Toss Payments 🔴 | 한국 건당 결제 최적        |
| DB 접두사         | findably\_       | chatsio-v1 Supabase 공유   |

## 🔑 핵심 식별자 (파일 경로, 설정값)

```
주요 파일:
- docs/PRD.md: 제품 요구사항 (v3.0, 건당 과금)
- docs/blueprint.md: 현재 Task 실행 계획
- src/features/registry.ts: 모듈 등록부
- src/config/scoring.ts: 점수 기준
- src/config/access-control.ts: Free/유료 접근 제어
- src/config/navigation.ts: GNB/사이드바 메뉴 정의
- src/lib/adapters/ai.ts: AI 어댑터
- src/types/database.ts: Supabase 자동생성 타입 (5개 테이블)
- src/middleware.ts: 라우트 보호

환경변수 (필요):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- TOSS_CLIENT_KEY
- TOSS_SECRET_KEY
- SENTRY_DSN
```

## 📝 세션 메모

- Task 1.4: Supabase MCP로 원격 DB 검증 완료 (2026-03-13). 5개 테이블 모두 존재 + RLS 활성화.
- Task 1.5: 코드 리뷰 ✅ PASS. 4 Gate 통과, 🟡 Nit 2개 (aria-busy, params prop).
- Task 1.7: 공통 컴포넌트 10개 생성. 코드 리뷰 2회 ✅ PASS.
- Task 1.8: SEO 기반 9개 파일. sitemap.ts, robots.ts, JsonLd, llms.txt 등.
- Task 1.9: Sentry v10.43.0 + CI/CD workflow.
- Epic 1 커밋: 7973d6d (153 files) + 40c5cd8 (tsconfig strict + robots.txt 삭제)
- 빌드: ✅ 27 pages 성공. lint 경고 4개 (pre-existing).
- 다음 세션: Epic 2.1 랜딩 페이지부터 시작.
