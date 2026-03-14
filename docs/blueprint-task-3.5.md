# Task 3.5 — 모바일 크롤링

## 목표

모바일 뷰포트(375px) 기준으로 HTML을 분석하여 모바일 호환성을 판별하는 순수 파서 함수.
완료 시: `checkMobile(html)` → `MobileData { viewport_configured, touch_friendly, issues }` 반환.

---

## 설계 판단: Playwright 실제 렌더링 vs HTML 정적 분석

| 기준             | Playwright 렌더링           | HTML 정적 분석                      |
| ---------------- | --------------------------- | ----------------------------------- |
| 정확도           | 실제 레이아웃 확인 가능     | meta/패턴 기반 추론                 |
| 의존성           | Playwright 필요 (Task 3.10) | 0개 (순수 함수)                     |
| 기존 패턴 일관성 | ✗ (비동기, 브라우저 필요)   | ✓ (robots-txt, sitemap, cms와 동일) |
| 비용             | 브라우저 인스턴스 필요      | 0원                                 |

**결정: HTML 정적 분석** — 이유:

1. PRD Layer 1 = n8n이 fetch한 HTML 텍스트 분석. Playwright 통합은 Task 3.10 영역
2. 기존 파서 패턴(순수 함수, 외부 의존성 없음)과 일관성 유지
3. `<meta name="viewport">` + 터치 친화성 신호로 충분한 1차 판별 가능
4. Task 3.10에서 Playwright 실제 렌더링 시 결과 보강 가능 (확장 슬롯)

---

## 모바일 체크 항목 (3개 카테고리)

### 1. viewport_configured (뷰포트 설정 여부)

`<meta name="viewport" content="...">` 존재 + 적절한 설정 확인.

| 체크                 | 조건                                | 결과                            |
| -------------------- | ----------------------------------- | ------------------------------- |
| meta viewport 존재   | `<meta name="viewport">` 태그 있음  | 기본 통과                       |
| width=device-width   | content에 `width=device-width` 포함 | 적절 설정                       |
| initial-scale=1      | content에 `initial-scale=1` 포함    | 적절 설정                       |
| meta viewport 미존재 | 태그 없음                           | ❌ `viewport_configured: false` |
| user-scalable=no     | 확대 차단                           | ⚠️ issue 추가 (접근성)          |
| maximum-scale=1      | 확대 제한                           | ⚠️ issue 추가 (접근성)          |

### 2. touch_friendly (터치 친화성)

HTML 패턴으로 터치 최적화 여부 추론.

| 신호                                         | 판단                 | 가중 |
| -------------------------------------------- | -------------------- | ---- |
| viewport 적절 설정                           | 필수 전제            | 필수 |
| `<meta name="mobile-web-app-capable">`       | 모바일 앱 모드 지원  | 긍정 |
| `<meta name="apple-mobile-web-app-capable">` | iOS 앱 모드 지원     | 긍정 |
| `<meta name="theme-color">`                  | 모바일 브라우저 테마 | 긍정 |
| `<link rel="manifest">`                      | PWA manifest         | 긍정 |
| 고정 너비 (`width: [0-9]+px` on body/html)   | 반응형 아님          | 부정 |

**판정 규칙:**

- viewport 미설정 → `touch_friendly: false`
- viewport 설정 + 고정 너비 없음 → `touch_friendly: true`
- viewport 설정 + 고정 너비 있음 → `touch_friendly: false`

### 3. issues (발견된 문제 목록)

| 이슈                    | 조건                           | 메시지                       |
| ----------------------- | ------------------------------ | ---------------------------- |
| 뷰포트 미설정           | meta viewport 없음             | `"viewport_missing"`         |
| width=device-width 누락 | viewport는 있지만 width 미설정 | `"viewport_no_device_width"` |
| 확대 차단               | `user-scalable=no`             | `"zoom_disabled"`            |
| 확대 제한               | `maximum-scale` ≤ 1            | `"zoom_limited"`             |
| 고정 너비               | body/html에 고정 px 너비       | `"fixed_width_layout"`       |

