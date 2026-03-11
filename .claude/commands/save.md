---
name: save
description: >
  현재 작업 맥락을 plan.md에 저장. /compact 또는 /clear 전에 실행하면 다음 세션에서 이어서 작업 가능.
  Use this agent when: 세션이 느려질 때, /compact 전, /clear 전, 긴 작업 중간 저장 시.
  Examples: "/save", "/save API 엔드포인트 3개 중 2개 완료"
---

$ARGUMENTS

## 맥락 저장 프로토콜 (Context Engineering)

plan.md에 현재 작업 상태를 저장해주세요:

### 1. 현재 상태 파악

```bash
echo "Branch: $(git branch --show-current)"
echo "Last commit: $(git log --oneline -3)"
git diff --stat
```

### 2. plan.md 업데이트

아래 항목을 plan.md에 기록:

- **현재 작업**: 지금 하고 있는 Task 이름과 상태
- **기능 목록**: JSON 형식으로 각 기능의 완료 여부
- **아키텍처 결정**: 이번 세션에서 내린 설계 결정 (있으면)
- **핵심 식별자**: 중요 파일 경로, 변수명, 설정값
- **세션 메모**: 다음 세션에서 이어서 할 것, 주의할 점

### 3. 저장 확인

```bash
git add plan.md && git commit -m "docs: save context to plan.md"
```

### 4. 보고

```
💾 맥락 저장 완료
━━━━━━━━━━━━━━━━
📋 plan.md 업데이트됨
📍 현재: [Task명] — [상태]
💡 다음 세션: /start → plan.md 자동 로드
━━━━━━━━━━━━━━━━
이제 /compact 또는 /clear 해도 안전합니다.
```
