# Task 3.4 — CMS 감지

## 목표

HTML 원문에서 WordPress, Shopify, Wix 등 CMS/프레임워크를 자동 판별하는 순수 파서 함수.
완료 시: `detectCms(html)` → `CmsData { detected, confidence, technologies }` 반환.

---

## 설계 판단: Wappalyzer npm vs 커스텀 정규식

| 기준             | Wappalyzer npm  | 커스텀 정규식                  |
| ---------------- | --------------- | ------------------------------ |
| 감지 범위        | 1,500+ 기술     | 15개 주요 CMS                  |
| 번들 크기        | +200KB~         | 0KB                            |
| 기존 패턴 일관성 | ✗ (외부 의존성) | ✓ (robots-txt, sitemap과 동일) |
| 테스트 용이성    | ✗ (mock 필요)   | ✓ (순수 함수)                  |
| 유지보수         | 패키지 업데이트 | 패턴 추가 필요                 |

**결정: 커스텀 정규식** — 이유:

1. PRD 아키텍처상 Wappalyzer는 Layer 3 (Task 3.9 영역), Task 3.4는 Layer 1
2. 기존 파서 패턴(순수 함수, 외부 의존성 없음)과 일관성 유지
3. Findably 타겟 고객(한국 스타트업/소규모)에 중요한 15개 CMS면 충분
4. Layer 3에서 Wappalyzer 추가 시 confidence 보강 가능 (확장 슬롯)

---

## 감지 대상 CMS (15개)

### 글로벌

| CMS         | 시장 점유 | 감지 신호                                     |
| ----------- | --------- | --------------------------------------------- |
| WordPress   | ~43%      | `wp-content/`, `wp-includes/`, meta generator |
| Shopify     | ~4%       | `cdn.shopify.com`, meta generator             |
| Wix         | ~3%       | `static.wixstatic.com`, meta generator        |
| Squarespace | ~2%       | `static.squarespace.com`, meta generator      |
| Drupal      | ~2%       | `Drupal.settings`, meta generator             |
| Joomla      | ~1%       | `/media/system/js/`, meta generator           |
| Ghost       | <1%       | `ghost-` 클래스, meta generator               |
| Webflow     | <1%       | `webflow.com`, `w-` 클래스                    |

### 한국 특화

| CMS             | 용도     | 감지 신호                    |
| --------------- | -------- | ---------------------------- |
| Cafe24          | 쇼핑몰   | `cafe24.com`, `EC-` 스크립트 |
| 식스샵(SixShop) | 쇼핑몰   | `sixshop.com`                |
| Gnuboard        | 커뮤니티 | `gnuboard`, `/bbs/`          |
| XpressEngine    | 커뮤니티 | `xe.js`, `XpressEngine`      |

### 프레임워크 (CMS 미감지 시 보조)

| 프레임워크 | 감지 신호                       |
| ---------- | ------------------------------- |
| Next.js    | `__NEXT_DATA__`, `_next/static` |
| Nuxt.js    | `__NUXT__`, `_nuxt/`            |
| Gatsby     | `___gatsby`, `gatsby-`          |

---

## Confidence 점수 기준

| 감지 방법                      | 점수 | 설명             |
| ------------------------------ | ---- | ---------------- |
| `<meta name="generator">` 일치 | 95   | 가장 확실한 신호 |
| HTML 패턴 2개+ 일치            | 85   | 복수 증거        |
| HTML 패턴 1개 일치             | 60   | 단일 증거        |
| 미감지                         | 0    | detected: null   |

---

## 변경 파일 (3개 신규, 1개 수정)

| 파일                                                  | 상태     | 내용                        |
| ----------------------------------------------------- | -------- | --------------------------- |
| `src/features/crawling/parsers/cms.ts`                | **신규** | `detectCms(html)` 순수 파서 |
| `src/features/crawling/constants.ts`                  | **수정** | `CMS_SIGNATURES` 상수 추가  |
| `src/features/crawling/parsers/__tests__/cms.test.ts` | **신규** | 테스트 ~20개                |
| `src/features/crawling/index.ts`                      | **수정** | `detectCms` re-export 추가  |