---

## 변경 파일 (2개 신규, 1개 수정)

| 파일                                                     | 상태     | 내용                          |
| -------------------------------------------------------- | -------- | ----------------------------- |
| `src/features/crawling/parsers/mobile.ts`                | **신규** | `checkMobile(html)` 순수 파서 |
| `src/features/crawling/parsers/__tests__/mobile.test.ts` | **신규** | 테스트 ~18개                  |
| `src/features/crawling/index.ts`                         | **수정** | `checkMobile` re-export 추가  |

> `constants.ts` 수정 없음 — `MOBILE_USER_AGENT`, `MOBILE_VIEWPORT`는 이미 Task 3.1에서 정의 완료.
> `types.ts` 수정 없음 — `MobileData` 인터페이스는 이미 Task 3.1에서 정의 완료.

---

## 변경 상세

### 1. checkMobile 파서 (`parsers/mobile.ts`)

```ts
export function checkMobile(html: string | null): MobileData

내부 흐름:
1. null/빈 문자열 → { viewport_configured: false, touch_friendly: false, issues: ['viewport_missing'] }
2. extractViewportContent(html) → viewport meta content 추출
3. viewport 존재 여부 + 속성 분석 → viewport_configured 판정
4. 터치 친화성 신호 수집 → touch_friendly 판정
5. 발견된 문제 → issues[] 수집
```

### 2. 테스트 (~18개)

```
기본 동작 (3개):
  - null 입력 → viewport_configured: false, issues: ['viewport_missing']
  - 빈 HTML → viewport_configured: false
  - viewport 없는 순수 HTML → viewport_configured: false

viewport 감지 (5개):
  - width=device-width + initial-scale=1 → viewport_configured: true
  - width=device-width만 → viewport_configured: true
  - viewport 있지만 width 미설정 → issue: 'viewport_no_device_width'
  - user-scalable=no → issue: 'zoom_disabled'
  - maximum-scale=1 → issue: 'zoom_limited'

터치 친화성 (4개):
  - 적절한 viewport → touch_friendly: true
  - viewport 미설정 → touch_friendly: false
  - 고정 너비 → touch_friendly: false, issue: 'fixed_width_layout'
  - PWA manifest + theme-color → touch_friendly: true

복합 케이스 (3개):
  - 모든 신호 긍정 → issues: [] (빈 배열)
  - viewport + 확대차단 + 고정너비 → issues 복수
  - 실제 WordPress 모바일 최적화 HTML → 정상 감지

엣지 케이스 (3개):
  - BOM 포함 HTML
  - 대소문자 혼합 meta 태그
  - viewport content 비어있음
```

### 3. index.ts 수정 (+1줄)

```ts
export { checkMobile } from './parsers/mobile'
```

---

## 스코프 외 (하지 않을 것)

- Playwright 실제 렌더링 (Task 3.10에서)
- 모바일 스크린샷 캡처 (Phase 2)
- CSS 미디어쿼리 분석 (CSS 파싱 필요, 오버스코프)
- JavaScript 반응형 감지 (런타임 필요)
- 터치 타겟 크기 측정 (렌더링 필요, Task 3.10)

---

## 리스크

| 리스크                                          | 대응                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| viewport meta 있어도 실제로 반응형 아닐 수 있음 | confidence 개념 없이 boolean으로 표현 (MobileData 스펙). Task 3.10에서 실제 렌더링으로 보강 |
| 고정 너비 감지 오탐                             | body/html 태그 인라인 스타일만 체크. CSS 파일 분석은 스코프 외                              |
| 새로운 viewport 속성 등장                       | 현재 표준 속성만 체크. 추후 패턴 추가 용이                                                  |

---

## 검증

```bash
pnpm tsc --noEmit && pnpm lint && pnpm build && pnpm test
```

- 테스트 ~18개 전체 통과
- 기존 테스트 회귀 없음
- `checkMobile`이 index.ts에서 정상 export
