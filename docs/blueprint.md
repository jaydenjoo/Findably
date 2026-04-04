# Phase 4 Blueprint — Revenue Translator 연동

> PRD: docs/Findably-PRD-홈페이지-리포트-정합성-v1_2.md
> 브랜치: feature/phase-4
> 총 3개 Task (4.6 선행 + C-01 + C-02), 예상 ~5시간

---

## 목표

Phase 4 완료 시 상태:

1. 업종별 벤치마크 config 생성 (전환율, 객단가, 기본 트래픽)
2. `calculateRevenueImpact()` 함수로 진단 항목별 원화 환산 가능
3. AI 인사이트 각 항목에 "💰 매출 영향" 원화 표시 + "전문가용" 접기 영역
4. 리포트 브릿지 섹션에 총 누수 요약 카드 표시

---

## 선행: Task 4.6 — 매출 환산 로직 + config

> PRD에서 C-01/C-02의 의존으로 명시. 현재 미구현 상태.

### 생성 파일

| 파일                                                               | 변경 내용                                                |
| ------------------------------------------------------------------ | -------------------------------------------------------- |
| `src/config/revenue.ts`                                            | **신규** — 업종별 벤치마크 (전환율, 객단가, 기본 트래픽) |
| `src/features/diagnosis-paid/services/calculate-revenue-impact.ts` | **신규** — 원화 환산 함수                                |

### config/revenue.ts 설계

```typescript
/** 업종별 벤치마크 데이터 */
type IndustryId =
  | 'saas'
  | 'ecommerce'
  | 'education'
  | 'healthcare'
  | 'consulting'
  | 'default'

interface IndustryBenchmark {
  label: string
  conversionRate: number // 전환율 (예: 0.032 = 3.2%)
  averageOrderValue: number // 평균 객단가 (원)
  defaultMonthlyTraffic: number // 기본 월 트래픽 (추정)
}

const INDUSTRY_BENCHMARKS: Record<IndustryId, IndustryBenchmark>
```

주요 업종 5개 + default (전체 업종 평균):

- SaaS: 전환율 3.2%, 객단가 50만원, 트래픽 5,000
- 이커머스: 전환율 2.5%, 객단가 8만원, 트래픽 15,000
- 교육: 전환율 4.0%, 객단가 30만원, 트래픽 8,000
- 의료: 전환율 5.0%, 객단가 20만원, 트래픽 3,000
- 컨설팅: 전환율 2.0%, 객단가 100만원, 트래픽 2,000
- default: 전환율 3.0%, 객단가 15만원, 트래픽 5,000

### calculateRevenueImpact() 설계

```typescript
interface RevenueImpact {
  monthlyLoss: number // 월 손실 추정 (만원)
  annualLoss: number // 연간 손실 추정 (만원)
  monthlyGain: number // 개선 시 월 추가 유입 (만원)
}

function calculateRevenueImpact(params: {
  severity: 'critical' | 'warning' | 'info'
  category: string
  industry?: IndustryId
  monthlyTraffic?: number
}): RevenueImpact | null
```

- `info` severity → null 반환 (영향도 낮음)
- severity별 영향 비율: critical=15%, warning=5%
- 업종 미입력 시 `default` 사용

### 검증

- [ ] `calculateRevenueImpact({ severity: 'critical', category: 'technical' })` → 양수 반환
- [ ] `severity: 'info'` → null 반환
- [ ] 업종 미지정 시 default 벤치마크 사용

---

## Task C-01 (7.15): 영향도 섹션에 원화 환산 표시

### 수정 파일

| 파일                                                                    | 변경 내용                                   |
| ----------------------------------------------------------------------- | ------------------------------------------- |
| `src/app/(dashboard)/reports/my/[id]/_components/AIInsightsSection.tsx` | 각 항목에 💰 매출 영향 + 전문가용 접기 추가 |

### AIInsightsSection.tsx 변경

각 인사이트 카드에 추가:

```
[기존] title → description → suggestedFix

[변경] title → 💰 매출 영향 (원화) → description → 📊 전문가용 (접기) → suggestedFix
```

- `calculateRevenueImpact()`로 원화 계산
- severity가 critical/warning이면 원화 표시, info면 미표시
- 기존 impact 텍스트는 "전문가용" 접기 영역으로 이동
- 면책: "업종 평균 기준 추정" 문구

### 검증

- [ ] critical/warning 항목에 원화 환산 표시
- [ ] info 항목은 원화 미표시
- [ ] "전문가용" 접기/펼치기 동작
- [ ] 면책 문구 포함

---

## Task C-02 (7.16): 총 누수 요약 카드

### 수정 파일

| 파일                                                                   | 변경 내용               |
| ---------------------------------------------------------------------- | ----------------------- |
| `src/app/(dashboard)/reports/my/[id]/_components/TotalLeakageCard.tsx` | **신규** — 총 누수 카드 |
| `src/app/(dashboard)/reports/my/[id]/_components/BridgeSection.tsx`    | TotalLeakageCard 삽입   |

### TotalLeakageCard 설계

```
Props: {
  insights: AIInsight[]
  industry?: IndustryId
}
```

모든 critical/warning 인사이트의 `calculateRevenueImpact()` 합산 →
우선순위별(priority 기준) 그룹핑:

- 🔴 즉시 해결 (priority 1~3): {immediate}만원/월
- 🟡 1~2개월 (priority 4~7): {medium}만원/월

BridgeSection 점수 테이블 아래에 삽입.

### 검증

- [ ] 총 누수 카드가 브릿지 섹션 내에 렌더링
- [ ] 우선순위별 금액 분류
- [ ] 항목별 합산 = 총액 일치
- [ ] 면책 문구 포함
- [ ] `pnpm build` 통과

---

## Phase 5 (C-03 + D-01) 참고

C-03 (PDF 반영)은 Phase 4 완료 후 진행. B-01 브릿지와 B-02 우선순위 설명은 이미 PDF에 반영됨 (Phase 1).
D-01 (정합성 검증)은 모든 Phase 완료 후 최종 검증.

---

## 리스크

| 리스크                                  | 대응                                           |
| --------------------------------------- | ---------------------------------------------- |
| 업종 벤치마크 정확도                    | 면책 문구 필수. "업종 평균 기준 추정치"        |
| 업종 미입력 시 동작                     | default 벤치마크로 자동 fallback               |
| 원화 금액이 비현실적 (너무 크거나 작음) | min/max 클램핑 (월 1만원~1,000만원)            |
| 기존 인사이트에 impact 필드 없는 경우   | severity 기반으로 추정. impact 텍스트는 보너스 |

---

## 실행 순서

```
1. Task 4.6 (config/revenue.ts + calculateRevenueImpact) — 선행 인프라
2. C-01 (AIInsightsSection 원화 환산) — 4.6 함수 활용
3. C-02 (TotalLeakageCard) — C-01 결과 합산
→ 커밋 → tsc → lint → build 검증
```

---

## 검증 게이트

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build
```
