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

### 2026-03-20 n8n workflow JSON에 API 키 하드코딩 → Git 커밋으로 시크릿 노출

- **증상**: `n8n/workflows/findably-crawl-v2-production.json`에 Firecrawl API 키(`fc-...`)와 콜백 Bearer 토큰이 하드코딩되어 Git에 커밋됨
- **원인**: n8n에서 workflow를 JSON으로 export하면 credential 참조가 아닌 실제 값이 포함됨. 이를 그대로 레포에 커밋
- **해결**: (1) JSON 내 시크릿을 `{{FIRECRAWL_API_KEY}}`, `{{N8N_CALLBACK_SECRET}}` 플레이스홀더로 교체 (2) `n8n/` 디렉토리를 `.gitignore`에 추가
- **규칙**: n8n workflow JSON을 Git에 저장할 때는 반드시 시크릿을 플레이스홀더로 교체하거나, n8n의 credential reference 방식 사용. 또는 workflow 파일 자체를 `.gitignore`에 추가하고 별도 시크릿 관리. export한 JSON은 커밋 전 `grep -i "bearer\|api_key\|secret\|password"` 로 점검

### 2026-03-20 디버그 전용 API 엔드포인트에 프로덕션 가드 누락 → 환경변수 메타데이터 노출

- **증상**: `/api/dev/env-check`가 프로덕션에서도 접근 가능. 환경변수 존재 여부, 길이, 앞 30자를 JSON으로 반환
- **원인**: 디버깅용 임시 엔드포인트에 `if (process.env.NODE_ENV === 'production') return 404` 가드를 넣지 않음. 같은 디렉토리의 `trigger-paid`는 가드가 있었으나 `env-check`에는 없음
- **해결**: `/api/dev/` 디렉토리 전체 삭제. 디버깅 완료 후 임시 엔드포인트는 즉시 제거
- **규칙**: 디버그/임시 API 엔드포인트는 (1) 반드시 `NODE_ENV === 'production'` 가드 추가 (2) 코드에 `// TODO: 디버깅 후 삭제` 주석 + PR 체크리스트에 삭제 확인 항목 추가 (3) 환경변수 값(길이, prefix 포함)을 응답에 포함하지 않기. 가장 안전한 방법: 디버깅 완료 즉시 삭제

### 2026-03-20 Playwright `force: true` 클릭은 Server Action `<form>` 제출을 트리거하지 않음

- **증상**: 로그아웃 버튼(`<button type="submit">` inside `<form action={logoutAction}>`)을 `{ force: true }`로 클릭해도 Server Action이 실행되지 않음. `waitForURL` 타임아웃
- **원인**: Playwright의 `force: true`는 actionability check(가시성, 활성화 등)만 우회할 뿐, DOM 이벤트 전파 방식이 달라 Server Action의 form submission을 정상 트리거하지 못함. Next.js dev overlay(`<nextjs-portal>`)가 pointer-events를 가로채는 것도 복합 원인
- **해결**: `page.evaluate(() => { const btn = document.querySelector('button[aria-label="로그아웃"]'); const form = btn?.closest('form'); if (form) form.requestSubmit() })`로 직접 폼 제출
- **규칙**: Playwright E2E에서 Server Action `<form>`의 submit 버튼 클릭이 안 되면 `page.evaluate(() => form.requestSubmit())`로 직접 제출. 특히 Next.js dev mode에서는 overlay가 클릭을 가로챌 수 있으므로 `requestSubmit()`이 가장 확실한 방법

### 2026-03-20 Playwright `toHaveURL` 정규식은 전체 URL에 매칭 (pathname 아님)

- **증상**: `await expect(page).toHaveURL(/^\/(login.*)?$/)` → `http://localhost:3600/login?redirectTo=...`에서 실패
- **원인**: `toHaveURL`의 정규식은 `pathname`이 아닌 **전체 URL 문자열** (`http://localhost:3600/...`)에 매칭. `^\/`는 `http://`로 시작하는 전체 URL과 매칭 불가
- **해결**: `^` 앵커 제거 → `/\/(login.*)?$/`
- **규칙**: Playwright `toHaveURL` 정규식 작성 시 `^` 앵커를 사용하면 전체 URL(`http://host/path`)의 시작과 매칭되므로 pathname만 검증할 때는 `^` 없이 작성. 또는 `page.url()`로 URL을 추출해서 `new URL(url).pathname`으로 비교

### 2026-03-20 E2E에서 in-memory rate limit 테스트 — 동일 유저 테스트 간 quota 공유

- **증상**: 결제 API E2E 테스트가 개별 `test()` 함수로 분리되었을 때, 2~3번째 테스트부터 429 응답. 기대 상태코드(400, 200)와 불일치
- **원인**: in-memory rate limit(`payment:${user.id}` 키, 3회/60초)은 서버 프로세스 단위. 동일 테스트 계정으로 로그인하는 모든 Playwright 테스트가 동일 quota를 공유. 테스트마다 새 로그인 세션이어도 서버 측 user.id는 동일
- **해결**: 모든 checkout API 호출(검증 실패 2건 + 성공 1건 + rate limit 초과 1건)을 단일 `test()` 안의 단일 로그인 세션에서 순차 실행. 총 4회 호출이 의도적으로 quota(3회)를 정확히 소진 후 429 검증
- **규칙**: in-memory rate limit이 있는 API의 E2E 테스트는 rate limit window(60초) 안에 모든 호출을 하나의 test 함수로 통합. 호출 순서를 의도적으로 설계하여 quota 소진까지 포함 검증. 별도 test 함수로 분리하면 실행 순서에 따라 간섭 발생

### 2026-03-21 Zod `z.string().uuid()` — RFC 4122 variant bits 엄격 검증으로 테스트용 fake UUID 거부

- **증상**: n8n 파이프라인 E2E 테스트에서 유효한 Bearer 토큰 + 올바른 페이로드 구조인데도 400 응답. Zod 검증 단계에서 차단됨
- **원인**: `FAKE_DIAGNOSIS_ID = '11111111-1111-1111-1111-111111111111'`의 4번째 그룹 `1111`이 RFC 4122 variant bits 규격 위반. Zod의 UUID 정규식은 4번째 그룹 첫 문자가 `[89abAB]`여야 유효한 UUID로 인정. `1`은 범위 밖이므로 `diagnosisId must be a valid UUID` 에러로 400 반환
- **해결**: `'11111111-1111-1111-a111-111111111111'`로 변경 (variant `a`는 유효)
- **규칙**: 테스트용 fake UUID 생성 시 4번째 그룹 첫 문자를 반드시 `[89abAB]` 중 하나로 설정. `'00000000-0000-0000-0000-000000000000'`(nil UUID)은 Zod가 특별 허용하지만, 그 외 패턴은 variant bits 검증을 통과해야 함. 안전한 패턴: `xxxxxxxx-xxxx-4xxx-axxx-xxxxxxxxxxxx`

### 2026-03-23 Claude API 모델 ID 네이밍 — 버전 번호에 점(.) 포함 금지

- **증상**: 유료 분석 5개 에이전트 모두 404 에러 반환 → 10건 전부 빈 리포트 생성
- **원인**: 모델 ID를 `claude-sonnet-4-6-20250514`로 설정 (4.6을 4-6으로 변환). 실제 Claude API 모델 ID는 `claude-sonnet-4-20250514` (마이너 버전 없이 메이저만 사용). 마케팅 이름(Sonnet 4.6)과 API 모델 ID가 다름
- **해결**: 3곳의 모델 ID를 `claude-sonnet-4-20250514`, `claude-opus-4-20250514`로 수정
- **규칙**: Claude API 모델 ID는 마케팅 이름과 다르다. `claude-{model}-{major_version}-{date}` 형식. 마이너 버전(4.6의 .6)은 API ID에 포함되지 않음. 새 모델 사용 시 반드시 Anthropic API 문서에서 정확한 모델 ID 확인. 예: Sonnet 4.6 → `claude-sonnet-4-20250514`, Opus 4.6 → `claude-opus-4-20250514`

### 2026-03-23 로컬 커밋만으로 프로덕션 수정 완료 선언 — push 누락

- **증상**: 코드 수정 + `git commit` 완료 후 "수정 완료" 보고했으나 프로덕션은 여전히 이전 코드 실행
- **원인**: `git commit`만 하고 `git push origin main`을 하지 않음. `git status -sb`로 확인하면 `[ahead 1]` 표시 (로컬이 리모트보다 1커밋 앞서 있음). Vercel은 리모트 변경 시에만 자동 배포
- **해결**: `git push origin main` 실행 → Vercel 자동 배포 트리거
- **규칙**: 프로덕션 수정 완료 보고 전 반드시 3단계 확인: (1) `git status -sb`에서 `[ahead N]`이 없는지 확인 (있으면 push 안 된 것) (2) `git push origin main` 실행 (3) Vercel 대시보드 또는 `vercel --prod` 로 배포 완료 확인. "커밋했습니다" ≠ "배포되었습니다"

### 2026-03-24 Claude API maxTokens 부족 → JSON 응답 절삭 → 빈 리포트 (2회 재발)

