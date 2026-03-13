# Findably — 기능 설계서 (Spec)

> STEP 6 | v6.4 워크플로우
> PRD v3.0 + Design System + IA 3종 기반
> 이 문서 = 개발 시공 도면. 여기 없으면 안 만든다.

---

## 1. 랜딩 페이지 (`/`)

### 섹션 구성 (위→아래 순서)

| #   | 섹션           | 높이          | 배경                             |
| --- | -------------- | ------------- | -------------------------------- |
| 1   | GNB            | 64px 고정     | white + border-b + backdrop-blur |
| 2   | Hero           | auto (≈600px) | bg-secondary + 블롭 1개          |
| 3   | Social Proof   | auto (≈100px) | white                            |
| 4   | Problem        | auto          | bg-secondary                     |
| 5   | How It Works   | auto          | white                            |
| 6   | Sample Preview | auto          | bg-secondary                     |
| 7   | Pricing        | auto          | white                            |
| 8   | Final CTA      | auto (≈300px) | slate-900 (다크)                 |
| 9   | Footer         | auto          | slate-900                        |

### 1-1. GNB (Public)

```
[Findably 로고] ──── [기능] [요금제] [샘플 리포트] ──── [로그인] [무료 진단 시작 →]
```

| 요소      | 컴포넌트                 | 스펙                                          |
| --------- | ------------------------ | --------------------------------------------- |
| 로고      | Link                     | DM Sans 800, primary-500, "Findably" 텍스트   |
| 네비 링크 | Link[]                   | text-sm, text-slate-600, hover:text-slate-900 |
| 로그인    | Button variant="ghost"   | text-sm                                       |
| CTA       | Button variant="default" | "무료 진단 시작 →", primary-500 배경          |
| 모바일    | Sheet (햄버거)           | lg 미만에서 활성                              |
| 스크롤    | sticky top-0 z-50        | backdrop-blur-sm, border-b 표시               |

### 1-2. Hero

```
비대칭 2컬럼 (1.2fr + 0.8fr)

좌:
  [뱃지] "SEO + GEO 통합 진단"
  [제목] "AI가 당신을\n추천하고 있나요?"
  [설명] "URL 하나 입력하면 60개 항목 자동 검사.\n검색엔진과 AI 모두에서 잘 보이는지 3분 안에 알려드립니다."
  [CTA 2개]
    Primary: "무료로 내 사이트 진단하기 →" → /signup
    Ghost: "샘플 리포트 보기" → /reports/sample
  [신뢰 지표 3개]
    "60개+ 검사 항목" / "3분 안에 결과" / "AI 인용까지 분석"

우:
  대시보드 스크린샷 or 목업 이미지 (float 애니메이션)
```

| 요소        | 스펙                                                           |
| ----------- | -------------------------------------------------------------- |
| 뱃지        | Badge variant="secondary", text-xs, primary-500 텍스트         |
| 제목        | 44-48px, DM Sans 800, text-slate-900, tracking-tight (-0.03em) |
| 설명        | 18px, text-slate-500, max-w-lg, leading-relaxed                |
| Primary CTA | Button size="lg", h-12, px-8, text-base                        |
| Ghost CTA   | Button variant="ghost", size="lg"                              |
| 신뢰 지표   | 3개 가로 나열, DM Sans 700 숫자 + text-sm 설명                 |
| 모바일      | 세로 스택, 이미지 제거, 중앙 정렬                              |

### 1-3. Social Proof

```
"이미 200개+ 기업이 진단을 시작했습니다" (Phase 1: 숫자 스탯으로 대체)

[60개+ 검사 항목] [SEO + GEO 통합] [3분 안에 결과] [PDF 리포트 제공]
```

> MVP 초기에는 로고 배너 대신 숫자 스탯 4개 가로 나열. 각 항목: 아이콘(40px 원형 배경) + DM Sans 숫자 + 설명

### 1-4. Problem (문제 정의)

