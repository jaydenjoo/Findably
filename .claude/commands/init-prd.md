---
name: init-prd
description: >
  PRD 기반 프로젝트 초기 설정. docs/PRD.md를 읽고 CLAUDE.md, PROGRESS.md, plan.md를 자동 세팅한 후 설계 분해까지 안내.
  Use this agent when: 새 프로젝트 시작 시, PRD 작성 후 개발 시작 시, /init-prd 입력 시.
  Examples: "/init-prd", "/init-prd docs/PRD.md"
---

$ARGUMENTS

## PRD 기반 프로젝트 초기 설정 프로토콜

### 0. PRD 파일 확인

```bash
ls docs/PRD.md 2>/dev/null && echo "✅ PRD 발견" || echo "❌ docs/PRD.md 없음"
```

PRD 파일이 없으면:
```
❌ docs/PRD.md를 찾을 수 없습니다.

📋 PRD를 먼저 docs/PRD.md에 저장해주세요:
  1. 웹(claude.ai)에서 작성한 PRD를 복사
  2. docs/PRD.md에 붙여넣기
  3. 다시 /init-prd 실행

또는 PRD 내용을 직접 알려주시면 docs/PRD.md로 저장해드리겠습니다.
```
→ 여기서 중단. PRD 없이 진행하지 않음.

### 1. PRD 읽기 + 검증

docs/PRD.md를 전체 읽고 아래 필수 항목 체크:

```
📋 PRD 검증
━━━━━━━━━━
[ ] 목적 (왜 만드는가)
[ ] 핵심 기능 (무엇을 만드는가)
[ ] 만들지 않을 것 (Not Doing)     ← 없으면 PRD 미완성!
[ ] 기술 스택
[ ] Epic → Task 분해
[ ] 완료 기준
[ ] 보안 분류 (돈·신원·법적)
━━━━━━━━━━
```

**빠진 항목이 있으면:**
- 어떤 항목이 빠져있는지 Jayden에게 알려주기
- "이 항목을 추가해야 진행할 수 있습니다. 제가 초안을 만들어볼까요?" 제안
- Jayden 승인 후 PRD에 추가

**모두 있으면 → 다음 단계로.**

### 2. CLAUDE.md 세팅

PRD에서 추출한 정보로 CLAUDE.md를 업데이트:

- `[프로젝트명]` → PRD의 프로젝트명
- `한줄 설명` → PRD의 목적에서 추출
- `기술 스택` 테이블 → PRD의 스택 반영 (기본 스택과 다른 부분만 수정)
- `아키텍처 규칙` → PRD에 특수한 구조가 있으면 반영
- `보안 분류` → PRD의 보안 분류 반영

**⚠️ 80줄 이내 유지!** 상세 내용은 docs/에 분리.

### 3. PROGRESS.md 세팅

PRD에서 추출한 정보로 PROGRESS.md를 채우기:

- **프로젝트 개요** 테이블: 프로젝트명, 목적, 기술 스택, 보안 분류
- **완료된 작업**: `[x] PRD 작성 완료`, `[x] 프로젝트 초기 세팅`
- **다음 할 일**: PRD의 Epic → Task 분해에서 첫 3~5개 Task를 가져옴
- **핵심 설계 결정사항**: PRD에서 기술 선택과 이유 추출

### 4. plan.md 초기화

현재 계획을 plan.md에 기록:

- **현재 작업**: "프로젝트 초기 설정 완료. 설계 분해 대기 중."
- **기능 목록**: PRD의 핵심 기능을 JSON 배열로 변환

```json
[
  {"id": 1, "description": "기능1 설명", "status": "not_started", "depends_on": []},
  {"id": 2, "description": "기능2 설명", "status": "not_started", "depends_on": [1]}
]
```

- **아키텍처 결정**: PRD에서 추출
- **핵심 식별자**: 주요 파일 경로 초기 정리

### 5. docs/architecture.md 세팅

PRD의 기술 스택과 아키텍처 관련 내용으로 docs/architecture.md 초안 작성:
- 선택한 기술과 이유
- 디렉토리 구조 설명
- 데이터 흐름 (간략)

### 6. Git 커밋

```bash
git add -A
git commit -m "docs: initialize project from PRD

- CLAUDE.md: project config
- PROGRESS.md: task tracking
- plan.md: external memory
- docs/architecture.md: tech decisions"
```

### 7. 결과 보고

```
🚀 PRD 기반 초기 설정 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━
📦 프로젝트: [프로젝트명]
📝 목적: [한줄 설명]
🔐 보안 분류: [🟡 일반 / 🔴 보안]
📊 기능 수: [N개]

📂 설정된 파일:
  ✅ CLAUDE.md — 프로젝트 설정 ([N]줄)
  ✅ PROGRESS.md — Epic/Task 목록
  ✅ plan.md — 기능 목록 (JSON)
  ✅ docs/architecture.md — 기술 결정

⚡ 다음 단계:
  1. 위 내용 확인 후 "승인"
  2. /kiro:spec-init → 요구사항 상세화
  3. /kiro:spec-design → 기술 설계
  4. /kiro:spec-tasks → Task 분해
  5. /new-task [첫 번째 Task] → 코딩 시작!
━━━━━━━━━━━━━━━━━━━━━━━━━

확인하시고 수정할 부분 있으면 말씀해주세요.
승인하시면 /kiro:spec-init으로 넘어갑니다.
```
