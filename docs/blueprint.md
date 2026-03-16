# Task 7.7: CMS 감지 기반 맞춤 가이드 — 구현 계획

## 목표

감지된 CMS에 따라 메타태그/Schema/일반 SEO 적용 방법을 CMS별 맞춤 가이드로 제공한다.

완료 조건:

- CMS별 가이드 데이터 확장 (Schema + 메타태그 + 일반 SEO 가이드)
- `/actions/meta-tags` 페이지에 CMS 가이드 섹션 추가
- CmsGuideSection 컴포넌트를 범용화하여 가이드 타입별 재사용 가능
- 기존 Schema 페이지 가이드 그대로 유지 (regression 없음)
- 빌드 통과 + 타입 체크 통과

---

## 현재 상태

### 이미 존재

- **`CMS_GUIDES`** (`features/actions/constants/cms-guides.ts`) — WordPress, Shopify, Wix, Squarespace + DEFAULT. 현재 Schema Markup 전용 steps만 있음
- **`CmsGuide` 타입** (`features/actions/types.ts`) — `{ cms, displayName, steps, pluginRecommendation?, codeLocation? }`
- **`CmsGuideSection`** (`actions/schema/_components/`) — 범용 렌더링 컴포넌트 (CmsGuide props 받음)
- **CMS 감지** (`features/crawling/parsers/cms.ts`) — `{ detected: string | null, confidence: number, technologies: string[] }`
- **Schema 페이지** — CmsGuideSection으로 CMS 가이드 표시 중 (동작 검증 완료)
- **Meta-tags 페이지** — Task 7.6 완료. CMS 가이드 미포함

### 없는 것

- 메타태그 적용을 위한 CMS별 가이드 데이터
- 일반 SEO 최적화를 위한 CMS별 가이드 데이터
- Meta-tags 페이지의 CMS 가이드 섹션
- CmsGuideSection 범용 공유 (현재 schema 전용 `_components/`에 위치)

---

## 기술 접근법

### 핵심 결정

1. **CmsGuideSection을 공유 컴포넌트로 이동**: `schema/_components/` → `components/shared/` (meta-tags + 향후 roadmap에서도 재사용)
2. **가이드 데이터 확장**: 기존 `CMS_GUIDES`(Schema용)는 유지하고, `CMS_META_GUIDES`(메타태그용) 상수를 추가
3. **타입 확장 불필요**: 기존 `CmsGuide` 타입 그대로 재사용 (steps/pluginRecommendation/codeLocation 구조가 동일)

### 왜 상수 분리인가?

각 가이드의 steps, pluginRecommendation, codeLocation이 완전히 다르다:

- Schema 가이드: "header.php에 JSON-LD 붙여넣기" / "Yoast SEO 플러그인"
- 메타태그 가이드: "Yoast SEO → SEO 제목/설명 수정" / "All in One SEO 플러그인"

하나의 CmsGuide에 두 가이드를 합치면 불필요하게 복잡해진다. 단순히 별도 상수가 최선.

---

### 파일 구조

```
변경/이동:
  src/app/(dashboard)/actions/schema/_components/CmsGuideSection.tsx
    → src/components/shared/CmsGuideSection.tsx  (공유로 이동)

신규:
  src/features/actions/constants/cms-meta-guides.ts  (메타태그용 CMS 가이드 데이터)

수정:
  src/app/(dashboard)/actions/schema/_components/SchemaContent.tsx  (import 경로 변경)
  src/app/(dashboard)/actions/meta-tags/_components/MetaTagContent.tsx  (CMS 가이드 섹션 추가)
  src/features/actions/index.ts  (새 상수 re-export)
```

**총 파일**: 이동 1개 + 신규 1개 + 수정 3개 = 5개

---

## 수정 상세

### 1. `CmsGuideSection.tsx` — 이동 (schema → shared)

**경로 변경**: `actions/schema/_components/CmsGuideSection.tsx` → `components/shared/CmsGuideSection.tsx`

코드 변경 없음. import 경로만 변경.

### 2. `cms-meta-guides.ts` — 신규 (메타태그용 CMS 가이드 데이터)