- **증상(1차 03-24)**: content/competitors가 `status=empty`. **(2차 03-31)**: technical/seo/competitors가 `status=empty`. 공통: output_tokens가 정확히 maxTokens와 동일
- **원인**: `maxTokens: 2048`이 부족하여 JSON이 중간에 잘림 → `JSON.parse()` 실패 → fallback이 빈 배열 반환. 1차 수정 시 content/competitors만 4096으로 올리고 **technical/seo/geo는 2048 그대로 방치** → 2차 재발
- **해결(1차)**: content/competitors `2048 → 4096`. **(2차)**: technical/seo/geo도 `2048 → 4096`. 이제 5개 에이전트 모두 4096
- **규칙**: Claude API 구조화 JSON 응답 시 **모든 에이전트에 동일 기준(4096)** 적용. 일부만 수정하면 나머지에서 동일 문제 재발. 디버깅 단서: output_tokens가 정확히 maxTokens와 동일하면 한도에 걸린 것. 부분 수정 후 반드시 전체 에이전트 maxTokens 일관성 확인

### 2026-04-01 로컬 tsc 통과 ≠ Vercel 빌드 통과 — Git 미커밋 파일 함정

- **증상**: 로컬에서 `tsc --noEmit` 통과, `next build` 통과. 하지만 Vercel에서 `Property 'priority_adjustments' does not exist on type 'CmoVerificationResponse'` 에러로 빌드 실패. **수일간 모든 배포 실패 상태 지속.**
- **원인**: `types.ts`에 `priority_adjustments` 등 3개 필드를 추가했지만 Git에 커밋하지 않음. 로컬 `tsc`는 로컬 파일(커밋 안 된 것 포함)을 읽지만, Vercel은 **Git HEAD 코드**만으로 빌드. `git status`로 확인하면 `M src/features/diagnosis-paid/types.ts`가 미커밋 상태
- **해결**: 미커밋 파일을 모두 커밋 + push
- **규칙**: 배포 전 반드시 `git stash && npx next build`로 **Git 코드만으로 빌드 테스트**. 통과 확인 후 `git stash pop` → 커밋 → push. 특히 types.ts, config 파일 변경 시 주의. `git diff --stat HEAD`로 미커밋 변경 확인 습관화

### 2026-04-01 Mozilla Observatory v1 API 서비스 종료 — 502 상시 발생

- **증상**: `fetchObservatory()` 호출 시 항상 502 반환. google.com 등 다른 도메인으로 테스트해도 동일 502. 보안 카테고리가 항상 0점
- **원인**: Mozilla HTTP Observatory가 v1 API(`http-observatory.security.mozilla.org/api/v1/`)를 종료하고 v2 API(`observatory-api.mdn.mozilla.net/api/v2/`)로 이전. 2026년 초부터 v1은 502 반환
- **해결**: fetcher URL을 v2 엔드포인트로 변경. v2는 단일 POST 요청으로 grade+score+실패수 반환 (v1의 2단계 호출 불필요)
- **규칙**: 외부 API가 갑자기 실패하면 "일시적 서버 오류"로 넘기지 말고 **API 버전 마이그레이션/서비스 종료 여부**를 확인. 다른 도메인으로도 테스트하여 특정 사이트 문제인지 API 자체 문제인지 구분. Observatory v2: `POST observatory-api.mdn.mozilla.net/api/v2/scan?host={host}` body: `{"host":"domain.com"}`

### 2026-04-01 대시보드 쿼리가 최신 1개만 조회 → failed가 결과를 영구 차단

- **증상**: 유료 분석이 실패(`failed` + `paid`)하면 대시보드에서 "상세 분석에 문제가 발생했습니다" 에러만 표시. 이전 정상 진단 결과를 볼 수 없고 탈출구 없음
- **원인**: `dashboard/page.tsx`가 `ORDER BY created_at DESC LIMIT 1`로 최신 진단 1개만 조회. 최신이 `failed`면 이전 `completed` 결과에 접근 불가
- **해결**: 쿼리를 3단계로 분리: (1) 진행 중 진단 → 프로그레스 화면, (2) completed 진단 → 결과 표시, (3) failed만 있으면 → 새 진단 유도
- **규칙**: SaaS 대시보드의 메인 쿼리는 **사용자가 가장 보고 싶은 상태를 우선** 조회해야 함. 단순 최신순이 아닌 상태 우선순위(진행중 > 완료 > 실패) 적용. 실패 상태가 정상 결과를 가리면 안 됨

### 2026-04-01 Google API 키 제한 — Safe Browsing API "API key not valid"

- **증상**: Safe Browsing API 호출 시 400 "API key not valid". API는 활성화했는데 여전히 실패
- **원인**: Google Cloud Console에서 API 키의 "API 제한사항"이 "선택된 API가 없습니다"로 설정 → 어떤 API도 이 키로 호출 불가
- **해결**: API 키 수정 → "키를 제한하지 않음" 선택 또는 필요한 API(Safe Browsing, PageSpeed, Chrome UX Report)를 명시적으로 추가
- **규칙**: Google API 활성화와 API 키 권한은 **별개**. API를 활성화해도 키에 해당 API 접근 권한이 없으면 호출 불가. 새 Google API 추가 시: (1) API 라이브러리에서 활성화 (2) API 키 설정에서 해당 API 접근 허용 확인. 설정 반영에 최대 5분 소요

### 2026-04-01 n8n 콜백 URL과 로컬 테스트 — localhost 접근 불가

- **증상**: `NEXT_PUBLIC_SITE_URL="http://localhost:3600"`으로 변경 후 URL 제출 → 진단이 영원히 `pending` 상태
- **원인**: n8n이 외부 서버(Elest.io)에 있어서 `localhost:3600`에 콜백을 보낼 수 없음. 크롤링은 완료되지만 결과를 전달할 경로가 없음
- **해결**: 로컬 크롤링 테스트는 ngrok(`ngrok http 3600`) 또는 Vercel 배포 후에만 가능
- **규칙**: 외부 서비스(n8n, Stripe 웹훅 등)가 콜백하는 플로우는 **로컬 단독 테스트 불가**. ngrok 터널 또는 프로덕션 배포 필요. `.env.local`의 `NEXT_PUBLIC_SITE_URL`을 localhost로 변경해도 외부→localhost 접근 안 됨

### 2026-04-03 Vercel Hobby `after()` Lambda 타임아웃 → 유료 분석 영구 고착 (analyzing)

- **증상**: 유료 분석 트리거 후 admin에서 AI 에이전트 5개 + CMO 모두 ✗. status가 `analyzing`에서 30분 넘게 멈춤. Anthropic 로그에 `"client disconnected"` (code 499, latency 12.255s)
- **원인**: `trigger-analysis` API 라우트에 `maxDuration` 미설정. Vercel Hobby 기본 Lambda 타임아웃 **10초**. `after()` 콜백에서 AI 에이전트 5개(~30초) + CMO Opus(~12초)를 실행하는데 10초 만에 Lambda가 강제 종료. catch 블록도 실행 안 되어 status가 `analyzing`에 영구 고착
- **해결**: 3개 API 라우트(`trigger-analysis`, `checkout`, `crawl/complete`)에 `export const maxDuration = 60` 추가 (Hobby 최대치)
- **규칙**: Vercel에서 `after()` 또는 오래 걸리는 작업이 있는 API Route에는 반드시 `export const maxDuration = 60` 명시. 미설정 시 Hobby 기본 10초로 잘림. `after()`도 같은 Lambda 안에서 실행되므로 동일 타임아웃 적용. Anthropic 로그에서 code 499 + "client disconnected"가 보이면 서버 측 타임아웃 의심. **Pro 플랜은 최대 300초, Hobby는 최대 60초**

### 2026-04-03 "가입 불필요" 히어로 문구 — 실제 플로우와 불일치

- **증상**: 랜딩 히어로에 "가입 불필요"라고 표시되지만, 실제로는 회원가입이 필수 (URL 입력 전 /signup 거침)
- **원인**: 초기 기획 시 비로그인 진단을 고려했으나 실제 구현은 로그인 필수. 문구가 업데이트되지 않음
- **해결**: "가입 불필요" → "URL만 입력"으로 변경
- **규칙**: 랜딩 페이지의 신뢰 지표 문구는 실제 유저 플로우와 반드시 일치해야 함. 기능 변경 시 마케팅 문구도 함께 점검. 거짓 약속은 이탈률 증가 + 신뢰 하락

### 2026-04-05 Supabase OAuth — 커스텀 도메인 Redirect URL 미등록으로 Google 로그인 실패

- **증상**: Google 로그인 버튼 클릭 → Google 인증 완료 → 메인 페이지(`/?code=...`)로 이동. 로그인 안 됨
- **원인**: Supabase Redirect URLs에 `https://findably.vercel.app/auth/callback`만 등록하고 실제 서비스 도메인 `https://findably.kr/auth/callback`을 등록하지 않음. Supabase는 `redirectTo`가 허용 목록에 없으면 Site URL(루트)로 폴백. `/?code=...`가 루트 페이지에 도착하면 `exchangeCodeForSession()`이 실행되지 않아 세션 미생성
- **해결**: Supabase Dashboard → Authentication → URL Configuration에서 (1) Site URL: `https://findably.kr` 설정 (2) Redirect URLs: `https://findably.kr/auth/callback` 추가
- **규칙**: 커스텀 도메인 연결 시 반드시 Supabase Redirect URLs에 `https://{도메인}/auth/callback` 추가. Vercel 도메인과 커스텀 도메인은 별개. 체크리스트: (1) Site URL = 실제 서비스 도메인 (2) Redirect URLs에 모든 도메인의 `/auth/callback` 등록 (3) localhost 개발용도 포함. 증상 단서: OAuth 후 `/?code=...`로 리다이렉트되면 Redirect URL 미등록 의심

