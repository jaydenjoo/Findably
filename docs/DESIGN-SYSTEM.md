# Findably Design System
## Claude Code 개발 시 반드시 참조할 디자인 규칙

---

## 1. 브랜드 아이덴티티

- **서비스명**: Findably (파인더블리)
- **로고**: 퍼플→오렌지 그라데이션 사각형(radius 8px) 안에 흰색 "F" 볼드체
- **톤**: 전문적이면서 친근한. "마케팅을 처음 하는 스타트업 대표가 편하게 느끼는" 톤
- **절대 금지**: AI가 만든 느낌의 다크모드+파란 그라데이션, 이모지 아이콘 남용, 균일한 카드 그리드

---

## 2. 컬러 시스템

### Primary Colors
```css
--brand:        #6C3CE0;   /* 메인 퍼플 - CTA, 활성 상태, 강조 */
--brand-dark:   #4A1FB8;   /* 진한 퍼플 - 호버, 그라데이션 끝 */
--brand-light:  #EDE7FB;   /* 연한 퍼플 - 선택 상태 배경, 사이드바 활성 */
--brand-glow:   rgba(108,60,224,0.08);  /* 글로우 - AI 인사이트 카드 배경 */
```

### Accent Colors
```css
--accent:       #FF6B35;   /* 오렌지 - 주의, 보조 강조, 경고 */
--accent-light: #FFF0EA;   /* 연한 오렌지 배경 */
```

### Semantic Colors
```css
--green:        #0FAA6C;   /* 성공, 상승, 완료, 양호 */
--green-light:  #E8F8F0;
--yellow:       #E5A100;   /* 경고, 보통, 주의 필요 */
--yellow-light: #FFF8E6;
--red:          #E5334B;   /* 위험, 하락, 오류 */
--red-light:    #FDE8EB;
```

### Neutral Colors
```css
--bg:           #FAFBFD;   /* 페이지 배경 (순백 아님, 약간 차가운 회색) */
--surface:      #FFFFFF;   /* 카드, 모달 배경 */
--surface-alt:  #F4F1FE;   /* 보조 배경 (연한 퍼플 틴트) */
--border:       #E8E5F0;   /* 기본 보더 */
--border-light: #F0EDF8;   /* 연한 보더 (카드 내부 구분선) */
--text:         #1A1335;   /* 기본 텍스트 (진한 네이비) */
--text-sec:     #5C5775;   /* 보조 텍스트 */
--text-muted:   #9B95AD;   /* 비활성 텍스트, 힌트 */
```

### 점수별 컬러 매핑
```
75-100점: --green  (우수)
50-74점:  --yellow (양호)
30-49점:  --accent (주의)
0-29점:   --red    (위험)
```

---

## 3. 타이포그래피

### 폰트 패밀리
```css
--font-primary: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;
```

