# Navigation Map — Findably

> PRD v3.0 + Dashboard Sample v2.1 기반

## GNB — Public (비로그인)

| 위치 | 메뉴             | 링크            | 비고                      |
| ---- | ---------------- | --------------- | ------------------------- |
| 좌측 | Findably (로고)  | /               | DM Sans, 800, primary-600 |
| 중앙 | 기능             | /#features      | 앵커 스크롤               |
| 중앙 | 요금제           | /pricing        | —                         |
| 중앙 | 샘플 리포트      | /reports/sample | —                         |
| 우측 | 로그인           | /login          | ghost 버튼                |
| 우측 | 무료 진단 시작 → | /signup         | primary CTA               |

## Sidebar — Auth Required (로그인 후)

| 순서 | 메뉴      | 링크                | 아이콘 | Free           | 유료 |
| ---- | --------- | ------------------- | ------ | -------------- | ---- |
| 1    | 대시보드  | /dashboard          | 📊     | ✅             | ✅   |
| 2    | 진단 결과 | /diagnosis/overview | 📋     | ✅ (일부 Blur) | ✅   |
| 3    | 리포트    | /reports/my         | 📄     | ✅ (샘플만)    | ✅   |
| 4    | 실행 도구 | /actions/schema     | ⚡     | 🔒 Blur        | ✅   |
| 5    | 설정      | /settings/profile   | ⚙️     | ✅             | ✅   |

> 사이드바: 220px 고정, lg(1024px) 이상에서 표시
> 모바일: 햄버거 메뉴 → 오버레이 사이드바

### Sidebar 상태

- **활성**: bg-primary-50, text-primary-700, font-semibold, `aria-current="page"`
- **비활성**: bg-transparent, text-slate-600, font-normal
- **호버**: bg-slate-50
- **잠금(Free)**: 자물쇠 아이콘 + 메뉴명 옆 "PRO" 뱃지

## 헤더 (Auth)

| 위치 | 요소          | 설명                                |
| ---- | ------------- | ----------------------------------- |
| 좌측 | 페이지 타이틀 | 현재 페이지명 (데스크톱)            |
| 좌측 | 햄버거 + 로고 | 모바일만                            |
| 우측 | 프로필 아바타 | 이니셜, 32px 원형, primary-100 배경 |

## 대시보드 히어로 카드 (F-패턴)

| 순서          | 카드                            | 클릭 시             | Free           | 유료           |
| ------------- | ------------------------------- | ------------------- | -------------- | -------------- |
| 1 (좌상단)    | 종합 마케팅 점수 (ScoreGauge)   | /diagnosis/overview | ✅             | ✅             |
| 2 (우상단)    | AI 인용 가능성 (AICitationCard) | /diagnosis/geo      | ✅ (구조 예측) | ✅ (실제 추적) |
| 3 (중앙 전체) | Quick Win 카드 (가로 스크롤)    | 개별 항목 상세      | ✅ (1개만)     | ✅ (전체)      |
| 4 (하단)      | 카테고리별 상세 or BlurOverlay  | /diagnosis/\*       | BlurOverlay    | ✅             |

## 유료 전환 유도 (Free에게만)

| 위치                   | 요소         | 내용                                                      |
| ---------------------- | ------------ | --------------------------------------------------------- |
| 대시보드 하단          | BlurOverlay  | 상세 분석 미리보기 (상단 25-30% 선명)                     |
| 대시보드 최하단        | CTA 카드     | "상세 분석 받기 — 9.9만원" + "샘플 먼저 보기 →"           |
| 대시보드 상단          | SampleBanner | "이것은 그린테크의 샘플 분석 결과입니다" (샘플 모드일 때) |
| /diagnosis/competitors | BlurOverlay  | 경쟁사 비교 전체 블러                                     |
| /reports/my/[id]       | BlurOverlay  | PDF 다운로드 + 상세 항목 블러                             |
| /actions/\*            | BlurOverlay  | 실행 도구 전체 블러                                       |

## 브레드크럼 규칙

- 2단계 이상 depth에서 표시
- 형식: `대시보드 > 진단 결과 > SEO`
- `aria-label="현재 위치"` 필수
