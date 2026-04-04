# Phase 3 Blueprint — 성능 + UX

> PRD: docs/Findably-PRD-홈페이지-리포트-정합성-v1_2.md
> 브랜치: feature/phase-3
> 총 2개 Task, 예상 ~5.5시간

---

## 목표

Phase 3 완료 시 상태:

1. 랜딩 비첫화면 컴포넌트가 next/dynamic으로 코드 분할됨 (LCP 개선)
2. 히어로 CTA에 안전성 신호 3개 추가됨 ("무료", "카드 불필요", "60초")
3. 푸터 내부 링크 확장됨 (FAQ, 진단하기 등)
4. 본문 내 상호 참조 링크 추가됨

---

## Task E-07 (8.19): LCP 성능 최적화

### 접근 방식

PRD 목표: LCP 5.9초 → 2.5초 이하. 현재 이미지가 없으므로 주요 병목은 JS 번들.

**실행 가능한 최적화:**

1. 비첫화면 랜딩 컴포넌트를 `next/dynamic`으로 lazy load
2. 폰트 weight 최적화 (사용하지 않는 weight 제거)
3. framer-motion이 히어로 외 섹션에서 SSR 불필요 → dynamic import

**E-06 이미지 미추가 상태이므로**, 이미지 최적화(3단계)는 해당 없음.

### 수정 파일

| 파일                           | 변경 내용                                      |
| ------------------------------ | ---------------------------------------------- |
| `src/app/(marketing)/page.tsx` | 비첫화면 6개 컴포넌트 → next/dynamic lazy load |

### page.tsx 변경

현재 9개 섹션 모두 정적 import. 히어로(Hero)만 즉시 로드, 나머지는 dynamic:

```typescript
// 즉시 로드 (첫 화면)
import Hero from '@/components/landing/hero-section'

// Lazy load (스크롤 후 보이는 섹션)
const PainPoints = dynamic(() => import('@/components/landing/pain-points'))
const ScorePreview = dynamic(() => import('@/components/landing/score-preview'))
const FeatureTabs = dynamic(
  () => import('@/components/landing/features-section')
)
const ComparisonTable = dynamic(
  () => import('@/components/landing/comparison-table')
)
const HowItWorks = dynamic(
  () => import('@/components/landing/how-it-works-section')
)
const CustomerConcerns = dynamic(
  () => import('@/components/landing/customer-concerns')
)
const Pricing = dynamic(() => import('@/components/landing/pricing'))
const FaqSection = dynamic(() => import('@/components/landing/faq-section'))
const BottomCTA = dynamic(() => import('@/components/landing/cta-section'))
```

### 검증

- [ ] 랜딩 첫 화면(히어로)이 빠르게 렌더링
- [ ] 스크롤 시 나머지 섹션 정상 로드
- [ ] `pnpm build` 통과

---

## Task E-08 (8.20): CTA 안전성 신호 + 모바일 터치 + 내부 링크

### 수정 파일

| 파일                                           | 변경 내용                         |
| ---------------------------------------------- | --------------------------------- |
| `src/components/landing/hero-section.tsx`      | 신뢰 지표를 안전성 신호로 변경    |
| `src/components/landing/cta-section.tsx`       | 하단 CTA에도 안전성 신호 추가     |
| `src/components/landing/footer.tsx`            | 내부 링크 확장 (진단하기, FAQ 등) |
| `src/components/landing/customer-concerns.tsx` | FAQ 링크 연결                     |

### hero-section.tsx — 안전성 신호

현재 (`line:130`): `"URL만 입력 · 약 60초 안에 결과 · 무료 진단"`

변경:

```
✓ 첫 진단 완전 무료  ✓ 카드 정보 불필요  ✓ 60초면 결과 확인
```

→ 체크마크(✓)로 시각적 안전감 강화

### cta-section.tsx — 하단 CTA 안전성 신호

URL 입력 아래에 동일 안전성 신호 추가.

### footer.tsx — 내부 링크 확장

현재: 가격 | 샘플 리포트 | 이용약관 | 개인정보처리방침 (4개)

변경:

```
제품: 무료 마케팅 진단 | 가격 안내 | 샘플 리포트 | 자주 묻는 질문
법적: 이용약관 | 개인정보처리방침
```

→ "무료 마케팅 진단" (/#diagnose), "자주 묻는 질문" (/#faq) 앵커 링크 추가

### customer-concerns.tsx — FAQ 연결

"이런 고민이 있으시다면" 섹션 하단에:

```
더 궁금한 점이 있으신가요? → 자주 묻는 질문 보기
```

→ `/#faq` 앵커 링크

### 검증

- [ ] 히어로 CTA 근처에 ✓ 안전성 신호 3개 표시
- [ ] 하단 CTA에도 안전성 신호 표시
- [ ] 푸터 내부 링크 6개 이상
- [ ] customer-concerns → FAQ 링크 동작
- [ ] 모바일에서 터치 요소 44px 이상 (기존 min-h-[44px] 확인)
- [ ] `pnpm build` 통과

---

## 리스크

| 리스크                                     | 대응                                                     |
| ------------------------------------------ | -------------------------------------------------------- |
| dynamic import로 CLS 발생                  | 각 섹션 높이가 유동적이라 CLS 영향 적음. Skeleton 불필요 |
| framer-motion whileInView가 dynamic과 충돌 | viewport={{ once: true }}라 한 번만 트리거. 정상 동작    |
| 앵커 링크(/#faq)가 dynamic 로딩 전 스크롤  | FAQ가 Pricing 아래라 스크롤 시점에 이미 로드됨           |

---

## 실행 순서

```
1. E-07 (LCP) — page.tsx dynamic import 적용
2. E-08 (CTA+링크) — 안전성 신호 + 푸터 + 상호 참조
→ 커밋 → tsc → lint → build 검증
```

---

## 검증 게이트

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build
```