### 2026-04-06 PaidAnalyzingState가 무료 진단에 trigger-analysis 호출 → status=failed 마킹 (race condition)

- **증상**: URL 제출 후 `status=crawling`까지는 정상. 5분 뒤 `status=failed`, `crawl_data=NULL`. 사용자는 "점수산출에서 계속 로딩중"만 봄
- **원인**: `src/app/(dashboard)/dashboard/_components/PaidAnalyzingState.tsx`의 useEffect가 주석("isPaid 여부와 무관하게 analyzing 상태면 트리거 시도")대로 `isPaid` 여부와 상관없이 `/api/payment/trigger-analysis`를 호출. 이 라우트는 `runDiagnosisPaid()`를 실행하는데, 무료 진단은 `crawl_data`가 NULL인 상태에서 호출되면 `isValidCrawlData(null)`이 false → `return { success: false }` → catch 블록이 `.update({ status: 'failed' })` 실행. 이전까지는 n8n 크롤링이 빠르게 끝나 crawl_data가 먼저 채워져서 이 race condition이 가려져 있었음
- **해결**: (1) 프론트 가드: `PaidAnalyzingState.tsx`에 `if (!isPaid) return` 추가 (2) 백엔드 방어: `trigger-analysis/route.ts`에서 `select('status, tier')` 후 `if (diag?.tier !== 'paid') return successResponse({ status: 'skipped_free_tier' })` — 이중 방어
- **규칙**: paid 전용 API 라우트는 **반드시 tier 가드를 추가**. 프론트엔드만 믿지 말 것. `runDiagnosisPaid`처럼 crawl_data 의존성 있는 함수는 입력 검증 실패 시 catch에서 `status='failed'` UPDATE 금지 — 정상 진행 중인 다른 프로세스를 죽일 수 있음. 디버깅 단서: pg_stat_statements에서 `UPDATE status` pure-update 쿼리가 있으면 이 패턴 의심. 2026-04-06 이번 세션에서 프로덕션 4시간 추적 끝에 발견

### 2026-04-06 프로덕션 이슈 발생 시 증거 수집 전 파괴적 DB 작업 금지 (AI 방향 이탈 교훈)

- **상황**: Jayden이 "프로덕션 분석리포트가 나오지 않는다" 보고. Claude는 pg_stat_statements/API logs 확인 없이 "테이블이 없다"고 오진 → 마이그레이션 10+개 실행 → "drop and recreate all tables" 파괴적 작업 실행. 이후 진짜 원인은 코드 버그였음이 판명
- **AI가 한 것**: 증거 수집 생략 → 가설 수립 생략 → 파괴적 작업 직행 → chatsio 공유 프로젝트 위험 증가 → 근본 원인과 무관한 수술
- **올바른 방향**: (1) pg_stat_statements로 최근 쿼리 패턴 확인 (2) Supabase API logs + Postgres logs 확인 (3) git log로 최근 변경 확인 (4) 가설 수립 후 Jayden 승인 → 작은 확인 쿼리부터 (5) 파괴적 작업은 root cause 증거 확정 후에만
- **프롬프트 교훈**: 프로덕션 이슈가 보고되면 AI는 **반드시** 먼저 "READ ONLY 단계 → 가설 수립 → 승인 → 실행" 순서를 지켜야 함. 파괴적 작업(DB drop, env 변경, 재마이그레이션)은 증거로 확정된 root cause가 있을 때만 제안. `docs/last-known-good.md` 시스템 도입(2026-04-06)으로 이 규칙을 명문화 + CLAUDE.md에 1줄 추가. CLAUDE.md 규칙: "프로덕션 이슈 발생 시 반드시 `docs/last-known-good.md` 먼저 확인. 증거 수집 전 파괴적 작업 금지"

### 2026-04-06 외부 서비스 가격/제한 변경 검증 습관 (딥리서치 교훈)

- **증상**: Claude가 n8n 대안으로 Inngest를 1순위 추천. 근거로 "Pro $25/월, 무료 5000건 충분"을 제시. Jayden이 딥리서치 요청 후 실제 확인했더니 Inngest Pro는 **$75/월** (2024→2026 3배 인상), 무료 티어는 "함수당 5 concurrent step 제한"으로 Findably 10 병렬 fan-out을 직렬화. 또한 Vercel이 2025-04부터 Fluid Compute 기본 활성화 + Hobby 한도 60초→300초로 대폭 상향한 사실을 첫 조사에서 놓침
- **원인**: 학습 데이터 cutoff 이후의 가격/제한 변경을 검증하지 않고 "내가 아는 것"을 기반으로 추천. 특히 기술 선정 같은 중요 결정에서 오래된 정보가 잘못된 방향으로 안내할 위험이 큼
- **해결**: Jayden이 "딥리서치로 검증" 재요청 → Context7 + WebSearch + 공식 가격 페이지 직접 확인 → Vercel Workflow(2025-10 출시), Vercel Queues(2026-02 GA) 같은 신제품 발견 → 추천 전면 재정리
- **규칙**: 기술 선정/아키텍처 추천 시 **반드시** 아래 3개 확인:
  (1) **가격**: 공식 pricing 페이지 WebFetch로 당일 확인 — "내가 아는 가격"을 절대 인용하지 말 것
  (2) **제한/한도**: 무료 티어 세부 조건 확인 (concurrent, rate limit, retention 등). "월 X건 충분"만 보지 말고 병렬성/동시성 제약 확인
  (3) **신제품**: 주요 벤더(Vercel, Supabase, Cloudflare 등)의 최근 6개월 출시 제품 검색 — 검색 쿼리에 현재 연도 명시
  추천을 잘못하면 Jayden이 잘못된 방향으로 며칠을 날릴 수 있음. 10분 딥리서치 > 3일 잘못된 구현

### 2026-04-06 n8n 콜백 URL이 커스텀 도메인 전환 후 stale → 크롤링 파이프라인 전면 중단

- **증상**: URL 제출 후 `status='crawling'`에 영구 고착. Supabase `crawl_data=NULL`, Vercel Function Logs에 `/api/crawl/complete` 요청 **0건**. 2026-04-05 커스텀 도메인 추가 이후 모든 무료 진단 실패
- **원인**: 2026-04-05 커스텀 도메인 `findably.kr` 추가 + Vercel "Redirect to Primary Domain" 자동 활성화 후, n8n workflow "Callback Next.js" 노드가 여전히 `https://findably.vercel.app/api/crawl/complete` 를 참조. Vercel이 `findably.vercel.app` → `findably.kr`로 307 리다이렉트를 반환하는데, n8n의 axios는 리다이렉트 추적 시 POST→GET 변환 + body 손실 (learnings 2026-03-19와 동일 패턴). 결과: 콜백 시도 자체가 조용히 실패하고 Vercel 로그에 아예 기록 안 됨 (axios가 307을 에러로 처리하거나 body 없는 GET이 Zod 파싱 전에 조기 종료)
- **해결**: Elest.io n8n workflow "Callback Next.js" 노드 URL을 `https://findably.kr/api/crawl/complete`로 교체. Save 직후에는 반영 안 되고 **재활성화 사이클(Deactivate → Activate) 또는 재저장 후 반영** (9분 후 테스트 실패, 30분 후 테스트는 17초 end-to-end 성공). 로컬 n8n JSON 3개(`findably-crawl-v2-production-fixed.json`, `workflows/findably-crawl-v2-production.json`, `workflows/findably-crawl-v2-hardcoded.json`)도 동기화
- **규칙**: **커스텀 도메인 전환 시 외부 서비스가 참조하는 모든 콜백 URL을 전수 점검**. 검색 대상: `vercel.app`, 이전 도메인, 스테이징 도메인, localhost. 외부 서비스 범위: n8n workflow, Stripe/Toss 웹훅, GitHub Actions 시크릿, 외부 크론, 모니터링 핑, OAuth 리디렉트 URL. n8n workflow 변경 후 반드시 **Deactivate → Activate 재사이클**로 반영 확인. 검증 단서: Vercel Function Logs에서 해당 엔드포인트 요청 카운트가 의도대로 발생하는지. 0건이면 외부 서비스가 아예 호출 안 하는 것 → 콜백 노드 이전 문제 의심

### 2026-04-06 값 변경 시 전체 참조처 스캔 → 제시 → 승인 → 일괄 변경 (AI 이탈 교훈)

