---
name: done
description: >
  Task 완료 프로토콜. 검증 → diff 리뷰 → 보안 체크 → 테스트 → 커밋 → Push → 보고.
  Use this agent when: Task 완료 시, /done 입력 시.
---

Task 완료 프로토콜을 **순서대로** 실행:

## 1. 검증 게이트

```bash
npx tsc --noEmit && pnpm lint && pnpm build
```

하나라도 실패 → 수정 후 재실행.

## 2. Diff 리뷰 (AI 코드 = 신뢰 불가)

변경 사항을 Jayden에게 요약 보고:

```bash
git diff --stat
```

**Jayden에게 보여줄 것:**
- 변경된 파일 목록과 각 파일의 핵심 변경 내용 한 줄 요약
- 새로 추가된 패키지가 있으면 명시
- 삭제된 코드가 있으면 사유 설명

```
📝 Diff 요약
━━━━━━━━━━━━
변경: N개 파일
- src/app/page.tsx — 히어로 섹션 추가
- src/lib/supabase/client.ts — 새로 생성
- package.json — shadcn/ui 패키지 추가

⚠️ 주의: [있으면 표시]
━━━━━━━━━━━━
```

## 3. 보안 체크 (가장 중요)

### 3-1. 시크릿 스캐닝
변경된 파일에 API 키, 토큰, 비밀번호가 포함되었는지 확인:

```bash
git diff --cached -U0 | grep -iE "(sk-ant-|sk-[a-zA-Z0-9]{20,}|AKIA|ghp_|glpat-|eyJ[a-zA-Z0-9]{30,}|xox[bprs]-|PRIVATE KEY|password\s*=\s*['\"][^'\"]+['\"])" || echo "✅ 시크릿 없음"
```

발견되면 → **즉시 .env.local로 이동. 절대 커밋하지 않음.**

### 3-2. Supabase RLS 확인
Supabase 관련 파일이 변경되었으면:
- 새 테이블에 `ENABLE ROW LEVEL SECURITY` 있는지 확인
- `service_role` 키 사용이 있으면 사유 기록 확인
- Storage 버킷 접근 정책 확인

### 3-3. 의존성 확인
package.json이 변경되었으면:

```bash
pnpm audit --audit-level=high 2>/dev/null || echo "⚠️ 취약 패키지 있음"
```

새 패키지가 추가되었으면 → "이 패키지가 꼭 필요한가? 직접 구현이 가능한가?" 판단 후 Jayden에게 보고.

## 4. 테스트 확인

변경된 파일에 대응하는 테스트가 있는지 확인:

```bash
find tests src -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | head -5
```

**테스트 파일이 하나도 없으면:**

```
⚠️ 테스트 없음 경고
이번 변경사항에 대한 테스트가 없습니다.
핵심 비즈니스 로직이 포함되어 있다면 테스트 작성을 권장합니다.

작성할까요? (Jayden이 "네" → qa-tester 에이전트로 테스트 작성)
```

테스트 파일이 있으면:
```bash
vitest run
```

## 5. 커밋

```bash
git add -A
git commit -m "[type]: [한줄 설명]

- [변경사항]
Task: [Epic > Task명]"
```

type: `feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:`

## 6. PROGRESS.md 갱신

- 완료된 Task → `[x]`
- 다음 Task → "진행 중"
- 날짜 업데이트

```bash
git add PROGRESS.md && git commit -m "docs: update PROGRESS.md"
```

## 7. Push

```bash
git push -u origin $(git branch --show-current)
```

## 8. learnings.md 판단

아래 해당 시 기록 제안:
- 같은 에러 2회 반복
- 해결에 30분+ 소요
- AI가 잘못된 방향
- 중요 설계 결정
- 보안 이슈 발견

## 9. 보고

```
📋 Task 완료
━━━━━━━━━━━━
✅ Task: [완료 작업]
🌿 Branch: [브랜치]
🔗 Commit: [해시]

📝 Diff: N개 파일 변경
🛡️ Security: [시크릿 없음 / RLS 확인됨 / 의존성 OK]
🧪 Tests: [있음 N개 / 없음(경고됨)]

🔍 Observation: [발견]
⚡ Action: [한 것]
💡 Rationale: [이유]
📝 Learnings: [기록 여부]
🎯 다음: [다음 작업]
━━━━━━━━━━━━
```

## 10. PR (선택)

Jayden이 원하면:
```bash
gh pr create --title "[type]: [설명]" --body "## 변경사항
- [내용]
## 검증
- [x] tsc ✅  - [x] lint ✅  - [x] build ✅
- [x] secrets ✅  - [x] deps ✅  - [x] tests ✅"
```