```
[뱃지] "왜 필요한가요?"
[제목] "검색만으로는 부족한 시대"

2컬럼 비교 카드:
  좌 (과거): "구글에 '카페 추천' 검색 → 파란 링크 클릭"
  우 (현재): "'이 근처 카페 추천해줘' → ChatGPT가 바로 답변"

[강조 문장]
  "AI가 답변할 때 당신의 사이트를 언급하지 않으면, 고객은 당신을 못 찾습니다."

[CTA 링크] "무료로 확인해보기 →"
```

### 1-5. How It Works (3단계)

```
[뱃지] "이렇게 진행됩니다"
[제목] "3단계, 3분이면 충분합니다"

1 → 2 → 3 (가로 나열 + 연결선)

1. URL 입력: "사이트 주소만 넣으세요"
   아이콘: Link/Globe
2. AI 자동 분석: "60개 항목 + AI 인용까지 검사"
   아이콘: Search/Scan
3. 리포트 확인: "점수 + 문제점 + 바로 고치는 법"
   아이콘: FileText/Chart
```

| 요소      | 스펙                                                   |
| --------- | ------------------------------------------------------ |
| 스텝 번호 | 40px 원형, primary-500 배경, white 텍스트, DM Sans 700 |
| 연결선    | border-dashed, slate-200, 모바일에서 세로              |
| 카드      | 각 스텝 Card 안에 아이콘 + 제목 + 설명                 |

### 1-6. Sample Preview

```
[뱃지] "실제 리포트 미리보기"
[제목] "그린테크의 진단 결과를 확인해보세요"
[설명] "가상 기업의 풀 리포트를 무료로 열람할 수 있습니다."

[리포트 미리보기 카드]
  종합 점수 47점 (ScoreGauge 미니 버전)
  + 카테고리 3개 미리보기
  + "전체 리포트 보기 →" 버튼 → /reports/sample
```

### 1-7. Pricing

```
[뱃지] "투명한 가격"
[제목] "에이전시 1/10 가격으로 시작하세요"

2컬럼 카드:
  좌 (무료):
    "무료 진단"
    "0원"
    - 간단 리포트 (점수 + 문제 3개)
    - AI 인용 가능성 (예측)
    - Quick Win 1개
    [CTA] "무료로 시작하기 →"

  우 (건당, 강조 — border-primary-500 + 인기 뱃지):
    "상세 진단"
    "9.9만원 / 건"
    - 60개+ 항목 상세 분석
    - 경쟁사 3개사 비교
    - 90일 실행 계획
    - Schema 코드 자동 생성
    - PDF 리포트
    [CTA] "상세 진단 받기 →"
    [보조] "첫 진단 50% 할인 → 4.9만원"
```

### 1-8. Final CTA (다크 섹션)

```
배경: slate-900 + 내부 블롭 (primary-500/10%)

[제목] "3분 안에 당신의 마케팅 점수를 확인하세요"
[설명] "URL 하나만 입력하면 됩니다. 무료입니다."
[CTA] "무료 진단 시작 →" (white 배경, slate-900 텍스트)
```

### 1-9. Footer

```
좌: "Findably" 로고 + "AI 마케팅 진단 서비스"
중: [서비스 소개] [요금제] [이용약관] [개인정보처리방침]
우: © 2026 Findably. All rights reserved.
```

---

## 2. 페이지별 컴포넌트 명세

### 2-1. 회원가입 (`/signup`)

| 컴포넌트       | 스펙                                               |
| -------------- | -------------------------------------------------- |
| 레이아웃       | 중앙 정렬, max-w-md, 세로 스택                     |
| 제목           | "무료 진단 시작하기"                               |
| Google 버튼    | Button variant="outline", 전체 너비, Google 아이콘 |
| 구분선         | "또는 이메일로 가입"                               |
| 이메일 Input   | type="email", 필수                                 |
| 비밀번호 Input | type="password", 최소 8자                          |
| 제출 버튼      | "가입하기 →", primary, 전체 너비                   |
| 하단 링크      | "이미 계정이 있나요? 로그인" → /login              |
| 에러           | 필드 하단 text-danger-500, aria-live="polite"      |

### 2-2. 로그인 (`/login`)

