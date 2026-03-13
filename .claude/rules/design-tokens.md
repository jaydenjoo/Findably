---
globs:
  - src/app/**/*.tsx
  - src/components/**/*.tsx
  - src/app/globals.css
---

# 디자인 토큰 규칙

## 색상

- brand: #2b7cff (Findably 브랜드)
- 배경: #fafbfc (순백 #FFFFFF 단독 배경 금지)
- 텍스트: gray-900/700/500 위계

## 폰트

- 본문: Pretendard — Inter/Roboto/Arial 사용 금지
- 제목(display): DM Sans
- 코드: JetBrains Mono

## 그림자 (2레이어 필수)

- shadow-sm: 0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)
- shadow-md: 0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)
- shadow-lg: 0 4px 12px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.08)

## 모서리

- 버튼: 8px / 입력: 12px / 카드: 16px / 큰카드: 20px / 섹션: 24px

## 여백 리듬

- 섹션 간: 64-80px / 요소 간: 16-24px / 텍스트 간: 8-12px

## Anti-AI-Slop

- 보라 그라데이션+흰 배경 금지
- 균등 3컬럼, 모든 카드 동일 크기 금지
- 전체 동시 fade-in 금지 (순차 등장: delay 0.08-0.15s)
- hover 효과 없는 인터랙티브 요소 금지
