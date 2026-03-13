# Site Map — Findably

> PRD v3.0 부록 B 기반
> 이 문서에 없는 페이지는 만들지 않는다.
> URL 패턴: /[module]/[action]/[id]

## Public (비로그인)

```
/ (랜딩)
├── /login
├── /signup
├── /pricing
└── /reports/sample (그린테크 샘플 — 비로그인 열람 가능)
```

## Auth Required (로그인 필수)

```
/onboarding
├── /onboarding/url            ← URL 입력 (필수)
├── /onboarding/info           ← 추가 정보 (선택)
└── /onboarding/analyzing      ← 분석 대기 화면

/dashboard                     ← 메인 진입점

/diagnosis
├── /diagnosis/overview        ← 종합 점수 + 카테고리
├── /diagnosis/seo             ← SEO 상세
├── /diagnosis/geo             ← GEO 상세
├── /diagnosis/content         ← 콘텐츠 상세
└── /diagnosis/competitors     ← 경쟁사 비교 (🔒 유료)

/reports
├── /reports/my                ← 내 리포트 목록
└── /reports/my/[id]           ← 상세 리포트 + PDF (🔒 유료)

/actions                       ← 실행 도구 (🔒 유료)
├── /actions/schema            ← Schema Markup 코드 생성
├── /actions/meta-tags         ← 메타태그 최적화안
└── /actions/roadmap           ← 90일 실행 계획

/settings
├── /settings/profile          ← 프로필 수정
└── /settings/billing          ← 결제 내역 + 영수증
```

## 접근 제어 요약

| 페이지                      | 비로그인 | Free                  | 유료 (건당) |
| --------------------------- | -------- | --------------------- | ----------- |
| / (랜딩)                    | ✅       | ✅                    | ✅          |
| /login, /signup             | ✅       | —                     | —           |
| /pricing                    | ✅       | ✅                    | ✅          |
| /reports/sample             | ✅       | ✅                    | ✅          |
| /onboarding/\*              | —        | ✅                    | ✅          |
| /dashboard                  | —        | ✅                    | ✅          |
| /diagnosis/overview~content | —        | ✅ (일부 BlurOverlay) | ✅          |
| /diagnosis/competitors      | —        | BlurOverlay           | ✅          |
| /reports/my/[id]            | —        | BlurOverlay           | ✅          |
| /actions/\*                 | —        | BlurOverlay           | ✅          |
| /settings/\*                | —        | ✅                    | ✅          |

## 확장 규칙

- 새 모듈: 이 문서에 먼저 추가 → 승인 → 개발
- GNB 6개 이하 → 그대로 추가. 7개+ → "더보기" 드롭다운
- Phase 2 예정: /monitoring (주간 재검사), /integrations (GSC/GA4 연동)