| 컴포넌트        | 스펙                                       |
| --------------- | ------------------------------------------ |
| 구조            | /signup과 동일 레이아웃                    |
| 제목            | "로그인"                                   |
| Google 버튼     | 동일                                       |
| 이메일/비밀번호 | 동일                                       |
| 제출 버튼       | "로그인 →"                                 |
| 하단 링크       | "계정이 없나요? 무료로 시작하기" → /signup |

### 2-3. 온보딩 — URL 입력 (`/onboarding/url`)

| 컴포넌트   | 스펙                                                |
| ---------- | --------------------------------------------------- |
| 레이아웃   | 중앙, max-w-lg                                      |
| 프로그레스 | 스텝 1/2 (또는 1/3) 인디케이터                      |
| 제목       | "진단할 사이트 주소를 입력해주세요"                 |
| URL Input  | type="url", placeholder="https://example.com", 필수 |
| 검증       | URL 형식 (Zod), https 권장 안내                     |
| 다음 버튼  | "다음 →", primary                                   |
| 건너뛰기   | 없음 (URL은 필수)                                   |

### 2-4. 온보딩 — 추가 정보 (`/onboarding/info`)

| 컴포넌트          | 스펙                                                       |
| ----------------- | ---------------------------------------------------------- |
| 프로그레스        | 스텝 2/2                                                   |
| 제목              | "추가 정보를 알려주시면 더 정확한 진단이 가능합니다"       |
| 업종 Select       | 선택 목록: SaaS, 쇼핑몰, 전문서비스, 교육, 스타트업, 기타  |
| 타겟 키워드 Input | textarea, placeholder="예: 카페 추천, 강남 맛집", 최대 3개 |
| 경쟁사 URL Input  | 최대 3개, optional                                         |
| 다음 버튼         | "분석 시작 →"                                              |
| 건너뛰기          | "건너뛰고 바로 분석 →" (ghost)                             |

### 2-5. 분석 대기 (`/onboarding/analyzing`)

| 컴포넌트        | 스펙                                                         |
| --------------- | ------------------------------------------------------------ |
| AnalyzingScreen | 전체 화면, 중앙 정렬                                         |
| 프로그레스      | Progress 컴포넌트 (0→100%), primary-500                      |
| 현재 항목       | "메타태그 검사 중...", "링크 구조 분석 중..." (SSE로 실시간) |
| 체크리스트      | 완료 항목 체크 표시 (success-500 아이콘)                     |
| 예상 시간       | "약 2분 소요" 카운트다운                                     |
| 완료            | 자동 redirect → /dashboard                                   |
| 에러            | 재시도 버튼 + "일부 항목이 제한될 수 있습니다" 안내          |

### 2-6. 대시보드 (`/dashboard`)

> F-패턴 레이아웃 — design-system.md 섹션 9 참조

| 영역       | 컴포넌트                      | Free                                            | 유료           |
| ---------- | ----------------------------- | ----------------------------------------------- | -------------- |
| 1 (좌상단) | ScoreGauge (xl)               | 종합 점수                                       | 종합 점수      |
| 1 (좌상단) | 등급 라벨 + 한줄 요약         | 표시                                            | 표시           |
| 2 (우상단) | AICitationCard                | 구조 예측                                       | 실제 추적 결과 |
| 3 (중앙)   | QuickWinCard[] (가로 스크롤)  | 1개만                                           | 전체           |
| 4 (하단)   | CategoryCard[] or BlurOverlay | BlurOverlay                                     | 카테고리 상세  |
| 하단 CTA   | UpgradeCTA (Free만)           | "상세 분석 받기 — 9.9만원" + "샘플 먼저 보기 →" | 미표시         |
| 배너       | SampleBanner (샘플 모드만)    | "그린테크 샘플 결과입니다"                      | 미표시         |

#### ScoreGauge Props

```ts
interface ScoreGaugeProps {
  score: number // 0-100
  size: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean // 등급 라벨 (양호/주의/심각)
  animated?: boolean // 카운트업 애니메이션
}
```

#### AICitationCard Props

```ts
interface AICitationCardProps {
  platforms: {
    name: string // "ChatGPT", "Perplexity", "Gemini"
    cited: boolean // AI가 이 사이트를 인용하는가
    source: 'prediction' | 'actual' // 무료=prediction, 유료=actual
  }[]
  competitorComparison?: {
    // 유료만
    myScore: number
    avgScore: number
  }
}
```

