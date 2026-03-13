---
globs:
  - src/features/**/*
---

# 모듈 구조 규칙 (features/ 아키텍처)

- features/A에서 features/B 직접 import 금지
- 공통 필요 -> shared/로 추출
- 외부 서비스 직접 호출 금지 -> lib/adapters/ 통해서만
- 매직 넘버 금지 -> config/ 파일에서 import
- 모듈 내 index.ts가 공개 인터페이스
- 새 모듈: features/[이름]/ + components/ + hooks/ + api/ + types.ts + index.ts

## Findably 모듈 목록

- onboarding: URL 입력 + 선택 정보
- crawling: Playwright + n8n 크롤링
- diagnosis-free: 무료 미리보기
- diagnosis-paid: 유료 전체 진단
- geo-engine: GEO 분석 엔진
- competitors: 경쟁사 분석
- report: 리포트 생성/조회
- actions: 실행 계획 (schema, meta-tags, roadmap)
- payment: Toss Payments 결제 (🔴)
- sample: 샘플 리포트
