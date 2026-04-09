# 📚 Learnings Archive — 2026 Q1 (~03-23)

> `docs/learnings.md`에서 아카이브된 초기 교훈 (테스트 인프라 셋업 + 초기 프로덕션 삽질)
> 원본 형식 그대로 보존. 최신 교훈은 `docs/learnings.md` 참조.

---

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