#### QuickWinCard Props

```ts
interface QuickWinCardProps {
  title: string // "Schema Markup 추가"
  description: string // "검색결과에 별점, 가격 등 표시"
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: string // "15분"
  impact: 'high' | 'medium' | 'low'
  actionUrl?: string // "지금 고치기 →" 링크
}
```

### 2-7. 진단 상세 (`/diagnosis/*`)

| 페이지                 | 내용                                                   | Free             | 유료 |
| ---------------------- | ------------------------------------------------------ | ---------------- | ---- |
| /diagnosis/overview    | 카테고리별 점수 (SEO/GEO/기술/콘텐츠) + ScoreGauge 4개 | 표시 (일부 blur) | 전체 |
| /diagnosis/seo         | SEO 항목별 pass/fail 테이블                            | 표시 (일부 blur) | 전체 |
| /diagnosis/geo         | GEO 점수 + AI 인용 상세                                | 표시 (일부 blur) | 전체 |
| /diagnosis/content     | 콘텐츠 품질 분석                                       | 표시 (일부 blur) | 전체 |
| /diagnosis/competitors | 경쟁사 비교 매트릭스                                   | 전체 BlurOverlay | 전체 |

#### 공통 레이아웃

```
[사이드바] + [헤더] + [메인]
  메인:
    [브레드크럼] 대시보드 > 진단 결과 > {카테고리}
    [카테고리 ScoreGauge] (md size)
    [항목 테이블/카드]
      각 항목: 항목명 + pass/fail Badge + 설명 + (유료) 상세 해석
```

### 2-8. 리포트 (`/reports/*`)

| 페이지           | 내용                                                         |
| ---------------- | ------------------------------------------------------------ |
| /reports/sample  | 그린테크 풀 리포트 (블러 없음, 비로그인 가능) + SampleBanner |
| /reports/my      | 내 리포트 목록 (Card 리스트: 날짜 + 점수 + URL)              |
| /reports/my/[id] | 상세 리포트 (유료) + PDF 다운로드 버튼                       |

### 2-9. 실행 도구 (`/actions/*`)

| 페이지             | 내용                                                    | Free        |
| ------------------ | ------------------------------------------------------- | ----------- |
| /actions/schema    | Schema Markup 코드 (JSON-LD) + 복사 버튼 + CMS별 가이드 | BlurOverlay |
| /actions/meta-tags | 메타태그 최적화안 (현재 vs 권장)                        | BlurOverlay |
| /actions/roadmap   | 90일 실행 계획 (주차별 타임라인)                        | BlurOverlay |

### 2-10. 설정 (`/settings/*`)

| 페이지            | 내용                                                   |
| ----------------- | ------------------------------------------------------ |
| /settings/profile | 이메일(읽기전용) + 이름 수정 + 업종 수정               |
| /settings/billing | 결제 내역 테이블 (날짜, 금액, URL, 상태) + 영수증 링크 |

---

## 3. 공통 레이아웃 컴포넌트

### 3-1. Auth Layout (로그인 후)

```
┌─────────┬──────────────────────────────────┐
│         │ [Header: 56px]                   │
│ Sidebar │──────────────────────────────────│
│ 220px   │ [Main Content]                   │
│         │  max-w-[1200px] mx-auto          │
│         │  px-4 py-6                       │
└─────────┴──────────────────────────────────┘
```

- lg 이상: Sidebar 고정 표시
- lg 미만: Sidebar 숨김, Header에 햄버거 메뉴 (Sheet)

### 3-2. Sidebar

| 항목      | 링크                | 아이콘          | Free          | 유료 |
| --------- | ------------------- | --------------- | ------------- | ---- |
| 대시보드  | /dashboard          | LayoutDashboard | O             | O    |
| 진단 결과 | /diagnosis/overview | ClipboardList   | O (부분 blur) | O    |
| 리포트    | /reports/my         | FileText        | O (샘플만)    | O    |
| 실행 도구 | /actions/schema     | Zap             | 🔒 PRO 뱃지   | O    |
| 설정      | /settings/profile   | Settings        | O             | O    |

