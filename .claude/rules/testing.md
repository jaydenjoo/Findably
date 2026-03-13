---
globs:
  - '**/*.test.*'
  - '**/*.spec.*'
  - src/test-setup.ts
  - e2e/**/*
---

# 테스팅 규칙

- 테스트 프레임워크: Vitest (단위/통합), Playwright (E2E)
- 패턴: Arrange -> Act -> Assert (AAA)
- 테스트명: 행동 기반 — "should [행동] when [조건]"
- 해피 패스 + 실패 패스 + 엣지 케이스 모두 작성
- 엣지 케이스 필수: 빈 입력, null, 특수문자, 경계값
- 외부 의존성 모킹: MSW 사용. 내부 모듈 모킹 최소화
- 플레이키 테스트 금지: setTimeout, 하드코딩 대기 금지
- 커버리지 기준: 70% (lines, functions, branches, statements)
- 테스트 실행 후 결과 보고 필수
