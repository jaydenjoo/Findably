---
name: review
description: 3명 병렬 리뷰 실행. 코드 리뷰어 + 보안 리뷰어 + QA 테스터가 독립적으로 최근 변경사항을 검토한다.
---

최근 변경된 코드에 대해 3명의 리뷰어를 병렬로 실행해주세요:

1. **code-reviewer** 에이전트: 코드 품질, TypeScript strict, SRP, 중복 제거
2. **security-reviewer** 에이전트: 보안 취약점, 인젝션, 인증 우회, 데이터 노출
3. **qa-tester** 에이전트: 누락된 테스트 케이스, 엣지 케이스 식별

각 리뷰어는 독립적으로 검토하고, 결과를 종합하여 아래 형식으로 보고:

```
## 리뷰 종합
Verdict: ✅ APPROVE / ⚠️ COMMENTS / 🔴 CHANGES NEEDED

### code-reviewer 결과
[결과]

### security-reviewer 결과
[결과]

### qa-tester 결과
[결과]

### 종합 액션 아이템
- [ ] [수정 필요 사항]
```
