---
globs:
  - src/components/**/*
  - src/app/**/*.tsx
---

# 접근성 규칙 (WCAG AA)

- img: alt 필수. 장식용: alt=""
- button/a: 텍스트 없으면 aria-label 필수
- input/select/textarea: id + label htmlFor 연결 필수
- 색상만으로 정보 전달 금지 (아이콘/텍스트 병행)
- focus-visible: outline-2 outline-offset-2 outline-primary
- 색상 대비: 최소 4.5:1
- 키보드: 모든 인터랙티브 요소 Tab 접근 가능