상태:

- 활성: `bg-primary-50 text-primary-700 font-semibold`
- 비활성: `text-slate-600`
- 호버: `bg-slate-50`
- 잠금: 자물쇠 아이콘 + "PRO" Badge

### 3-3. Header (Auth)

```
[햄버거 (모바일)] [페이지 타이틀] ─────── [프로필 아바타]
```

- 프로필 아바타: 32px 원형, primary-100 배경, 이니셜 텍스트
- 클릭 → DropdownMenu: "설정", "로그아웃"

---

## 4. API 엔드포인트 명세

### 4-1. 인증 (Supabase Auth — 직접 구현 불필요)

| 기능          | Supabase 메서드                                         |
| ------------- | ------------------------------------------------------- |
| 이메일 가입   | `supabase.auth.signUp()`                                |
| 이메일 로그인 | `supabase.auth.signInWithPassword()`                    |
| Google 로그인 | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| 로그아웃      | `supabase.auth.signOut()`                               |
| 세션 확인     | `supabase.auth.getSession()`                            |

### 4-2. Server Actions (Next.js)

| Action        | 경로                               | 입력                                     | 출력                      | 인증        |
| ------------- | ---------------------------------- | ---------------------------------------- | ------------------------- | ----------- |
| submitUrl     | features/onboarding/actions.ts     | `{ url: string }`                        | `{ diagnosisId: string }` | 필수        |
| submitInfo    | features/onboarding/actions.ts     | `{ industry?, keywords?, competitors? }` | `{ success: boolean }`    | 필수        |
| startAnalysis | features/crawling/actions.ts       | `{ diagnosisId: string }`                | SSE stream                | 필수        |
| getDashboard  | features/report/actions.ts         | `{ diagnosisId: string }`                | `DashboardData`           | 필수        |
| getDiagnosis  | features/diagnosis-free/actions.ts | `{ diagnosisId, category }`              | `DiagnosisData`           | 필수        |
| getReport     | features/report/actions.ts         | `{ reportId: string }`                   | `ReportData`              | 필수 + 유료 |
| generatePdf   | features/report/actions.ts         | `{ reportId: string }`                   | PDF blob                  | 필수 + 유료 |
| getSchemaCode | features/actions/actions.ts        | `{ diagnosisId: string }`                | `SchemaCodeData`          | 필수 + 유료 |

### 4-3. API Routes (외부 연동)

| Route                  | Method | 용도                    | 보안            |
| ---------------------- | ------ | ----------------------- | --------------- |
| /api/payments/ready    | POST   | Toss Payments 결제 준비 | 🔴 인증 필수    |
| /api/payments/confirm  | POST   | Toss Payments 결제 승인 | 🔴 서버 검증    |
| /api/payments/webhook  | POST   | Toss 웹훅 수신          | 🔴 서명 검증    |
| /api/crawl/callback    | POST   | n8n 크롤링 완료 콜백    | 🟡 API Key 검증 |
| /api/analysis/callback | POST   | n8n AI 분석 완료 콜백   | 🟡 API Key 검증 |

### 4-4. 주요 타입 정의

```ts
// types/diagnosis.ts
interface DiagnosisItem {
  id: string
  category: 'seo' | 'geo' | 'technical' | 'content'
  name: string
  status: 'pass' | 'fail' | 'warning' | 'skip'
  score: number // 0-100
  description: string
  recommendation?: string // 유료만
  priority: 'high' | 'medium' | 'low'
}

// types/report.ts
interface DashboardData {
  totalScore: number
  grade: 'excellent' | 'good' | 'warning' | 'critical'
  categories: CategoryScore[]
  quickWins: QuickWin[]
  aiCitation: AICitationData
  isPaid: boolean
}

interface CategoryScore {
  category: 'seo' | 'geo' | 'technical' | 'content'
  score: number
  itemCount: number
  passCount: number
}

// types/payment.ts
interface Payment {
  id: string
  userId: string
  diagnosisId: string
  amount: number // 99000 or 49000 (할인)
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  tossPaymentKey?: string
  paidAt?: string
}
```

