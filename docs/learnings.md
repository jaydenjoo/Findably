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
