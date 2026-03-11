---
name: start
description: >
  세션 시작 프로토콜. 현재 위치 확인 + Git 상태 확인 + 외부 메모리 로드 + 작업 범위 승인.
  Use this agent when: 세션 시작 시, /start 입력 시.
---

세션 시작 프로토콜을 실행해주세요:

## 1. 환경 확인
- 현재 Git 브랜치와 마지막 커밋 확인:
```bash
echo "Branch: $(git branch --show-current)"
echo "Last commit: $(git log --oneline -1)"
echo "Uncommitted changes: $(git status --short | wc -l) files"
```

## 2. 외부 메모리 로드 (Context Engineering)
순서대로 읽기:
1. PROGRESS.md → 전체 프로젝트 현황
2. plan.md → 현재 계획, 아키텍처 결정, 기능 목록 (있으면)
3. docs/learnings.md → 과거 교훈 (있으면)

## 3. 세션 시작 보고

```
🔄 세션 시작 보고
━━━━━━━━━━━━━━━━
📌 현재 모델: [모델명]
🌿 브랜치: [현재 브랜치]
📝 마지막 커밋: [커밋 메시지]
⚠️ 미커밋 변경: [N개 파일]
📍 현재 위치: [Epic X] > [Task Y]
📚 로드된 교훈: [핵심 N개 요약]
📋 plan.md 상태: [있음/없음, 핵심 내용 한줄]
🎯 이번 세션 제안: [작업 범위]
⏱️ 예상 소요: [시간]
━━━━━━━━━━━━━━━━
진행할까요?
```

## 4. 승인 대기
- Jayden이 승인하면 작업 시작
- 필요 시 브랜치 생성 제안: `git checkout -b feature/[작업명]`