```typescript
import type { CmsGuide } from '../types'

export const CMS_META_GUIDES: Record<string, CmsGuide> = {
  WordPress: {
    cms: 'WordPress',
    displayName: 'WordPress',
    steps: [
      'WordPress 관리자 → 게시물/페이지 편집 화면을 엽니다.',
      'Yoast SEO (또는 Rank Math) 메타 박스에서 "SEO 제목"과 "메타 설명"을 수정합니다.',
      'OG 이미지는 "소셜" 탭에서 별도 설정할 수 있습니다.',
      '변경사항을 저장하고 미리보기로 확인합니다.',
    ],
    pluginRecommendation:
      'Yoast SEO 또는 Rank Math 플러그인을 사용하면 페이지별로 메타태그를 쉽게 관리할 수 있습니다.',
    codeLocation: 'SEO 플러그인 → 각 페이지 편집 화면',
  },
  Shopify: {
    cms: 'Shopify',
    displayName: 'Shopify',
    steps: [
      'Shopify 관리자 → 온라인 스토어 → 페이지(또는 상품)를 선택합니다.',
      '하단 "검색엔진 목록" 영역에서 "웹사이트 SEO 편집"을 클릭합니다.',
      '페이지 제목과 설명을 수정합니다.',
      'OG 이미지는 theme.liquid에서 직접 설정하거나 SEO 앱을 사용합니다.',
    ],
    codeLocation: '각 페이지/상품 → 검색엔진 목록',
  },
  Wix: {
    cms: 'Wix',
    displayName: 'Wix',
    steps: [
      'Wix 에디터에서 수정할 페이지를 엽니다.',
      '메뉴 → 페이지 SEO(기본) 탭을 클릭합니다.',
      '제목 태그, 메타 설명을 입력합니다.',
      'OG 이미지는 "소셜 공유" 탭에서 설정합니다.',
      '게시 버튼을 눌러 반영합니다.',
    ],
    codeLocation: '페이지 설정 → SEO(기본) 탭',
  },
  Squarespace: {
    cms: 'Squarespace',
    displayName: 'Squarespace',
    steps: [
      '수정할 페이지에서 톱니바퀴 아이콘(페이지 설정)을 클릭합니다.',
      '"SEO" 탭에서 SEO 제목과 SEO 설명을 입력합니다.',
      '"소셜 이미지" 탭에서 OG 이미지를 설정합니다.',
      '저장 후 라이브 사이트에서 확인합니다.',
    ],
    codeLocation: '페이지 설정 → SEO 탭',
  },
}

export const DEFAULT_CMS_META_GUIDE: CmsGuide = {
  cms: 'default',
  displayName: '일반 HTML',
  steps: [
    'HTML 파일의 <head> 영역을 엽니다.',
    '<meta name="title">, <meta name="description"> 태그를 추가하거나 수정합니다.',
    '<meta property="og:title">, <meta property="og:description">, <meta property="og:image"> 태그를 추가합니다.',
    '<link rel="canonical"> 태그로 대표 URL을 지정합니다.',
    '파일을 저장하고 서버에 배포한 뒤 소셜 공유 디버거로 확인합니다.',
  ],
  codeLocation: '<head> 영역',
}
```

### 3. `SchemaContent.tsx` — import 경로 수정

```diff
- import { CmsGuideSection } from './CmsGuideSection'
+ import { CmsGuideSection } from '@/components/shared/CmsGuideSection'
```

### 4. `MetaTagContent.tsx` — CMS 가이드 섹션 추가

```typescript
// 추가 import
import { CMS_META_GUIDES, DEFAULT_CMS_META_GUIDE } from '@/features/actions'
import { CmsGuideSection } from '@/components/shared/CmsGuideSection'

// props에 cmsDetected 추가 (page.tsx에서 전달)
interface MetaTagContentProps {
  crawlData: CrawlData | null
  url: string
  isPaid: boolean
  cmsDetected: string | null // 추가
}

// 렌더링 영역 (RecommendedMetaTagsSection 아래)
const metaGuide =
  cmsDetected && cmsDetected in CMS_META_GUIDES
    ? (CMS_META_GUIDES[cmsDetected] ?? DEFAULT_CMS_META_GUIDE)
    : DEFAULT_CMS_META_GUIDE

// isPaid일 때만 표시, 또는 BlurOverlay 래핑
```

### 5. `features/actions/index.ts` — re-export 추가

```diff
  export { CMS_GUIDES, DEFAULT_CMS_GUIDE } from './constants/cms-guides'
+ export { CMS_META_GUIDES, DEFAULT_CMS_META_GUIDE } from './constants/cms-meta-guides'
```

### 6. `meta-tags/page.tsx` — cmsDetected prop 전달

```typescript
const cmsDetected = crawlData?.cms?.detected ?? null
// MetaTagContent에 cmsDetected 추가 전달
```

---

## 리스크

| 리스크                                           | 심각도 | 대응                                                          |
| ------------------------------------------------ | ------ | ------------------------------------------------------------- |
| CmsGuideSection 이동 시 schema 페이지 regression | 🟢     | import 경로만 변경, 컴포넌트 코드 불변                        |
| CMS 미감지 (detected=null)                       | 🟢     | DEFAULT_CMS_META_GUIDE 표시                                   |
| 메타태그 가이드 내용 품질                        | 🟡     | 4개 CMS 공식 문서 기반 steps 작성                             |
| roadmap 페이지 아직 skeleton                     | 🟢     | 이번 Task에서 roadmap 가이드 추가 안 함 (skeleton 상태이므로) |

---

## 스코프 가드

- ❌ roadmap 페이지 CMS 가이드 → roadmap 페이지 구현 시(별도 Task)
- ❌ CMS 가이드 AI 자동 생성 → 하드코딩 상수로 충분
- ❌ CmsGuide 타입 변경 → 기존 타입 그대로 재사용
- ❌ 새 CMS 추가 (Webflow, Ghost 등) → Phase 2
- ❌ features/actions/ 모듈 구조 변경 → 상수 파일 1개 추가만

---

## 구현 순서

| 단계 | 파일                                    | 설명                               |
| ---- | --------------------------------------- | ---------------------------------- |
| 1    | CmsGuideSection.tsx                     | schema → shared로 이동             |
| 2    | SchemaContent.tsx                       | import 경로 수정 (regression 방지) |
| 3    | cms-meta-guides.ts                      | 메타태그용 CMS 가이드 데이터 생성  |
| 4    | features/actions/index.ts               | 새 상수 re-export                  |
| 5    | meta-tags/page.tsx + MetaTagContent.tsx | CMS 가이드 섹션 연결               |

---

## 검증 방법

```bash
# 1. 타입 체크
pnpm tsc --noEmit

# 2. 린트
pnpm lint

# 3. 빌드
pnpm build

# 4. 수동 확인
# - /actions/schema → CMS 가이드 여전히 정상 표시 (regression 없음)
# - /actions/meta-tags → CMS 가이드 섹션 표시 (유료: 전체, 무료: BlurOverlay)
# - CMS 미감지 → "일반 HTML" 가이드 표시
# - 모바일 반응형 확인
```
