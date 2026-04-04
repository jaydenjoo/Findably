# Phase 5 Blueprint — PDF 반영 + 정합성 검증

> PRD: docs/Findably-PRD-홈페이지-리포트-정합성-v1_2.md
> 브랜치: feature/phase-5
> 총 2개 Task, 예상 ~2.5시간

---

## 목표

Phase 5 완료 시 상태:

1. PDF 리포트에 원화 환산 매출 영향 표시 (PdfInsights)
2. PDF 브릿지 섹션에 총 누수 요약 카드 포함 (PdfBridgeSection)
3. D-01 정합성 체크리스트 코드 레벨 검증 완료

---

## Task C-03 (7.17): PDF 리포트에 원화 환산 반영

### 수정 파일

| 파일                                                    | 변경 내용                                |
| ------------------------------------------------------- | ---------------------------------------- |
| `src/features/report/pdf/sections/PdfInsights.tsx`      | 각 항목에 💰 원화 환산 블록 추가         |
| `src/features/report/pdf/sections/PdfBridgeSection.tsx` | 총 누수 요약 카드 추가                   |
| `src/features/report/pdf/ReportDocument.tsx`            | PdfBridgeSection에 aiInsights props 전달 |

### PdfInsights.tsx 변경

현재: 영향도 섹션에 `insight.impact` 텍스트만 표시.

변경: `calculateRevenueImpact()`로 원화 계산 → 영향도 텍스트 위에 "💰 매출 영향" 블록 추가.

- critical/warning → 원화 표시
- info → 미표시
- 기존 impact 텍스트는 "상세 지표" 라벨로 유지
- 면책 문구 추가

### PdfBridgeSection.tsx 변경

현재: 4영역 점수 테이블만.

변경: 테이블 아래에 총 누수 요약 추가.

- `aiInsights` props 추가
- TotalLeakageCard 웹 컴포넌트와 동일 로직을 PDF 스타일로 렌더링
- 우선순위별(즉시/1~2개월) 금액 분류

### ReportDocument.tsx 변경

`PdfBridgeSection`에 `aiInsights` props 전달:

```
AS: <PdfBridgeSection categoryScores={data.categoryScores ?? []} />
TO: <PdfBridgeSection categoryScores={data.categoryScores ?? []} aiInsights={data.aiInsights ?? []} />
```

### 검증

- [ ] PDF 내 critical/warning 인사이트에 원화 환산 표시
- [ ] PDF 브릿지 섹션에 총 누수 카드 표시
- [ ] 웹 리포트와 PDF 리포트의 원화 금액이 일치
- [ ] `pnpm build` 통과

---

## Task D-01 (8.16): 정합성 검증 (코드 레벨)

코드에서 검증 가능한 항목을 확인합니다. 배포 후 실제 사이트 테스트(Lighthouse, 카카오톡 공유 등)는 별도.

### 코드 검증 체크리스트

**[홈페이지 → 리포트]**

- hero-section.tsx H1: "어디서 새고 있는지" ✓ (Phase 0)
- hero-section.tsx Sub: "가장 돈이 많이 새는 곳부터" ✓ (Phase 0)
- customer-concerns.tsx 고민카드1: "매출 영향 금액 환산" ✓ (Phase 0)
- comparison-table.tsx: "기초체력 진단" ✓ (Phase 0)
- BridgeSection: "새는 곳을 찾았습니다" 프레이밍 ✓ (Phase 1)
- AIInsightsSection: 원화 환산 존재 ✓ (Phase 4)

**[리포트 → 홈페이지]**

- BridgeSection 진단 영역 4개 = 홈페이지 설명 4개 일치 확인
- 면책 문구 일관성 확인

**[SEO/GEO]**

- robots.ts: 8개 봇 허용 ✓ (Phase 0)
- sitemap.ts: 5개 URL ✓ (기존)
- llms.txt: 누수 프레이밍 ✓ (Phase 0)
- Schema @graph: 5종 ✓ (Phase 2)
- og:image: /og 동적 생성 ✓ (Phase 2)
- canonical: 설정됨 ✓ (Phase 0)

### 불일치 발견 시

- 해당 파일 즉시 수정 후 재검증

---

## 실행 순서

```
1. C-03 (PDF 원화 반영) — PdfInsights + PdfBridgeSection 수정
2. D-01 (정합성 검증) — 코드 grep으로 체크리스트 자동 확인
→ 커밋 → tsc → lint → build 검증
```

---

## 검증 게이트

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build
```
