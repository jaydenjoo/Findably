# 📚 Learnings — 복리 지식 저장소

> 같은 실수를 반복하지 않기 위한 교훈 기록
> **형식**: 증상 → 원인 → 해결 → **규칙** (규칙이 핵심!)

---

<!-- 예시 (실제 기록 시 이 예시는 삭제) -->

### 2026-03-10 [예시] Tailwind v4 그라데이션 클래스 변경

- **증상**: `bg-gradient-to-r` 클래스가 작동하지 않음
- **원인**: Tailwind v4에서 `bg-gradient-to-*` → `bg-linear-to-*`로 변경됨
- **해결**: 모든 그라데이션 클래스를 `bg-linear-to-*`로 교체
- **규칙**: Tailwind v4에서는 항상 `bg-linear-to-*` 사용. `npx @tailwindcss/upgrade` 실행으로 자동 변환 가능

---

<!-- 여기부터 실제 기록 -->

### 2026-03-13 Vitest fake timers + waitFor 교착 현상

- **증상**: `vi.useFakeTimers()` 사용 중 `waitFor()` 호출 → 무한 대기 → 테스트 타임아웃
- **원인**: `waitFor()`는 내부적으로 `setTimeout`으로 폴링하는데, fake timers가 이를 멈추므로 결코 완료되지 않음
- **해결**: `waitFor()` 대신 `await act(async () => { await vi.advanceTimersByTimeAsync(ms) })` 사용
- **규칙**: fake timers 사용 시 `waitFor()` 금지. 타이머 기반 상태 변화는 `vi.advanceTimersByTimeAsync()`로 직접 제어

### 2026-03-13 unstable useRouter mock → useEffect 무한 재실행

- **증상**: SessionExpiryWarning 테스트에서 타이머가 cleanup되어 경고 배너 안 나타남
- **원인**: `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))` — 매 render마다 새 객체 반환 → `useCallback` deps 변경 → `useEffect` cleanup+재실행 → 타이머 초기화
- **해결**: mock 외부에 `const mockRouter = { push: mockPush }` 선언 → `useRouter: () => mockRouter`로 안정 참조 반환
- **규칙**: hook이 반환하는 mock 객체는 반드시 모듈 스코프에 안정 참조로 선언. 매번 새 객체 반환하면 deps가 변해 side effect가 재실행됨

### 2026-03-13 base-ui(shadcn/ui) jsdom 호환 문제

- **증상**: shadcn/ui 컴포넌트(Button, Input, Label) 사용 시 jsdom에서 렌더링 실패
- **원인**: `@base-ui/react` 기반 shadcn/ui가 내부적으로 브라우저 전용 API 사용
- **해결**: `vi.mock('@/components/ui/button', () => ({ Button: ({ children, onClick, ...props }) => <button ...> }))` 식으로 단순 HTML 대체 mock 사용
- **규칙**: jsdom 환경 컴포넌트 테스트에서 shadcn/ui 컴포넌트는 반드시 단순 HTML 엘리먼트로 mock. mock 선언은 import 전에 위치

### 2026-03-16 Tailwind v4 `@theme inline` — hsl() 색상이 빈 문자열로 렌더링

- **증상**: `bg-findably-dark`, `text-findably-cyan` 등 커스텀 색상 유틸리티가 투명(transparent)으로 렌더링됨. 히어로 배경이 다크 네이비 대신 빈 배경으로 표시
- **원인**: Tailwind v4의 `@theme inline` 블록에서 `hsl(222 47% 5%)` (CSS Color Level 4 공백 구분 문법) 사용 시 변수값이 빈 문자열(`""`)로 resolve됨. `getComputedStyle`로 확인하면 `--color-findably-dark: ""`
- **해결**: 모든 `hsl()` 값을 hex로 변환 (`hsl(222 47% 5%)` → `#070a13`)
- **규칙**: `@theme inline` 블록에서는 반드시 hex 색상만 사용. `hsl()`, `rgb()`, `oklch()` 등 함수형 색상은 빈 문자열로 resolve될 수 있음. 단, `:root` 블록의 CSS 변수에서는 `oklch()` 정상 작동 (shadcn/ui가 이 방식 사용)

### 2026-03-16 shadcn/ui CardTitle는 `<div>` — Playwright heading 셀렉터 실패

- **증상**: `getByRole('heading', { name: '회원가입' })` → 요소 찾지 못함
- **원인**: shadcn/ui `CardTitle`이 `<div>`로 렌더링됨 (`card.tsx:36`: `React.ComponentProps<"div">`). `<h*>` 아님
- **해결**: `getByText('회원가입')` 또는 실제 `<h1>`/`<h2>` 요소를 직접 대상으로 변경
- **규칙**: Playwright E2E에서 shadcn/ui 카드 제목은 `getByRole('heading')` 대신 `getByText()` 사용. 실제 시맨틱 heading인지 먼저 DevTools로 확인

### 2026-03-16 Playwright strict mode — 다중 매칭 시 `.first()` 필수

- **증상**: `getByText(/그린테크/)` 등 locator가 strict mode 에러로 실패
- **원인**: Playwright는 기본적으로 strict mode — locator가 2개+ 요소에 매칭되면 에러 발생
- **해결**: 다중 매칭 가능한 locator에 `.first()` 추가
- **규칙**: 범용 텍스트 매칭(`getByText`, `getByRole`)은 항상 다중 매칭 가능성 고려. 확실하지 않으면 `.first()` 붙이거나, `locator('section').getByRole(...)` 등 scope를 좁혀서 사용

### 2026-03-16 Playwright 스크롤 검증 — 고정 좌표 대신 `querySelectorAll`로 실제 위치 조회