- **상황**: n8n 콜백 URL `findably.vercel.app` → `findably.kr` 변경 작업. Claude가 "Elest.io workflow + 로컬 JSON 3개"만 대상으로 판단하고 진행
- **AI가 한 것**: Fix 1 (Elest.io URL 수정, Jayden 영역) + Fix 2 (로컬 n8n JSON 동기화)만 제시. `findably.vercel.app` 문자열이 다른 곳(src/config, src/lib/adapters, .env.example, README, docs, CLAUDE.md, 주석, 테스트 픽스처, 다른 n8n 워크플로우 버전, Vercel 환경변수)에 남아 있을 수 있는지 **사전 스캔 안 함**. 일부만 수정하는 패턴은 learnings.md G항목("부분 수정 후 재발 방지")의 반복
- **올바른 방향**: 값 변경 요청(URL/환경변수 이름/API 키/enum 리터럴/도메인/포트/스키마 필드명/모델 ID 등) 시 **반드시 3단계**:
  1. **Scan**: Grep/Glob으로 해당 값 + 그 값이 의존하는 이름이 참조된 모든 위치를 나열 (코드, 테스트, 설정, 문서, 주석, env 예시, CI, 외부 workflow)
  2. **Report**: "N군데 참조: [파일:라인 리스트]" + 각 위치를 같이 변경할지 여부 권고 (같이 / 남기기 / 별도 Task)
  3. **Approve → Change**: Jayden 승인 후에만 일괄 변경. 승인 전 어느 한 곳도 수정 금지
- **프롬프트 교훈**: Jayden이 "X를 Y로 바꿔줘", "이 값 교체", "URL/env/키 변경" 계열 요청을 하면 **첫 액션은 항상 `Grep "X"`**. 변경 대상이 1곳뿐이어도 "스캔 결과: 1곳만 참조됨, 바로 수정해도 될까요?"로 명시 보고. 이 규칙은 feedback memory `feedback_value-change-scan`으로도 저장되어 다음 세션에서 자동 적용

---

## 🔍 에러 발생 시 디버깅 체크포인트

> learnings 전체에서 추출한 패턴별 체크리스트. 에러 발생 시 해당 카테고리부터 확인.

### A. 유료 분석이 멈춤 (analyzing 영구 고착)

```
□ 1. Anthropic 콘솔 로그 확인 — code 499 "client disconnected"인가?
     → Yes: Vercel Lambda 타임아웃. maxDuration = 60 설정 확인
□ 2. Anthropic 로그에서 output_tokens == maxTokens인가?
     → Yes: JSON 절삭. maxTokens 4096 이상으로 증가
□ 3. Anthropic 로그에 400/404 에러인가?
     → 400: API 크레딧 소진 → 충전 필요
     → 404: 모델 ID 오류 → claude-sonnet-4-20250514 형식 확인
□ 4. admin에서 AI 에이전트 ✓인데 CMO만 ✗인가?
     → CMO Opus 타임아웃(30초) 초과. 로그에서 latency 확인
□ 5. 크롤링 ✗ + 무료분석 ✗인가?
     → n8n 콜백 실패. SITE_URL이 localhost가 아닌지 확인
     → crawl/complete 라우트에 maxDuration 설정 확인
```

### B. 배포 후 프로덕션 에러

```
□ 1. git status -sb에서 [ahead N] 없는지 확인
     → 있으면 push 안 된 것. git push origin main 실행
□ 2. git diff --stat HEAD로 미커밋 파일 확인
     → types.ts, config 파일이 미커밋이면 Vercel 빌드 실패
     → 검증법: git stash && npx next build (Git 코드만으로 빌드)
□ 3. Vercel 대시보드에서 빌드 상태 확인
     → 빌드 실패: 에러 로그 확인 (타입 에러가 대부분)
     → 빌드 성공인데 동작 안 됨: 환경변수 누락 확인
□ 4. 환경변수 확인 (admin 페이지 또는 Vercel 대시보드)
     → ANTHROPIC_API_KEY, CRAWL_EXECUTE_SECRET, SITE_URL 등
```

### C. 외부 API 실패

```
□ 1. 특정 도메인만 실패? vs 모든 도메인 실패?
     → 모든 도메인: API 서비스 종료/마이그레이션 의심 (Observatory v1→v2 사례)
     → 특정 도메인: robots.txt 차단 또는 사이트 문제
□ 2. Google API "API key not valid" 400?
     → API 활성화와 키 권한은 별개. Cloud Console에서 키 제한 확인
     → 설정 반영 최대 5분 소요
□ 3. n8n 콜백 405 "Method Not Allowed"?
     → trailing slash → 308 → POST→GET 변환. GET 핸들러도 export
□ 4. Claude API 404?
     → 모델 ID 확인. 마케팅명(4.6) ≠ API ID(4). claude-sonnet-4-20250514
□ 5. Claude API 499 "client disconnected"?
     → 서버 측 타임아웃. maxDuration 설정 + Vercel 플랜 한도 확인
```

### D. 대시보드/UI 이상

```
□ 1. 데이터가 있는데 안 보임?
     → diagnosis-parser.ts의 정규화 로직 확인 (필드명 차이: passedRules vs passedCount)
     → DB 컬럼 조회에 필요한 필드 빠졌는지 select() 확인
□ 2. 이전 정상 결과가 안 보이고 에러만 표시?
     → 대시보드 쿼리 우선순위: 진행중 > 완료 > 실패 순인지 확인
     → 단순 최신순(LIMIT 1)이면 failed가 completed를 가림
□ 3. BlurOverlay/유료 기능이 Free에서 보임?
     → tier 확인 로직. DB에 tier='paid'로 저장되었는지 확인
□ 4. 점수 색상이 안 맞음?
     → config/scoring.ts의 getScoreColor() 사용하는지 확인. 직접 색상 판단 금지
```

### E. Vercel 서버리스 특수 규칙

```
□ 1. after()가 있는 라우트 → maxDuration = 60 필수
□ 2. void promise / fire-and-forget → 절대 사용 금지. await 또는 after()
□ 3. Hobby 최대 60초 / Pro 최대 300초
□ 4. Lambda 죽으면 catch 블록도 안 실행됨 → status 영구 고착 위험
□ 5. 로컬 정상 + 프로덕션 실패 → Lambda 수명 차이가 원인일 가능성 높음
```

### F. 보안 체크 (커밋 전)

```
□ 1. n8n workflow JSON에 시크릿 하드코딩 없는지 grep 확인
□ 2. /api/dev/ 디버그 엔드포인트 삭제했는지 확인
□ 3. 환경변수 값(길이, prefix)을 응답에 포함하지 않는지 확인
□ 4. NEXT_PUBLIC_ 접두사가 붙은 변수에 시크릿 없는지 확인
```

### G. 부분 수정 후 재발 방지

```
□ 1. maxTokens 변경 → 5개 에이전트 모두 동일 기준 적용했는지 확인
□ 2. 타입 추가 → 해당 타입 사용하는 모든 파일 커밋했는지 확인
□ 3. API Route 추가 → maxDuration + POST/GET 모두 export 확인
□ 4. 환경변수 추가 → Vercel 대시보드에도 추가했는지 확인
□ 5. 설정 변경 → "일부만 수정"하지 말고 전체 일관성 확인
```

---

### 2026-04-06 중요 표시값의 Single Source of Truth 부재 → 리포트 내 점수 불일치

- **증상**: 유료 리포트 PDF 1페이지 커버(62점)와 2페이지 SWOT 본문(72점)이 서로 다른 종합 점수를 표시. 같은 진단의 같은 사용자가 같은 페이지에서 2개 숫자를 본다
- **원인**: 2개의 점수 계산 경로가 독립적으로 저장됨:
  - 경로 A: `engine.ts evaluate()` → 7 카테고리 단순 가중 평균 → `analysis_data.overallScore.score` (JSON 안)
  - 경로 B: `score-aggregator.ts aggregateScores()` → 7 카테고리를 5 매크로(SEO/GEO/Perf/AI/Sec)로 재매핑 후 가중 평균 → `diagnoses.total_score` DB 컬럼
  - `run-diagnosis.ts:70`에서 `total_score: aggregated.totalScore` 저장 → 두 값이 구조적으로 다름
  - PDF route는 `diagnoses.total_score` 참조 / 대시보드 SwotSection의 generate-swot.ts는 `analysis_data.overallScore.score` 참조 → 같은 리포트 안에 두 값 동시 등장
  - 추가로 CMO가 `executive_summary`에 자유 텍스트로 또 다른 점수를 환각 생성 가능 (프롬프트에 점수 관련 가드 없음)
- **해결**: (1) `analysis_data.overallScore.score`를 canonical로 확정, PDF route도 이 경로 우선 사용 (DB 컬럼은 fallback). (2) CMO 프롬프트 `<guardrails>`에 "전달된 점수 그대로 인용, 재계산/추정 금지" 2줄 추가. (3) `CmoSummarySection`의 "품질 점수" 라벨을 "AI 검증 품질"로 변경해 종합 점수와 혼동 방지
- **규칙**: **중요 표시값은 반드시 single source of truth를 1곳 확정**하고 모든 표시 경로가 동일 필드를 참조해야 한다. DB 컬럼 + JSON 필드에 "비슷하지만 다른" 값을 동시에 저장하면 언젠가 반드시 불일치가 발생한다. 특히 AI가 자유 텍스트로 생성하는 필드(cmoSummary, executive_summary 등)에 "종합 점수 N점" 같은 숫자를 넣게 되면 환각으로 인한 불일치가 추가된다 → 프롬프트 guardrails로 **"재계산 금지 + 전달값 그대로 인용"** 명시 필수. 디버깅 단서: 같은 진단의 서로 다른 섹션에서 다른 숫자가 보이면 (1) 참조 필드 경로 차이 (2) AI 환각 두 가지를 동시에 의심할 것