---

## 변경 상세

### 1. CMS_SIGNATURES 상수 (`constants.ts`에 추가)

```ts
interface CmsSignature {
  name: string
  metaGenerator: RegExp | null // <meta name="generator"> 매칭
  patterns: RegExp[] // HTML 내 존재 여부 체크
  category: 'cms' | 'framework' // CMS vs 프레임워크 구분
}

export const CMS_SIGNATURES: CmsSignature[] = [
  {
    name: 'WordPress',
    metaGenerator: /wordpress/i,
    patterns: [/wp-content\//i, /wp-includes\//i, /wp-json\//i],
    category: 'cms',
  },
  // ... 15개
]
```

### 2. detectCms 파서 (`parsers/cms.ts`)

```ts
export function detectCms(html: string | null): CmsData

내부 흐름:
1. null/빈 문자열 → { detected: null, confidence: 0, technologies: [] }
2. extractMetaGenerator(html) → generator 문자열 추출
3. CMS_SIGNATURES 순회:
   a. metaGenerator 일치 → confidence 95
   b. patterns 2개+ 일치 → confidence 85
   c. patterns 1개 일치 → confidence 60
4. 매칭된 모든 기술을 technologies[]에 수집
5. confidence 가장 높은 것을 detected에 설정
```

### 3. 테스트 (~20개)

```
기본 동작 (3개):
  - null 입력 → detected: null, confidence: 0
  - 빈 HTML → detected: null, confidence: 0
  - CMS 없는 순수 HTML → detected: null

meta generator 감지 (4개):
  - WordPress generator → detected: 'WordPress', confidence: 95
  - Shopify generator → detected: 'Shopify', confidence: 95
  - Wix generator → detected: 'Wix', confidence: 95
  - 알 수 없는 generator → detected: null

HTML 패턴 감지 (5개):
  - wp-content + wp-includes → confidence: 85
  - wp-content만 → confidence: 60
  - cdn.shopify.com → confidence: 60
  - cafe24 패턴 → detected: 'Cafe24'
  - __NEXT_DATA__ → detected: 'Next.js', category: framework

복합 감지 (3개):
  - WordPress generator + wp-content → confidence: 95 (generator 우선)
  - 여러 기술 동시 감지 → technologies에 모두 포함
  - CMS + framework 동시 → CMS가 detected 우선

엣지 케이스 (3~4개):
  - BOM 포함 HTML
  - 대소문자 혼합 meta 태그
  - meta generator 내용이 비어있음
  - 매우 긴 HTML (성능)
```

### 4. index.ts 수정 (+1줄)

```ts
export { detectCms } from './parsers/cms'
```

---

## 스코프 외 (하지 않을 것)

- Wappalyzer npm 설치 (Layer 3, Task 3.9에서)
- HTTP 헤더 기반 감지 (n8n이 헤더를 별도로 전달할 때)
- CMS 버전 추출 (Phase 2)
- Playwright 통합 (Task 3.10에서)

---

## 리스크

| 리스크                  | 대응                                                                      |
| ----------------------- | ------------------------------------------------------------------------- |
| 정규식 15개 순회 성능   | HTML 1회 순회로 모든 패턴 체크. 10MB 제한(MAX_RESPONSE_BYTES) 내 문제없음 |
| 새 CMS 추가 필요        | CMS_SIGNATURES 배열에 1줄 추가로 확장 가능                                |
| 오감지 (false positive) | confidence 점수로 신뢰도 표현. 60점은 "추정"                              |

---

## 검증

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test
```

- 테스트 ~20개 전체 통과
- 기존 테스트 (131개) 회귀 없음
- CMS_SIGNATURES 상수가 index.ts에서 정상 export