---

## 5. DB 스키마

### 5-1. 테이블

```sql
-- users: Supabase Auth가 관리 (auth.users)
-- 추가 프로필 정보만 public 테이블로

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  industry TEXT,         -- 업종
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending → crawling → analyzing → completed → failed
  tier TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'paid'
  target_keywords TEXT[],
  competitor_urls TEXT[],
  industry TEXT,
  total_score INTEGER,
  grade TEXT,            -- 'excellent' | 'good' | 'warning' | 'critical'
  crawl_data JSONB,      -- Layer 1~4 크롤링 원시 데이터
  analysis_data JSONB,   -- 룰 기반 + AI 분석 결과
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE diagnosis_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,  -- 'seo' | 'geo' | 'technical' | 'content'
  name TEXT NOT NULL,
  status TEXT NOT NULL,    -- 'pass' | 'fail' | 'warning' | 'skip'
  score INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  recommendation TEXT,     -- 유료만 채워짐
  priority TEXT,           -- 'high' | 'medium' | 'low'
  raw_data JSONB
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnosis_id UUID NOT NULL REFERENCES diagnoses(id),
  amount INTEGER NOT NULL,            -- 원 단위 (99000)
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending → paid → failed → refunded
  toss_payment_key TEXT,
  toss_order_id TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID NOT NULL REFERENCES diagnoses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,     -- 'free' | 'paid'
  dashboard_data JSONB,   -- DashboardData
  pdf_url TEXT,           -- Supabase Storage 경로
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5-2. RLS 정책

```sql
-- profiles: 본인만 CRUD
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

-- diagnoses: 본인만 조회/생성
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own diagnoses"
  ON diagnoses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create diagnoses"
  ON diagnoses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- diagnosis_items: 본인 진단의 항목만
ALTER TABLE diagnosis_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own diagnosis items"
  ON diagnosis_items FOR SELECT
  USING (diagnosis_id IN (
    SELECT id FROM diagnoses WHERE user_id = auth.uid()
  ));

-- payments: 본인만 조회 (생성은 서버에서)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT USING (auth.uid() = user_id);