- **증상**: `window.scrollTo(0, 4200)` 실행 후 Pricing 섹션을 기대했으나 ScorePreview가 보임
- **원인**: 섹션 높이가 뷰포트/콘텐츠에 따라 다르므로 하드코딩 좌표는 부정확. framer-motion `whileInView` 애니메이션이 적용된 섹션은 스크롤 전까지 렌더링되지 않아 높이가 변동됨
- **해결**: `page.evaluate(() => [...document.querySelectorAll('main > section, main > div')].map(el => ({ tag: el.tagName, offsetTop: el.offsetTop, height: el.offsetHeight })))` 로 실제 위치를 조회 후 정확한 좌표로 스크롤
- **규칙**: Playwright에서 긴 페이지 섹션 검증 시 스크롤 좌표를 하드코딩하지 말 것. 반드시 `page.evaluate`로 DOM에서 실제 `offsetTop`을 조회하고, 해당 좌표로 스크롤. 특히 framer-motion 등 뷰포트 진입 시 렌더링되는 애니메이션이 있으면 섹션 높이가 동적으로 변함

### 2026-03-16 다크 네비게이션 바에서 텍스트 색상 — `text-slate-900` 안 보임

- **증상**: Navbar의 "로그인" 링크가 어두운 배경(`bg-findably-dark`) 위에서 거의 보이지 않음
- **원인**: `text-slate-900` (#0f172a)는 `findably-dark` (#070a13)과 명도 차이가 거의 없어 대비비 1.2:1 이하
- **해결**: `text-slate-300` (#cbd5e1)으로 변경 → 어두운 배경 위에서 충분한 대비 확보
- **규칙**: 어두운 배경(gray-800+, findably-dark 등) 위 텍스트는 반드시 `text-slate-300` 이상 밝은 색 사용. WCAG AA 기준 4.5:1 대비비 충족 확인. 네비게이션처럼 배경이 투명↔어두운 색으로 전환되는 컴포넌트는 모든 상태에서 텍스트 가독성 확인

### 2026-03-16 framer-motion `whileInView` 섹션 — Playwright 스크린샷 타이밍

- **증상**: Playwright로 특정 섹션 스크린샷 캡처 시 요소가 `opacity: 0` 상태로 찍힘 (빈 카드)
- **원인**: framer-motion의 `whileInView` + `initial={{ opacity: 0, y: 30 }}` 조합은 뷰포트에 진입해야 애니메이션 시작. 스크롤 직후 즉시 캡처하면 아직 `opacity: 0`
- **해결**: 스크롤 후 `waitForTimeout(1000)` 또는 `waitForSelector('[style*="opacity: 1"]')` 등으로 애니메이션 완료 대기 후 캡처
- **규칙**: framer-motion `whileInView` 사용 섹션을 Playwright로 검증할 때는 스크롤 후 최소 700ms~1s 대기 필요 (transition duration 0.7s 기준). `viewport={{ once: true }}` 설정이면 한 번만 대기하면 됨

### 2026-03-19 Vercel 서버리스에서 fire-and-forget 패턴 실패

- **증상**: `submit-url.ts`에서 `void triggerCrawl(...)` 후 `redirect()` 호출 → n8n 웹훅이 아예 전송되지 않음. 프로덕션에서 URL 제출 후 분석이 시작되지 않고 "작업중"에서 멈춤
- **원인**: Vercel 서버리스(Lambda)는 `redirect()`로 응답을 보낸 직후 Lambda를 freeze/종료함. `void promise`는 await되지 않으므로 응답 후 실행이 보장되지 않음. 로컬에서는 Node.js 프로세스가 계속 살아있어 정상 동작하지만, Vercel에서는 실패
- **해결**: (1) Server Action: `void` → `await` 패턴으로 변경 (redirect 전에 완료) (2) API Route: `fetch().catch()` → `after()` API (Next.js 15+)로 변경 (Vercel `waitUntil`로 Lambda 수명 연장)
- **규칙**: Vercel 서버리스에서 `void promise`, `promise.then().catch()`, `setTimeout` 등 fire-and-forget 패턴은 절대 사용 금지. 반드시 `await`하거나, 응답 후 실행이 필요하면 `after()` API 사용. `after()`는 `next/server`에서 import하며 Vercel에서 자동으로 `waitUntil`로 변환됨

### 2026-03-19 Next.js trailing slash 308 리다이렉트 → POST→GET 변환으로 405

- **증상**: n8n이 `/api/crawl/complete`로 POST 콜백 → 405 "Method Not Allowed". n8n 노드를 GET→POST로 바꿔도 동일
- **원인**: n8n 콜백 URL이 `/api/crawl/complete/` (trailing slash). Next.js는 trailing slash URL에 308 Permanent Redirect 반환. n8n의 axios는 리다이렉트를 따라가면서 **POST→GET으로 메서드를 변환** (HTTP 스펙: 308은 메서드 유지해야 하지만 많은 클라이언트가 GET으로 변환). route.ts에 `GET` 핸들러가 없으므로 405
- **해결**: `handleCallback()` 공통 함수로 추출 후 `export const POST = handleCallback` + `export const GET = handleCallback` 두 메서드 모두 export
- **규칙**: 외부 서비스(n8n, Stripe 웹훅 등)가 콜백하는 API Route는 반드시 POST + GET 모두 export. URL에 trailing slash가 붙을 수 있고, 리다이렉트 시 메서드가 바뀔 수 있음. 또는 `next.config.ts`에 `trailingSlash: true`를 설정해도 되지만, 이는 모든 라우트에 영향을 미치므로 개별 라우트에서 GET 추가가 더 안전
