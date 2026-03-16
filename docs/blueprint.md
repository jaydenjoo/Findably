# Task 5.6 — 90일 로드맵 자동 생성

## 목표

5개 AI 에이전트 인사이트 + 무료 진단 Quick Win + 카테고리 점수를 종합하여 **실행 가능한 90일 로드맵**을 rule-based로 자동 생성한다.

현재: competitors 에이전트 1개만 로드맵 생성 → 실패 시 빈 배열.
목표: 모든 데이터 소스를 활용하여 보강된 로드맵 생성. **추가 AI API 호출 0회, 비용 0원.**

완료 조건:

- `generateRoadmap()` 함수가 5개 에이전트 + Quick Win + 점수를 모두 반영한 `RoadmapItem[]` 반환
- competitors 에이전트 실패해도 나머지 데이터로 기본 로드맵 생성 가능
- 12주(90일)를 3개 Phase로 분배 (즉시/단기/중장기)
- 기존 테스트 깨지지 않음 + 신규 테스트 커버리지 80%+

---

## 기술 접근법

### 1. 새 파일 생성

**`src/features/diagnosis-paid/services/generate-roadmap.ts`**

```
export function generateRoadmap(params: {
  agentResults: AIAgentResult[]
  categoryScores: CategoryScore[]
  overallScore: OverallScore
  quickWins: QuickWin[]
  competitorRoadmap: RoadmapItem[]  // competitors 에이전트 파싱 결과 (빈 배열 가능)
  competitorAnalyses?: CompetitorAnalysis[]
}): RoadmapItem[]
```

로직 (rule-based, AI 호출 없음):

**Phase 1: 즉시 실행 (Week 1–4) — "지금 바로 고치세요"**

- Quick Win 항목 → week 1–2, priority: high
- critical severity 인사이트 → week 2–4, priority: high
- 점수 < 40 카테고리 중 가장 낮은 것 → week 3–4, priority: high

**Phase 2: 단기 개선 (Week 5–8) — "한 달 안에 개선하세요"**

- warning + actionable 인사이트 → week 5–6, priority: medium
- 경쟁사 갭(gaps) 항목 → week 7–8, priority: medium
- 점수 40–69 카테고리 → week 5–8, priority: medium

**Phase 3: 중장기 최적화 (Week 9–12) — "꾸준히 최적화하세요"**

- info + actionable 인사이트 → week 9–10, priority: low
- 경쟁사 강점 대응 → week 11–12, priority: low
- 전체 점수 기반 총평 항목 → week 12, priority: low

보강 규칙:

1. competitors 로드맵이 있으면 → 베이스로 사용 + 다른 데이터로 누락 주차 보강
2. competitors 로드맵이 없으면 → 순수 rule-based로 12주 전체 생성
3. 주차별 최대 3개 항목 (과도한 나열 방지)
4. 전체 최대 24개 항목
5. 중복 제거: title 기반 유사도 비교
6. estimatedImpact: critical=9–10, warning=6–8, info=3–5 (severity 기반)
7. category: 인사이트의 category 또는 Quick Win의 category 그대로 사용

### 2. 기존 파일 수정

**`src/features/diagnosis-paid/services/run-diagnosis-paid.ts`**

- `aggregateResults()` 함수 수정 (Task 5.5 SWOT과 동일 패턴)

```
// before (현재)
const { roadmap, competitors } = parsed

// after (변경)
const roadmap = generateRoadmap({
  agentResults,
  categoryScores: freeAnalysis.overallScore.categories,
  overallScore: freeAnalysis.overallScore,
  quickWins: freeAnalysis.quickWins,
  competitorRoadmap: parsed.roadmap,
  competitorAnalyses: competitors,
})
```

**`src/features/diagnosis-paid/index.ts`**

- `generateRoadmap` export 추가

### 3. 새 테스트 파일

**`src/features/diagnosis-paid/services/__tests__/generate-roadmap.test.ts`**

테스트 시나리오:

- 데이터 없음 → 빈 로드맵 (graceful)
- Quick Win → Phase 1 (week 1–2) 배치
- critical 인사이트 → Phase 1 (week 2–4), high priority
- warning+actionable → Phase 2 (week 5–6), medium priority
- info+actionable → Phase 3 (week 9–10), low priority
- 낮은 점수 카테고리 → Phase 1에 배치
- 경쟁사 갭 → Phase 2에 배치
- competitors 로드맵 베이스 사용
- competitors 실패 → 나머지 데이터로 기본 로드맵 생성
- 전체 최대 24개 항목 제한
- 주차별 최대 3개 항목 제한
- 중복 제거 동작
- competitors 에이전트 인사이트 스킵 (이미 로드맵으로 반영)
- failed 에이전트 스킵
- estimatedImpact severity 기반 배정
- 입력 competitorRoadmap 불변성

---

## 이탈/비정상 시나리오

| 시나리오                                    | 대응                                                     |
| ------------------------------------------- | -------------------------------------------------------- |
| 모든 에이전트 실패 + Quick Win 0개          | 카테고리 점수 기반 최소 로드맵 (낮은 카테고리 개선 항목) |
| Quick Win 10개 이상                         | Phase 1에 상위 3개만 배치, 나머지 Phase 2로 이동         |
| 동일 카테고리 인사이트 과다                 | 카테고리별 최대 3개 필터 후 우선순위순 배치              |
| competitors 로드맵 + 에이전트 인사이트 중복 | title 유사도 비교로 중복 제거                            |

---

## 리스크

| 리스크                                  | 확률 | 대응                                                    |
| --------------------------------------- | ---- | ------------------------------------------------------- |
| 주차 배분 정확도                        | 중   | severity/priority 기반 기계적 배분 → "충분히 좋은" 수준 |
| 중복 항목                               | 중   | title includes 기반 비교 (generate-swot.ts 패턴 재사용) |
| aggregateResults 수정 시 기존 로직 깨짐 | 낮   | 로드맵 생성만 분리, 나머지 로직 불변                    |
| 타입 불일치                             | 낮   | 기존 RoadmapItem 타입 그대로 사용                       |
| 항목 수 과다                            | 중   | 주차별 3개 + 전체 24개 하드 리밋                        |

---

## 검증 방법

```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 린트
npx eslint .

# 3. 테스트 (신규 + 기존)
npx vitest run src/features/diagnosis-paid/services/__tests__/generate-roadmap.test.ts
npx vitest run

# 4. 빌드
pnpm build
```

셀프체크:

- [ ] 역할: generateRoadmap은 로드맵 생성만 담당 (SRP)
- [ ] 흐름: agentResults + quickWins + scores → rule 분류 → RoadmapItem[] 반환
- [ ] 이유: competitors 단독 의존 제거 → 내결함성 향상
- [ ] 영향: aggregateResults() 호출 변경만, 다른 모듈 영향 없음

---

## 파일 변경 요약

| 파일                                          | 작업                           | 줄 수 (예상) |
| --------------------------------------------- | ------------------------------ | ------------ |
| `services/generate-roadmap.ts`                | 신규                           | ~180         |
| `services/run-diagnosis-paid.ts`              | 수정 (aggregateResults 내 5줄) | ~7 변경      |
| `index.ts`                                    | export 추가                    | ~1           |
| `services/__tests__/generate-roadmap.test.ts` | 신규                           | ~250         |
| **합계**                                      | 신규 2, 수정 2                 | ~438         |
