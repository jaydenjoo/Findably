---
name: new-task
description: >
  새 Task 시작. feature 브랜치 생성 + PROGRESS.md 업데이트.
  Use this agent when: 새 Task를 시작할 때, /new-task 입력 시.
  Examples: "/new-task 로그인 페이지 구현", "/new-task fix/프로필-버그"
---

$ARGUMENTS

## 새 Task 시작 프로토콜

1. **현재 브랜치 확인**: main이 아니면 먼저 main으로 이동하고 pull
```bash
git checkout main
git pull origin main
```

2. **feature 브랜치 생성**: Task 이름으로 브랜치 생성
```bash
git checkout -b feature/[task-name]
```

브랜치 네이밍 규칙:
- `feature/` — 새 기능
- `fix/` — 버그 수정
- `refactor/` — 리팩토링
- `docs/` — 문서 작업

3. **PROGRESS.md 업데이트**: 새 Task를 "진행 중"으로 표시

4. **보고**:
```
🆕 새 Task 시작
━━━━━━━━━━━━━━━━
🌿 브랜치: feature/[task-name]
📍 Task: [Epic X > Task Y]
🎯 목표: [이번 Task에서 완료할 것]
⏱️ 예상: [시간]
━━━━━━━━━━━━━━━━
```
