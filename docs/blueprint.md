# Phase 2 Blueprint — 비주얼 + 구조화 데이터

> PRD: docs/Findably-PRD-홈페이지-리포트-정합성-v1_2.md
> 브랜치: feature/phase-2
> 총 2개 Task, 예상 ~3시간

---

## 목표

Phase 2 완료 시 상태:

1. og:image가 Next.js OG Image Generation으로 동적 생성됨 (카카오톡/트위터 공유 시 표시)
2. Schema Markup 4종(Organization, SoftwareApplication, FAQPage, BreadcrumbList)이 @graph로 통합됨
3. 랜딩 페이지에 SoftwareApplication + FAQPage Schema가 추가됨

---

## Task E-03 (8.14): Schema Markup Quad Stacking

### 수정 파일

| 파일                           | 변경 내용                                            |
| ------------------------------ | ---------------------------------------------------- |
| `src/app/layout.tsx`           | 기존 2개 JSON-LD → @graph 통합 + BreadcrumbList 추가 |
| `src/app/(marketing)/page.tsx` | SoftwareApplication + FAQPage JSON-LD 추가           |

### layout.tsx — @graph 통합

기존 Organization + WebSite 별도 → 1개 @graph로 통합 + BreadcrumbList 추가.

### (marketing)/page.tsx — 랜딩 전용 Schema

FAQ 데이터를 config/landing.ts에서 가져와 FAQPage Schema 생성.
SoftwareApplication Schema에 실제 가격 반영 (무료 + 건당 99,000원).

### 검증

- [ ] @graph 내 Organization, WebSite, BreadcrumbList 존재 (layout)
- [ ] SoftwareApplication, FAQPage 존재 (랜딩만)
- [ ] FAQ Schema = config/landing.ts FAQ와 일치

---

## Task E-06 (8.18): og:image 동적 생성

### 수정 파일

| 파일                   | 변경 내용                      |
| ---------------------- | ------------------------------ |
| `src/app/og/route.tsx` | **신규** — OG 이미지 동적 생성 |
| `src/config/seo.ts`    | ogImage 경로 변경              |

### 설계

- Next.js ImageResponse API로 1200x630 이미지 생성
- 배경: findably-dark, 중앙: 로고+서브텍스트

---

## 실행 순서

```
1. E-03 (Schema) → 2. E-06 (og:image) → 검증 게이트
```
