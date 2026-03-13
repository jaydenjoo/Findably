---
globs:
  - src/**/*.ts
  - src/**/*.tsx
---

# 에러 처리 규칙

- try/catch 없이 API 호출 금지
- catch에서 console.log만 치고 넘기기 금지
- 유저 대면 에러: 친절한 한국어 메시지
- 서버 에러 상세: 로그에만 기록 (유저 노출 금지)
- API 응답 형식: successResponse / errorResponse (src/lib/api/response.ts)
- 글로벌 ErrorBoundary: app/layout.tsx에 필수
- 5가지 상태 구현: 로딩/정상/빈/에러/오프라인