### 2026-04-06 AI 자유 생성 insights 배열 기반 매출 계산 — rule-id 직접 매핑 함정

- **증상**: Task 1 매출 누수 재설계 계획 시 "rule-id별 가중치 0.15/0.20/..." 매핑을 먼저 떠올렸으나, 실제 리포트 코드를 읽어보니 매출 누수 카드는 `AIInsight[]` 배열을 받아 렌더링하는 구조였음. `AIInsight` 타입에 `rule-id` 필드 없음 → rule-id 기반 매핑을 직접 적용 불가
- **원인**: 무료 분석(diagnosis-free)은 rule 기반이라 rule-id가 데이터에 명시되지만, 유료 분석(diagnosis-paid)은 AI 5개 에이전트가 `AIInsight`를 자유 텍스트로 생성한다. `AIInsight.category`는 7개 `CategoryId` 중 하나만 저장되고 rule-id는 없음. 즉 "이 insight가 어느 rule에서 유래했는지" 추적 불가능
- **해결**: (1) rule-id 매핑은 참고용 문서로만 두고, (2) `classifyInsight()` 함수가 insight의 `title + description`을 정규식 키워드 매칭으로 8개 영향 카테고리에 분류, (3) 매칭 실패 시 `other` fallback + 우선순위 매칭(ssl > lcp > mobile > ...)으로 다중 키워드 케이스 처리, (4) dev 모니터링용 `otherRatio` 출력으로 키워드 부족 시 실증 기반 확장
- **규칙**: **AI 자유 생성 데이터를 후처리할 때는 엄격한 ID 기반 매핑 대신 키워드 휴리스틱 + fallback 카테고리**를 쓴다. 규칙 기반 시스템(`rule-id` + config)과 AI 기반 시스템(`insight[]`)이 공존하면 "규칙 레이어에 저장된 메타데이터가 AI 출력에 자동 반영되지 않는다" → 두 시스템을 잇는 **추론 레이어(classify 함수)가 반드시 필요**. 키워드 매칭은 추측으로 늘리지 말고 실제 데이터로 `other` 비율 확인 후 확장. 설계 시 "이 데이터는 어느 레이어에서 생성되는가"를 먼저 확인하고 매핑 구조를 잡을 것

### 2026-04-06 선물 코드 admin 우회 — DB 유니크 제약 회피 + 흔적 미생성 패턴

- **증상**: ADMIN-0709 코드(max_uses=100)를 admin 본인이 1번 사용한 후 재사용 시도 → "이미 사용한 코드입니다" 차단. 일반 사용자에게는 의도된 동작이지만 admin은 검증/테스트를 위해 무제한 사용이 필요
- **원인**: 2개의 보안 레이어가 같은 사용자의 동일 코드 재사용을 차단:
  1. DB 레벨: `006_findably_gift_codes.sql`의 `findably_gift_code_uses_code_user_idx` 유니크 인덱스 `(gift_code_id, user_id)`
  2. 코드 레벨: `redeem-code/route.ts`의 `existingUse` 사전 검증
- **해결**: DB는 손대지 않고 코드 레이어에서만 admin 우회. 4개 우회 포인트:
  1. `max_uses` 검증 우회 (admin은 카운터 무관)
  2. `existingUse` 중복 검사 우회 (admin은 재사용 허용)
  3. `gift_code_uses` INSERT 우회 (DB 유니크 인덱스 위반 회피)
  4. `used_count` UPDATE 우회 (카운터 보존 → 다른 사용자 99건 그대로)
     단, 만료된 코드(`expires_at`)는 admin도 차단 유지 (실수 방지)
- **규칙**: **DB 제약을 풀어서 모두 영향받게 만드는 대신, 코드 레이어에서 특정 계정만 우회하고 흔적 자체를 안 남기는 패턴**이 더 안전하다. INSERT를 우회하면 DB 유니크 위반을 자연스럽게 회피하면서 일반 사용자에게는 영향이 없다. 단점: admin 사용 흔적이 `gift_code_uses`에 안 남으므로, 감사 추적이 필요하면 별도 audit log 테이블이 더 적합. 보안 영역의 "예외 우회"는 항상 (1) 최소 권한자 (단일 계정 + email allowlist) (2) 명시적 안전장치 유지 (만료 같은 절대 제약은 admin도 차단) (3) DB 변경 회피 (롤백 단순화) 3원칙을 지킬 것

### 2026-04-06 `as const` readonly array의 `.includes()` 좁은 리터럴 타입 에러

- **증상**: `ACCESS.ADMIN_EMAILS.includes(user.email ?? '')` 호출 시 `TS2345: Argument of type 'string' is not assignable to parameter of type '"hidream72@gmail.com"'`. 같은 패턴이 다른 5개 파일에서는 통과하는데 `redeem-code/route.ts`에서만 에러
- **원인**: `ACCESS.ADMIN_EMAILS`가 `as const`로 선언되어 `readonly ['hidream72@gmail.com']` 타입. TypeScript의 `Array.includes` 시그니처는 readonly 좁은 리터럴 배열에서 검색 인자도 같은 좁은 타입으로 추론. `user.email`은 `string`이라 매칭 안 됨. 다른 파일에서 통과하는 이유는 미파악(TS 캐시 또는 lib 차이 추정)
- **해결**: `(ACCESS.ADMIN_EMAILS as readonly string[]).includes(user.email ?? '')` 캐스팅. 또는 `ACCESS.ADMIN_EMAILS.some(e => e === user.email)`로 우회 가능
- **규칙**: **`as const` readonly 배열에서 `.includes()`를 일반 string 인자와 함께 호출할 때는 `readonly string[]` 캐스팅 패턴을 사용**. 같은 코드가 다른 파일에서 통과한다고 해서 자기 파일에서도 통과한다는 보장 없음 (TS 캐시·lib·타입 추론 컨텍스트 차이). 디버깅 단서: TS2345 + 인자 타입이 너무 좁은 리터럴이면 readonly 배열의 inference 함정 의심

### 2026-04-06 계획 수립 전 지시문 정독 누락 → 범위만 담긴 얕은 제안 (AI 이탈 교훈)

- **상황**: `/start` 직후 Jayden이 유료 리포트 검수 Phase A 진행 여부를 물었을 때, Claude는 `docs/paid-report-audit-v1.md` 지시문을 **읽지 않고** PROGRESS.md 요약과 memory만 보고 "Phase A = Task 1+2+3, Step 1은 rule-id 스캔" 수준의 **범위 분류만** 담긴 제안을 올렸다. Jayden이 "이거 내용대로 계획을 세웠나?"라고 직접 지적해서야 누락을 인정하고 지시문을 정독했다
- **AI가 한 것**: (1) 지시문 파일이 명시적으로 박제되어 있는데도 Read 생략, (2) memory/PROGRESS 요약을 "계획"으로 오인, (3) Task 1-1~1-5 세부 요구사항(캡 적용, 가중치 배분, 중복 보정 문구, 금액 표현 방식), Task 2 세부(62/72 어느게 정확한지 확인), Task 3 세부(근본 원인 통합 + 복수 태그), 검증 체크리스트 7개를 모두 "계획"에서 누락, (4) 결과적으로 "Phase 범위 제안"을 "전면 계획 제출"로 보고
- **올바른 방향**: "이 지시문대로 구현 계획 세워줘" 같은 요청이 들어오면 **첫 행동은 반드시 해당 파일 Read**. PROGRESS/memory 요약은 보조 컨텍스트일 뿐 원본이 아니다. 계획에는 지시문의 (1) 모든 세부 요구사항이 어느 파일/함수로 매핑되는지 (2) 검증 체크리스트 각 항목이 어떻게 확인되는지 (3) 리스크/의존성을 빠짐없이 담아야 한다
- **프롬프트 교훈**: Jayden이 "~ 지시문대로 계획 세워줘", "~ 파일 기준으로 작업해줘" 같은 파일 참조 요청을 하면 **Claude는 즉시 해당 파일을 Read하고, 지시문의 모든 항목을 계획 표로 매핑해서 제출**해야 한다. 요약에서 "큰 틀"만 뽑아서 제안하는 패턴은 지시문의 세부 요구사항을 누락시키고 "계획"이 아닌 "범위 분류"에 그친다. 자동 적용 규칙: 파일 경로가 사용자 메시지에 등장하면 **그 파일 Read가 첫 tool call**

### 2026-04-06 외부 콜백 라우트에 멱등성 가드 부재 → DB write 폭주 + score 변동