-- reports: 본인만 조회
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT USING (auth.uid() = user_id);
```

### 5-3. 인덱스

```sql
CREATE INDEX idx_diagnoses_user ON diagnoses(user_id);
CREATE INDEX idx_diagnoses_status ON diagnoses(status);
CREATE INDEX idx_diagnosis_items_diagnosis ON diagnosis_items(diagnosis_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_diagnosis ON payments(diagnosis_id);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_diagnosis ON reports(diagnosis_id);
```

---

## 6. 상태 관리

### 6-1. 원칙

- **서버 상태**: Supabase 데이터 → Server Component에서 직접 fetch
- **클라이언트 상태**: UI 상태만 (모달 열림, 사이드바 토글, 분석 진행률)
- **캐싱**: Next.js 기본 (`revalidatePath`, `revalidateTag`)

### 6-2. 클라이언트 상태 (React Context)

```ts
// 최소한의 전역 상태
interface AppState {
  sidebarOpen: boolean // 모바일 사이드바
  user: User | null // Supabase Auth user
  userTier: 'free' | 'paid' // 현재 진단 건의 결제 상태
}
```

### 6-3. 실시간 업데이트 (분석 진행)

```
클라이언트 → SSE 연결 (/api/analysis/stream?diagnosisId=xxx)
서버 → n8n 콜백 수신 시 SSE로 진행률 push
```

| 이벤트        | 데이터                                    |
| ------------- | ----------------------------------------- |
| progress      | `{ step: string, percent: number }`       |
| item_complete | `{ itemName: string }`                    |
| complete      | `{ redirectUrl: "/dashboard" }`           |
| error         | `{ message: string, retryable: boolean }` |

---

## 7. 에러 처리 매트릭스

| 시나리오              | 사용자에게 보여줄 것                                 | 기술 대응                       |
| --------------------- | ---------------------------------------------------- | ------------------------------- |
| URL 형식 오류         | "올바른 URL을 입력해주세요"                          | Zod validation, 필드 하단 표시  |
| 크롤링 실패 (timeout) | "사이트에 접속할 수 없습니다. URL을 확인해주세요"    | 3회 재시도 후 실패 처리         |
| robots.txt 차단       | "일부 항목이 제한되었습니다" 배너 + 가능 범위 리포트 | 대체 데이터 수집 (Layer 2~3)    |
| 분석 중 에러          | "분석 중 문제가 발생했습니다" + 재시도 버튼          | Sentry 리포트 + 재시도 가능     |
| 결제 취소             | 토스트 "결제가 취소되었습니다"                       | 원래 화면 복귀                  |
| 결제 실패             | 토스트 "결제에 실패했습니다" + "다시 시도"           | 에러 로그 + 재시도 UI           |
| 중복 결제 시도        | 버튼 비활성화 + 로딩 스피너                          | 서버에서 idempotency key 체크   |
| 세션 만료             | 자동 /login 리다이렉트                               | Supabase onAuthStateChange 감지 |
| 네트워크 오류         | "인터넷 연결을 확인해주세요" 배너                    | navigator.onLine 감지           |
| 404 페이지            | "찾으시는 페이지가 없습니다" + 홈 버튼               | app/not-found.tsx               |
| 500 에러              | "서버에 문제가 발생했습니다" + 홈 버튼               | Sentry 자동 리포트              |
| PDF 생성 실패         | "PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요" | 재시도 버튼                     |

---

## 8. 접근 제어 로직

```ts
// middleware.ts 기반 라우트 보호

type AccessLevel = 'public' | 'auth' | 'paid'

const ROUTE_ACCESS: Record<string, AccessLevel> = {
  '/': 'public',
  '/login': 'public',
  '/signup': 'public',
  '/pricing': 'public',
  '/reports/sample': 'public',
  '/onboarding/*': 'auth',
  '/dashboard': 'auth',
  '/diagnosis/overview': 'auth',
  '/diagnosis/seo': 'auth',
  '/diagnosis/geo': 'auth',
  '/diagnosis/content': 'auth',
  '/diagnosis/competitors': 'auth', // UI에서 BlurOverlay 처리
  '/reports/my': 'auth',
  '/reports/my/*': 'auth', // UI에서 BlurOverlay 처리
  '/actions/*': 'auth', // UI에서 BlurOverlay 처리
  '/settings/*': 'auth',
}
```

> BlurOverlay는 middleware가 아닌 **페이지 컴포넌트 레벨**에서 처리.
> 이유: 무료 사용자도 페이지는 접근 가능하되, 콘텐츠만 블러 처리하여 "여기 좋은 게 있다"는 것을 보여줘야 전환율이 높음.

---

## 9. 개발 순서 (STEP 7 로드맵)

> Epic/Task 번호는 PRD 섹션 17 기준

| 순서 | Task                            | 의존성    | 예상 난이도 |
| ---- | ------------------------------- | --------- | ----------- |
| 1    | 1.3 Supabase Auth               | —         | 중          |
| 2    | 1.4 DB 스키마 (마이그레이션)    | 1.3       | 중          |
| 3    | 1.5 GNB + Sidebar + Auth Layout | 1.3       | 중          |
| 4    | 2.1 랜딩 페이지                 | 1.5 (GNB) | 높          |
| 5    | 2.2 회원가입/로그인             | 1.3       | 중          |
| 6    | 2.3 온보딩 (URL + 추가정보)     | 1.4, 2.2  | 중          |
| 7    | 7.1 대시보드 (목업 데이터)      | 1.5       | 높          |
| 8    | 8.1~8.2 샘플 리포트             | 7.1       | 중          |
| 9    | 9.1~9.3 BlurOverlay + 전환 CTA  | 7.1       | 중          |
| 10   | 2.4 분석 대기 화면              | 2.3       | 중          |

> 크롤링(Epic 3), 진단 엔진(Epic 4), AI 분석(Epic 5), 결제(Epic 9.4~9.5)는
> 프론트엔드 UI가 먼저 완성된 후 백엔드 연동. 목업 데이터로 UI 우선 개발.