- **Pretendard**: 한국어 최적화 폰트. CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css`
- **JetBrains Mono**: 코드 블록 전용

### 크기 & 무게
```
페이지 제목 (H1):     22px / weight 800
섹션 제목 (H2):       20px / weight 800
카드 제목:            15px / weight 700-800
본문:                 14px / weight 400-500
본문 강조:            14px / weight 600
보조 텍스트:          13px / weight 400-500
캡션/라벨:           12px / weight 600-700
태그/배지:           11px / weight 700
```

### 행간
```
제목: line-height 1.2-1.3
본문: line-height 1.6-1.7
```

---

## 4. 공간 & 레이아웃

### Spacing Scale (8px 기반)
```
4px   - 태그 내부 패딩
8px   - 아이템 간 최소 간격
12px  - 카드 간 간격 (리스트)
16px  - 카드 내부 패딩 (컴팩트)
20px  - 카드 내부 패딩 (기본)
24px  - 카드 내부 패딩 (넓음), 섹션 간 간격
28px  - 메인 콘텐츠 패딩
32px  - 사이드바 상단 마진
```

### Border Radius
```
--radius:    12px;  /* 카드, 대형 요소 */
--radius-sm: 8px;   /* 버튼, 입력 필드, 코드 블록 */
--radius-xs: 6px;   /* 태그, 체크박스, 작은 요소 */
--radius-pill: 100px; /* 칩, 뱃지, 필터 태그 */
```

### Shadows
```css
--shadow:    0 1px 3px rgba(26,19,53,0.06), 0 1px 2px rgba(26,19,53,0.04);
--shadow-lg: 0 10px 40px rgba(26,19,53,0.08), 0 2px 8px rgba(26,19,53,0.04);
--shadow-brand: 0 4px 20px rgba(108,60,224,0.2);  /* 브랜드 CTA 전용 */
```

---

## 5. 핵심 컴포넌트 규칙

### 5-1. ScoreCircle (점수 원형)
- SVG 기반, 배경 원 + 프로그레스 원 + 중앙 텍스트
- 배경 원: 해당 점수 등급의 light 컬러로 채움 (예: 75점 이상 = greenLight)
- 프로그레스 원: 해당 점수 등급의 main 컬러
- stroke-linecap: round
- 애니메이션: stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)
- 중앙: 점수 숫자 (fontWeight 800) + "/100" (fontSize 10, textMuted)

### 5-2. Card
- background: white
- border: 1px solid --border
- border-radius: --radius (12px)
- padding: 20px (기본)
- box-shadow: --shadow
- 특수 카드: borderLeft 4px solid --brand (AI 인사이트 카드)

### 5-3. Tag (뱃지)
- border-radius: 100px (pill)
- padding: 4px 10px
- font-size: 11px / weight 700
- background: 해당 컬러의 14% 투명도 (예: `${color}14`)
- color: 해당 컬러 원색

### 5-4. Button
- Primary: background --brand, color white, shadow --shadow-brand, border-radius --radius-sm
- Secondary: background white, border 1px solid --border, color --text
- Ghost: background transparent, border none, color --text-sec
- Small: padding 7px 16px, font-size 13px
- Default: padding 11px 24px, font-size 14px

### 5-5. ProgressBar
- 배경: --border-light
- 채움: 해당 컬러
- border-radius: 높이와 동일
- 높이: 기본 6px
- transition: width 1s ease

### 5-6. Input
- background: --bg (#FAFBFD)
- border: 1px solid --border
- border-radius: --radius-sm
- padding: 11px 14px
- font-size: 14px
- focus: border-color --brand

### 5-7. Chip (선택 칩 - 온보딩)
- border-radius: 100px (pill)
- padding: 8px 16px
- font-size: 13px / weight 600
- 비선택: border 1.5px solid --border, color --text-sec
- 선택: border 1.5px solid --brand, background --brand-light, color --brand

---

## 6. 페이지별 레이아웃 규칙

### 6-1. 랜딩 페이지
- 최대 너비: 960px, 중앙 정렬
- 히어로: 2컬럼 비대칭 (좌 텍스트 / 우 미니 대시보드 미리보기)
- URL 입력: border 2px solid --brand, shadow --shadow-brand
- 3단계 설명: 3컬럼 카드, 각 카드 우측 상단에 큰 스텝 번호 워터마크
- 소셜 프루프: --surface-alt 배경, 4개 수치 가로 나열

### 6-2. 온보딩 (Step 1-3)
- 최대 너비: 500px, 수직 중앙 정렬
- 상단: 프로그레스 바 (3단계, 각각 flex 1, 높이 4px)
- 폼: Card 컴포넌트 안에 배치
- 하단: 이전/다음 버튼 좌우 배치

### 6-3. 대시보드 (로그인 후)
- 사이드바: 220px 고정, 좌측
- 메인: flex 1, padding 28px, background --bg
- 상단: 페이지 제목 + 설명 + 우측 액션 버튼
- 점수 히어로: 좌측 ScoreCircle + 우측 텍스트 설명 (Card 안, 수평 분할)
- 5개 카테고리: 5컬럼 균등 카드
- 하단 2컬럼: Quick Win 리스트 + AI 인사이트

### 6-4. 사이드바
- width: 220px
- background: white
- border-right: 1px solid --border
- 상단: 로고 + 서비스명
- 네비: 아이콘(기하학 심볼) + 라벨, 활성 시 --brand-light 배경
- 하단: 업그레이드 CTA 카드 (--surface-alt 배경)

---

## 7. 아이콘 규칙

### 사이드바 네비게이션 아이콘
```
대시보드:    ◉  (또는 lucide-react LayoutDashboard)
상세 분석:   ◎  (또는 lucide-react Search)
액션 아이템: ⚡  (또는 lucide-react Zap)
경쟁사 비교: ⊞  (또는 lucide-react BarChart3)
리포트:      ◫  (또는 lucide-react FileText)
설정:        ⚙  (또는 lucide-react Settings)
```

**실제 개발 시 lucide-react 사용을 권장합니다.** 기하학 심볼은 와이어프레임용이며, 프로덕션에서는 lucide-react 아이콘 세트를 사용하세요.

### 금지 아이콘
- ❌ 이모지 아이콘 (📊⚡📈 등) — 아마추어 느낌
- ❌ Font Awesome — 구식
- ✅ lucide-react — 모던, 일관성, shadcn/ui와 호환

---

## 8. 모션 & 인터랙션

### 기본 트랜지션
```css
transition: all 0.2s ease;          /* 버튼, 호버 */
transition: all 0.25s ease;         /* 카드 호버 */
transition: width 1s ease;          /* 프로그레스 바 */
transition: stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1);  /* 점수 원형 */
transition: background 0.3s;        /* 프로그레스 스텝 */
```

### 로딩 스피너
- 원형 border 스피너 (border-top 투명)
- 컬러: --brand
- animation: spin 0.8s linear infinite

### 호버 효과
- 카드: shadow 증가 (--shadow → --shadow-lg)
- 버튼: opacity 0.9 또는 약간 어두워짐
- 링크: color --brand

---

## 9. 반응형 규칙

### Breakpoints
```
Desktop: >= 1024px (기본)
Tablet:  768px - 1023px
Mobile:  < 768px
```

### 반응형 변경
- 사이드바: tablet 이하에서 접힘 (아이콘만 또는 햄버거 메뉴)
- 5컬럼 카테고리: tablet에서 3+2, mobile에서 1컬럼
- 2컬럼 레이아웃: mobile에서 1컬럼 스택
- 랜딩 히어로: mobile에서 1컬럼 (이미지 하단)
- 폰트 크기: mobile에서 H1 28px, H2 18px으로 축소

---

## 10. 코드 블록 (Schema 미리보기 등)

```css
background: #1A1335;           /* 진한 네이비 (브랜드 다크) */
border-radius: --radius-sm;
padding: 16px;
font-family: --font-mono;
font-size: 12px;
line-height: 1.8;
```

### 구문 하이라이트 색상
```
문자열(값):    #FCA5A5  (연한 빨강)
키(속성명):    #93C5FD  (연한 파랑)
중괄호/괄호:   #6EE7B7  (연한 초록)
기본 텍스트:   #A78BFA  (연한 퍼플)
```

---

## 11. 참고 레퍼런스 (개발 시 직접 확인)

| 용도 | URL | 참고 부분 |
|------|-----|----------|
| URL 입력 → 결과 UX | https://website.grader.com | 온보딩 플로우, 점수 시각화 |
| 대시보드 전체 느낌 | https://morningscore.io | 퍼플 테마, 게이미피케이션, 미션 시스템 |
| 점수 + 개선 리스트 | https://www.seoptimer.com | 등급 시스템, 항목별 분석 UI |
| 점수 원형 시각화 | https://pagespeed.web.dev | 0-100 원형 점수 표준 |
| 컴포넌트 라이브러리 | https://ui.shadcn.com | 실제 사용할 컴포넌트 |

---

## 12. 개발 스택 지정

```
Framework:    Next.js 15 (App Router)
UI:           shadcn/ui + Tailwind CSS
Font:         Pretendard (CDN)
Icons:        lucide-react
Charts:       Recharts (점수 추이 등)
State:        React state (zustand 필요 시 추가)
Auth:         Supabase Auth
DB:           Supabase (PostgreSQL)
API:          Claude API (Sonnet)
Automation:   n8n (별도 서버)
Deploy:       Vercel
```

---

*이 문서는 Claude Code가 코드 작성 시 참조하는 디자인 가이드입니다.*
*DESIGN-REFERENCE.jsx (와이어프레임 코드)와 함께 사용하세요.*