- **증상**: 무료 진단 7c0a7f6d가 status='completed'인데도 5분간 6번+ update. score가 50 → 53 → ... 매번 다른 값으로 저장됨. updated_at이 30~80초마다 갱신. Jayden 측 화면이 polling cache 충돌로 갱신 안 됨
- **원인**: `/api/crawl/complete`의 `handleCallback`이 페이로드 검증 후 status 확인 없이 `saveCrawlResult + enrichCrawlData + runDiagnosis`를 매번 실행. n8n측이 같은 진단에 콜백을 여러 번 보내면 무료 분석 전체가 매번 재실행됨. `transitionStatus`는 completed→analyzing 차단하지만 그 이전의 `crawl_data` UPDATE는 이미 발생 (멱등성 결여). PageSpeed/SSL/Observatory 외부 API 결과 변동이 매번 다른 score로 반영됨
- **해결**: 페이로드 검증 직후 status 조회 → completed/failed면 early return. 가드 자체 실패 시(DB 장애)는 정상 흐름 유지로 안전성 보장. 검증: 새 진단 638f2f45가 25초만에 정상 종료(이전 130~301초 → 1/5~1/12), update 1회만 발생
- **규칙**: **외부 서비스(n8n, Stripe, Toss 등)가 콜백하는 라우트는 반드시 멱등성 가드가 필요하다**. 외부 측 retry 정책이나 timeout은 우리가 통제 못하고, 같은 콜백이 N번 도착할 수 있다고 가정해야 한다. 가드 위치: 페이로드 검증 직후 + DB 변경 전. 가드 조건: status가 terminal state(completed/failed)면 early return + 200 응답(외부 서비스가 또 retry 안 하도록). 가드 실패 시(DB 장애)는 차단하지 말고 진행 — 최악의 경우 폭주이지만 정상 흐름 우선

### 2026-04-06 Vercel maxDuration 단순 상향만으로는 시간 누적 문제 해결 불가

- **증상**: trigger-analysis 라우트가 maxDuration=120 → 504 timeout 발생. Fix 1로 maxDuration=300으로 상향했더니 이번엔 405초+ 경과해도 미완료. Vercel 한도 자체가 아닌 **누적 시간 자체가 문제**
- **원인**: 5에이전트 race(90s) + retry(직렬, Opus fallback 포함)가 60s+120s+ + CMO(30s) + aggregateResults(외부 API)가 누적되면 200~300초+ 가능. 한도를 늘려도 retry가 더 길어지면 또 hit. **시간 한도(maxDuration)는 안전망일 뿐, 본질은 시간 예산 재배분**
- **해결**: Phase 3 Fix 5개 일괄 적용:
  1. SDK 클라이언트에 timeout 명시(`timeout: 90_000, maxRetries: 0`) — SDK 자체 abort + 자동 재시도 차단
  2. retry 전체 단계에 race timeout 추가 — 무한정 시간 잡아먹기 차단
  3. retry for 직렬 → Promise.allSettled 병렬 — 2개 이상 실패 시 시간 N배 절감
  4. Opus 2차 fallback 제거 — Opus는 60초+ 걸리고 시간 폭발의 주범
  5. 시작 시 updated_at 직접 갱신 — 디버깅 마커로 process_seconds=0 미스터리 해결
- **규칙**: **Vercel maxDuration이 hit하면 답은 한도 상향이 아니라 시간 예산 재배분**. 각 단계(전처리, 메인 작업, 후처리)가 한도의 30~50% 이내에 끝나도록 설계. retry는 반드시 (1) 전체 시간 한도 (2) 병렬화 (3) 비싼 fallback(Opus 등) 제거 3가지를 적용. SDK 기본값 600초 같은 큰 timeout은 Vercel 환경과 불일치하므로 명시적으로 짧게 설정. SDK 자동 재시도(maxRetries 기본 2회)와 우리 retry 로직이 중복되지 않도록 SDK 측은 0으로 막고 우리가 통제

### 2026-04-06 transitionStatus가 동일 상태 시 noop → updated_at 갱신 안 됨, 디버깅 불가

- **증상**: 진단 process_seconds(updated_at - created_at)가 0초로 표시됨. runDiagnosisPaid가 분명히 실행되고 있는데 DB의 updated_at이 created_at과 정확히 같음. 진단이 어느 단계까지 갔는지 외부에서 추적 불가
- **원인**: `transitionStatus()` 함수가 동일 status 호출 시 멱등성을 위해 early return (line 86-92). 진단이 이미 'analyzing' 상태에서 또 'analyzing'으로 transition하면 DB write 자체가 일어나지 않음. updated_at도 갱신 안 됨. 이게 디버깅 마커로 활용 불가능한 원인
- **해결**: 시작 시점에 transitionStatus 우회하여 supabase.update({ updated_at: ... }) 직접 호출. status 변경이 아닌 timestamp 마커이므로 transitionStatus 일원화 원칙 위배 아님
- **규칙**: 상태 전이 함수가 멱등성을 위해 동일 상태 시 noop이라면 **timestamp 마커 용도로 활용 불가**. 디버깅용 timestamp 갱신이 필요하면 (1) 별도 supabase.update 직접 호출 (2) 또는 transitionStatus에 `forceTimestampUpdate` 옵션 추가. 멱등성과 디버깅 가능성은 별개 문제이므로 한 함수가 둘 다 책임지면 안 됨

### 2026-04-06 단일 fix 검증 후 추가 fix 결정 패턴 — root cause 분리 측정의 가치 (방법론)

- **상황**: trigger-analysis 504 발견 후 Fix 1(maxDuration 120→300) 단독 적용 → 검증 → 부족 확인 → Phase 3 Fix 3+5+6+7+8 일괄 적용 → 검증 → 멱등성 가드 fix 별도 적용. 단계적 검증으로 각 fix의 효과를 분리 측정할 수 있었음
- **AI가 한 것**: (1) 처음에 가설 트리에서 H7(socket idle) 유력으로 봤으나 실제는 H10(maxDuration hit) + H11(시간 누적) + Mystery 1(멱등성 부재) 3개가 복합 원인이었음. 만약 5개 fix를 처음부터 일괄 적용했다면 어느 것이 효과 있는지 분리 측정 불가. (2) Fix 1만 단독 적용 후 검증 단계에서 "Fix 1만으로 부족"이 확정되어 Phase 3 Fix 5개로 확대 결정. (3) 멱등성 가드(Mystery 1)는 검증 중 발견되어 별도 적용 — 만약 일괄에 포함됐으면 다른 fix와 효과 분리 불가
- **올바른 방향**: 큰 변경(5개+ fix)이 필요해 보여도 **가장 가벼운 fix 1개 → 검증 → 결과 보고 → 추가 fix 결정** 사이클을 돌리는 것이 root cause 확정에 더 빠르다. "한 번에 다 고치자"는 유혹은 검증 결과가 모호해지고, 부작용 발생 시 어느 변경이 원인인지 분리 못하는 결과를 낳는다
- **규칙**: 프로덕션 디버깅에서 fix를 적용할 때 **(1) 가설 트리 작성 → (2) 가장 영향 작은 fix 1개 우선 적용 → (3) 배포 + 검증 → (4) 결과에 따라 추가 fix 결정** 사이클을 따라야 한다. 예외: 가설이 100% 확정되고 여러 fix가 서로 독립적이며 각각 효과가 명확할 때만 일괄 적용. Findably의 Phase 3 Fix 5개는 일괄 적용했지만, 그 전 Fix 1로 한도만 늘려보고 부족함을 확정한 후의 결정이었음

### 2026-04-06 Supabase MCP 실시간 모니터링으로 폭주 패턴 발견 (디버깅 도구)

- **상황**: trigger-analysis 504 조사 중 Supabase 진단 테이블의 process_seconds, updated_at, score를 30초~60초 간격으로 폴링 쿼리하여 추적. 7c0a7f6d 진단이 completed인데도 33초~80초마다 update가 발생하고 score가 50 → 53 → ... 변하는 패턴 발견 → handleCallback 멱등성 부재 확정
- **방법**: MCP execute_sql로 같은 진단 ID를 SELECT만 하면서 시간 차이 비교. SQL 한 줄에 EXTRACT(EPOCH FROM (NOW() - updated_at)) AS seconds_since_last_update, EXTRACT(EPOCH FROM (updated_at - created_at)) AS process_seconds 같은 metric을 함께 출력하면 변화 패턴이 한눈에 보임
- **규칙**: 프로덕션 이슈 추적 시 **DB의 변화 패턴 자체가 결정적 단서**가 될 수 있다. 단일 시점 SELECT보다 (1) 같은 row를 1~5분 간격으로 여러 번 쿼리 (2) 매번 NOW() 기반 metric을 함께 출력 (3) updated_at, score, status 등의 변화를 표로 비교. 변화 패턴이 일정 주기(예: 33초)면 cron 의심, 불규칙이면 외부 콜백 retry 의심. 이 패턴은 코드 read만으로는 절대 발견 불가하고, 실시간 DB 관찰이 필수

### 2026-04-08 n8n v2.16.0 webhook typeVersion 2 — responseMode='responseNode' + fan-out Respond 조합 reject

