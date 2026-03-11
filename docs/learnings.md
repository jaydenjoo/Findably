# 📚 Learnings — 복리 지식 저장소

> 같은 실수를 반복하지 않기 위한 교훈 기록
> **형식**: 증상 → 원인 → 해결 → **규칙** (규칙이 핵심!)

---

<!-- 예시 (실제 기록 시 이 예시는 삭제) -->

### 2026-03-10 [예시] Tailwind v4 그라데이션 클래스 변경
- **증상**: `bg-gradient-to-r` 클래스가 작동하지 않음
- **원인**: Tailwind v4에서 `bg-gradient-to-*` → `bg-linear-to-*`로 변경됨
- **해결**: 모든 그라데이션 클래스를 `bg-linear-to-*`로 교체
- **규칙**: Tailwind v4에서는 항상 `bg-linear-to-*` 사용. `npx @tailwindcss/upgrade` 실행으로 자동 변환 가능

---

<!-- 여기부터 실제 기록 -->