- **증상**: n8n 2.16.0에 v3.2 워크플로우 import 후 활성화 시도 → "Unused Respond to Webhook node found in the workflow" 에러로 차단. 워크플로우의 Validate & Set Variables 노드 fan-out 첫 분기에 "Respond 202 Accepted" 노드가 있고, 같은 fan-out에 Firecrawl 처리 분기들이 병렬로 존재
- **원인**: n8n v2.16.0 typeVersion 2 Webhook 노드는 `responseMode='responseNode'`로 설정된 경우, fan-out된 분기 중 첫 번째 (또는 모든) 분기에 Respond 노드가 있어야 함을 강제 검증. 우리 워크플로우는 즉시 202 응답 후 백그라운드 처리 패턴을 위해 Respond 노드를 fan-out 첫 분기에 두고 나머지 분기에서 실제 작업을 했는데, n8n 검증기가 이를 "사용되지 않은 Respond 노드"로 잘못 판정. GitHub n8n 소스 확인 결과 `responseCodeProperty`가 `responseMode==='responseNode'`일 때 hide되는 코드와 연관
- **해결**: v3.3 워크플로우 신규 작성 — Webhook Trigger options 변경 (`responseMode: responseNode → onReceived`, `responseCode: customCode (202)`, `responseData: 'accepted'`). Respond 202 Accepted 노드 자체를 제거하고 Webhook 옵션의 customCode로 즉시 202 응답. 노드 24 → 23개, fan-out 11 → 10 분기. 동일한 "즉시 응답 + 백그라운드 처리" 동작을 옵션 기반으로 구현
- **규칙**: **n8n typeVersion 2 Webhook + 즉시 응답 + 백그라운드 fan-out 패턴**은 `responseMode='onReceived' + customCode` 조합으로 구현. `responseMode='responseNode'` + 별도 Respond 노드 패턴은 fan-out 구조에서 검증 충돌 가능. 또한 Webhook 옵션의 `customCode` 필드는 일부 n8n 버전에서 `Response Code` 드롭다운에서 "Custom" 선택 시에만 노출되므로 UI 차이 주의. n8n 워크플로우 작성/마이그레이션 시 (1) 사용자 환경의 정확한 n8n 버전 확인 우선 (2) typeVersion 2 vs 1 차이점 확인 (3) GitHub source의 displayOptions 직접 검증 — 학습 데이터에 없는 신규 검증 규칙 가능성 항상 의심

### 2026-04-08 외부 SaaS 도구 학습 — 사용자 환경 버전 우선 확인 패턴 (메타 교훈)

- **상황**: n8n 2.16.0(2026-04-07 stable)을 사용 중인 Jayden에게 v1.x 시절 UI 기준으로 가이드 제공. "Active/Inactive" 토글로 안내했으나 실제 화면에는 "Published/Draft" 모델이 보임. Jayden이 "네가 학습한 n8n 버전 알려줘"로 직접 지적
- **AI가 한 것**: (1) 학습 cutoff 이후 변경된 외부 도구 UI/기능을 확인 없이 가이드 (2) 첫 에러("Unused Respond to Webhook")를 가설 트리만 돌려서 해결 시도, GitHub source 확인이 늦음 (3) Jayden이 명시적으로 "최신 버전 학습해" 요청한 후에야 정확한 정보 수집
- **올바른 방향**: 외부 SaaS/도구(n8n, Vercel, Supabase, Firecrawl 등) 가이드 작성 시 **첫 액션은 사용자 환경 버전 확인**. 명확하지 않으면 "현재 X 버전이 뭐예요?" 한 줄 질문. 학습 데이터의 UI 스크린샷이나 옵션 명칭은 해당 시점의 정보일 뿐, 6개월~1년만 지나도 크게 달라질 수 있음 (n8n은 typeVersion 단위로 검증 규칙이 변경됨)
- **규칙**: 외부 SaaS 도구 가이드 시 (1) 첫 액션 = 사용자 환경 버전 확인 (2) 학습 cutoff 이후 가능성 항상 의심 (3) 가이드 전 공식 changelog/release notes WebFetch로 검증 (4) GitHub source가 있는 OSS 도구는 typeVersion/displayOptions 같은 검증 규칙을 직접 read (5) "내가 학습한 버전과 사용자 버전이 다를 수 있다"는 사실을 가이드 시작 시 명시. learnings 2026-04-06 (외부 서비스 가격/제한 변경 검증)과 같은 패턴 — 모든 외부 도구는 시간에 따라 변하므로 "내가 안다"는 가정 자체를 의심

### 2026-04-08 crawl_data의 blocked_reason 텍스트로 코드 흐름 정확히 추적 (디버깅 패턴)

- **상황**: 무료 진단이 8초 만에 status='failed'로 마킹되고 화면에 "분석에 문제가 발생했습니다" 표시. n8n에서는 워크플로우 진행 중인 듯 보이는 상태. 화면과 n8n 상태 충돌
- **디버깅**: Supabase MCP로 진단 row 조회 → `crawl_data` JSON 안의 `blocked_reason: "크롤링 품질 미달 (completeness 11%)"` 발견. 이 텍스트를 grep하여 `route.ts:181`의 `payload.reason ?? 크롤링 품질 미달 (completeness ${payload.dataCompleteness}%)` 정확한 생성 코드 위치 확정. 즉 quality_rejected 분기 → markDiagnosisFailed 호출 → status=failed가 정확한 흐름임을 5분 내에 확정
- **결론**: 이건 버그가 아니라 정상 동작이었고, findably.kr 사이트 자체가 dataCompleteness 11%로 Quality Gate(30% 미만)에 걸린 것
- **규칙**: 디버깅 시 **DB에 저장된 텍스트 메시지(reason, error_message, blocked_reason 등)를 코드에서 grep**하면 해당 메시지를 생성하는 정확한 위치를 5분 안에 찾을 수 있다. 이 패턴은 (1) "이게 어디서 실패했지?" 질문에 가설 5개 세우는 것보다 빠름 (2) 동적 보간 (`${var}`) 부분은 grep 어려우므로 고정 텍스트 prefix/suffix만 검색 (3) 메시지가 여러 곳에서 동일하게 생성되면 호출 스택을 좁히는 추가 단서(파라미터 값, 시간대) 활용. 이 패턴은 fake/real 진단 디버깅 모두에 응용 가능. 디자인 함의: **에러 메시지를 충분히 unique하게 작성**하면 향후 디버깅 비용이 크게 줄어든다 (예: "잘못된 요청"보다 "페이로드 schema 검증 실패: dataCompleteness")

### 2026-04-06 stuck 화면 디버깅 — 백엔드 → 프론트엔드 격리 진단 (방법론)

- **상황**: Jayden이 onboarding/url 화면에서 "분석 시작" 후 작업중 표시 stuck. n8n에서는 작업 완료. Supabase 확인 → 638f2f45 진단이 25초만에 completed로 정상 종료. 즉 백엔드는 완벽하게 작동했지만 화면이 안 갱신됨
- **해석**: 백엔드 로그/DB가 정상이면 **문제는 프론트엔드**이다. 가능한 원인은 (1) Server Action 응답 못 받음 (2) redirect 작동 안 함 (3) Server Component cache stale (4) JS 에러로 form submit 자체가 안 일어남 (5) 다른 진단 ID polling 중
- **규칙**: stuck 화면 디버깅 시 **반드시 백엔드 상태(DB, 로그)를 먼저 확인**. 백엔드가 정상이면 코드 read 대상은 (1) Server Action 코드 (2) Form 컴포넌트 (3) router.refresh() 또는 redirect 호출 (4) Server Component cache 무효화. 백엔드 비정상이면 외부 API/n8n/auth 등을 의심. 두 영역을 동시에 의심하면 시간 낭비 — **백엔드 → 프론트엔드 순서 격리**가 가장 빠르다

### 2026-04-08 n8n fan-in은 반드시 Merge 노드 필수 — "hasn't been executed" 패턴 (CRITICAL)

- **증상**: v3.3 프로덕션에서 `data_completeness=11%`, 7초만에 failed. `findably_crawl_executions.error_details`에 `"Cannot assign to read only property 'name' of object 'Error: Node 'A2: Firecrawl Map' hasn't been executed'"` 패턴 8건. success는 firecrawl_scrape 1건만, 나머지 8개 소스 전부 "not executed" 처리
- **원인**: v3.3 workflow에서 10개 fan-out 분기(A1~C4 Firecrawl/PageSpeed/SSL/Observatory/robots/sitemap/llms)가 **Merge 노드 없이** 곧바로 Normalize Results(Code 노드)로 합류. n8n의 fan-in 규칙: **Merge 노드가 없으면 대상 노드는 각 입력마다 독립 실행**. A1이 가장 빨리 끝나자(~1.8초) Normalize Results가 1번째 실행되며 `$('A2: Firecrawl Map').first()?.json` 같은 글로벌 참조로 아직 실행 안 된 노드를 조회 → n8n이 `Error: Node hasn't been executed` 던짐. 추가로 **n8n 2.16.0에서 Error 객체가 read-only로 바뀌어** try/catch가 에러를 변형/rethrow하려다 `"Cannot assign to read only property 'name'"` 2차 에러 발생 → 무한 에러 체인
- **해결**: v3.4 JSON 생성 시 **Wait All Sources Merge 노드**(`n8n-nodes-base.merge` typeVersion 3, mode=append, numberInputs=10) 추가. 10개 fan-out 분기의 connections를 Normalize Results 대신 Merge 노드의 index 0~9로 재배선. Merge → Normalize Results 연결 추가. 결과: 11% → 89% 수직 상승
- **규칙**: **n8n에서 여러 분기가 하나의 Code/Function 노드로 합류할 때는 반드시 Merge 노드를 경유**. Merge가 "모든 입력이 도착할 때까지 대기" 역할을 수행. 직접 연결하면 대상 노드가 "입력마다" 독립 실행되어 가장 빠른 분기 완료 시점에 발화함. 설계 원칙: **fan-in이 필요하면 항상 Merge**. Code 노드의 `$('노드명').first()?.json` 글로벌 참조는 해당 노드가 **이미 실행 완료 상태**일 때만 작동. 추가로 n8n 2.x 계열은 Error 객체가 read-only여서 try/catch가 에러를 잡아도 rethrow/변형 시 2차 에러 발생 가능 → 구조적으로 "에러가 발생하지 않도록 설계"해야 함 (사후 try/catch 방어보다 사전 Merge 노드 배치가 우선)

### 2026-04-08 Zod schema의 z.string() 필드에 외부 API 에러 객체 주입 시 400 (CRITICAL)

- **증상**: v3.4 workflow로 fan-in 해결 후 테스트 시 `findably_crawl_executions.status=success, data_completeness=89%`가 정상 저장됐지만 `diagnoses.status=crawling` 고착, `crawl_data=null`. Callback Next.js 노드가 `/api/crawl/complete`에 POST → **400 Bad Request**. 에러 메시지 "Bad request - request failed"
- **원인**: Next.js `completePayloadSchema`의 `errorDetails: z.array(z.object({ source: z.string(), error: z.string() }))`가 `error` 필드를 **string으로만 허용**. 그런데 Normalize Results Code 노드는 `error: nodeResult?._message || nodeResult?.error || nodeResult?.message || HTTP ${statusCode}`로 생성하는데, 외부 API(Observatory, Google PageSpeed 등)가 에러를 **중첩 객체**로 반환하면(`{error: {code: 400, message: "..."}}`) `nodeResult.error`가 object 타입이 되어 그대로 errorDetails에 들어감 → Zod `z.string()` 검증에서 탈락 → 400. v3.3 시절에는 fan-in 버그로 errorDetails가 아예 생성되지 못해 이 2차 버그가 **가려져 있었음**. v3.4로 fan-in 고치자 비로소 드러남 (**순차적 버그 노출 패턴**)
- **해결**: v3.5 생성 시 Normalize Results jsCode에서 error를 string으로 강제 변환:
  ```js
  const rawErr =
    nodeResult?._message ||
    nodeResult?.error ||
    nodeResult?.message ||
    `HTTP ${nodeResult?.statusCode || 'unknown'}`
  const errStr =
    typeof rawErr === 'string'
      ? rawErr
      : rawErr == null
        ? 'unknown error'
        : (() => {
            try {
              return JSON.stringify(rawErr)
            } catch {
              return String(rawErr)
            }
          })()
  return { source: s.name, error: errStr }
  ```
  동시에 Next.js `route.ts`의 Zod catch 블록에서 400 응답에 `error.issues.map(i => \`${i.path.join('.')}: ${i.message}\`).join('; ')` 형식의 detail을 포함시켜 다음 검증 실패 시 원인을 즉시 확인할 수 있도록 함 (블라인드 디버깅 루프 차단)
- **규칙**: **외부 API 에러를 string 필드에 담을 때는 항상 `typeof rawErr === 'string'` 체크 후 JSON.stringify fallback**. 외부 API 응답 형식은 벤더마다 다르고 업데이트될 수 있으므로 "에러는 항상 string"이라는 가정 금지. 추가 규칙: **Zod 검증 실패 응답에는 반드시 `error.issues`의 path+message를 포함**. `"잘못된 요청"`처럼 generic 메시지만 반환하면 외부 호출자(n8n, 외부 웹훅)가 원인을 알 수 없어 디버깅이 블라인드 루프에 빠짐. Zod v4에서는 `error.errors` → `error.issues`로 API 변경됨 주의. TypeScript 명시적 타입 `(issue: z.ZodIssue)` 필요

### 2026-04-08 n8n UI 연결선/Input 탭 "회색/비어있음" ≠ 데이터 흐름 문제 (false alarm 방지)

- **증상**: v3.5 테스트 성공 후 Jayden이 "A1, A2 → Wait All Sources 연결선이 회색으로 보이는데 정상인가?" 문의. Callback Next.js 노드를 클릭했을 때도 Input 탭에 "No fields - item(s) exist, but they're empty" 표시
- **원인**: Findably workflow는 Normalize Results와 Callback Next.js 모두 **`$('노드명').first()?.json` 글로벌 참조** 패턴을 사용. 즉 파이프 직접 전달이 아닌 "글로벌 execution context에서 직접 노드 결과 가져오기" 방식. n8n UI는 "파이프에 실제 item이 흘러가는가"를 기준으로 시각화하기 때문에, 글로벌 참조만 쓰는 노드는 파이프가 비어있어 **UI에서 회색/"No fields"로 렌더링**되지만 **실제 데이터는 정상 흐름**. 결정적 증거: 같은 execution에서 `diagnoses.status=completed`, `total_score=63`, `has_analysis=true` + Callback Next.js Output statusCode=200 + body.success=true + saved=true
- **해결**: 워크플로우 수정 불필요. Jayden에게 (1) 데이터 흐름은 실제 실행 결과(`crawl_executions`, `diagnoses`)로 검증 (2) UI의 회색/empty 표시는 글로벌 참조 패턴의 시각화 부작용으로 설명. 엘리베이터 비유: Merge는 "10명 모두 올 때까지 문 대기"(타이밍 동기화)만 하고, 실제 데이터는 각자 1층으로 전화(글로벌 참조)로 전달 → 엘리베이터 입력 파이프(UI)는 비어있지만 기능은 정상
- **규칙**: **n8n UI의 "연결선 색상"이나 "Input 탭 비어있음"은 데이터 흐름 여부의 1차 판단 근거가 아님**. 판단 순서: (1) **실제 실행 결과 데이터**(DB, 외부 API 응답, Callback statusCode)를 먼저 확인 (2) 데이터가 정상이면 UI는 시각화 특성 (3) 데이터가 비정상일 때만 UI를 2차 단서로 사용. 이 규칙을 어기면 "정상 작동 중인 워크플로우를 고친다고 뜯어고쳐서 진짜 문제를 만드는" 패턴 발생. `$('노드명').first()?.json` 글로벌 참조는 n8n의 공식 기능이며, 이 패턴을 쓰면 파이프 시각화는 비활성처럼 보이는 게 정상

### 2026-04-08 이전 잘못된 진단 정정 — v3.3 Respond 노드 제거는 표면적 해결이었음 (메타 교훈)

- **상황**: learnings.md 2026-04-08 "n8n v2.16.0 webhook typeVersion 2 — responseMode='responseNode' + fan-out Respond 조합 reject" 항목은 "Respond 202 노드를 제거하고 `responseMode: onReceived + customCode: 202`로 변경"을 해결책으로 기록했음. 하지만 실제로 그 변경으로 활성화 에러는 사라졌지만 **프로덕션 크롤링이 fan-in 버그로 완전히 작동 불능** 상태였고, 이번 세션에서 진짜 원인(Merge 노드 누락)을 발견함
- **AI가 한 것**: v3.2 → v3.3 마이그레이션 시 "활성화 에러 해결"에만 집중하고 **실제 프로덕션 테스트로 end-to-end 검증을 하지 않음**. Respond 노드 제거 + onReceived 변경은 **활성화 검증만 통과**시켰고 fan-in 실행 흐름에는 영향 없음. fan-in은 v3.2부터 Merge 노드가 빠져 있었지만, v3.2의 responseNode + Respond 조합에서는 Respond 노드가 Normalize Results 이전에 실행 종료를 유도했을 가능성이 있어 증상이 달랐을 수도 있음 (또는 그 당시에는 한 번도 성공한 적이 없었을 수도 있음 — 검증 부족)
- **올바른 방향**: **workflow 활성화 성공 ≠ 파이프라인 작동**. 두 가지는 별개. (1) 활성화는 "n8n validator가 허용하는 구조인가"만 검사 (2) 실제 작동은 "각 노드 간 데이터 흐름 + fan-in/out + 타이밍 동기화"에 달려 있음. 전자를 통과해도 후자에서 실패할 수 있음. 워크플로우 변경 후에는 **반드시 프로덕션 또는 스테이징에서 end-to-end 테스트** + DB 결과 확인까지 마쳐야 "완료" 선언 가능
- **프롬프트 교훈**: n8n workflow 같은 외부 시스템 변경 시 "활성화 성공 = 작동"으로 축약 금지. 검증 체크리스트: (1) workflow 활성화 성공 (2) 테스트 실행 → execution 탭 "Succeeded" 확인 (3) 각 노드 output이 기대한 데이터인지 확인 (4) 후속 시스템(DB, API)의 저장/호출 결과 확인 (5) end-to-end 상태 전이 확인 (status: pending → crawling → completed). 이 중 하나라도 건너뛰면 learnings.md에 잘못된 교훈을 쓰게 되고, 다음 세션에서 같은 실수 반복. 이번 세션의 v3.3 → v3.4 → v3.5 3단계 수정 루프는 이 검증 부족의 직접적 결과였음
