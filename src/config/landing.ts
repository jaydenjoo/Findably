/** 랜딩 페이지 모든 섹션 상수 — 하드코딩 금지, 여기서만 정의 */
export const LANDING = {
  hero: {
    badge: 'AI 마케팅 진단',
    title: {
      line1: 'URL 하나로',
      highlight: '마케팅 누수 진단',
    },
    description:
      '웹사이트에서 새는 마케팅 비용부터 찾아드립니다. SEO, AI 검색(GEO), 콘텐츠, 기술 인프라 — 60개 항목을 진단하고 가장 돈이 많이 새는 곳부터 고치는 순서를 알려드립니다.',
    cta: {
      primary: '무료 진단 시작 →',
      secondary: '샘플 리포트 보기',
    },
    stats: [
      { value: '60+', label: '진단 항목' },
      { value: '2분', label: '분석 시간' },
      { value: '0원', label: '무료 진단' },
    ],
  },

  problem: {
    title: '검색의 규칙이 바뀌었습니다',
    before: {
      label: '예전',
      text: '"카페 추천" → 구글 검색 → 파란 링크 클릭',
    },
    after: {
      label: '지금',
      text: '"이 근처 카페 추천해줘" → ChatGPT → AI가 바로 답변',
    },
    question: 'AI가 답변할 때, 당신의 사이트를 언급하나요?',
    subtext: '언급하지 않으면, 고객은 당신을 찾지 못합니다.',
  },

  howItWorks: {
    title: '3단계로 끝나는 마케팅 진단',
    steps: [
      {
        number: 1,
        title: 'URL 입력',
        description: '사이트 주소만 넣으세요. 다른 정보는 선택사항입니다.',
      },
      {
        number: 2,
        title: 'AI 분석',
        description: '60개 이상 항목을 자동 검사합니다. 약 2분이면 완료.',
      },
      {
        number: 3,
        title: '리포트 확인',
        description:
          '점수, 문제점, 그리고 바로 실행할 수 있는 개선안을 받으세요.',
      },
    ],
  },

  features: {
    title: 'SEO + GEO, 한 번에 진단',
    cards: [
      {
        title: 'SEO 진단',
        description:
          '메타태그, 구조화 데이터, 속도, 모바일, 보안까지. 구글이 보는 60개 항목을 체크합니다.',
        highlight: true,
      },
      {
        title: 'GEO 추적',
        description:
          'ChatGPT, Perplexity 같은 AI가 당신의 사이트를 추천하는지 실제로 추적합니다.',
        highlight: false,
      },
      {
        title: '90일 실행 계획',
        description:
          '뭘 먼저 고쳐야 하는지 우선순위를 정하고, 코드까지 생성해 드립니다.',
        highlight: false,
      },
    ],
  },

  samplePreview: {
    title: '이런 리포트를 받게 됩니다',
    description: '가상 회사 "그린테크"의 실제 진단 결과를 미리 확인하세요.',
    score: 72,
    metrics: [
      { label: 'SEO 점수', value: 68, color: 'bg-primary-500' },
      { label: 'GEO 점수', value: 45, color: 'bg-warning-500' },
      { label: '콘텐츠 품질', value: 82, color: 'bg-success-500' },
    ],
    cta: '그린테크 샘플 전체 보기 →',
  },

  pricing: {
    title: '투명한 가격',
    description: '숨은 비용 없이, 필요한 만큼만.',
    plans: [
      {
        name: '무료 진단',
        price: '0원',
        priceUnit: '',
        description: '기본 진단으로 시작하세요',
        features: [
          '종합 점수 + 등급',
          '주요 문제 3개 발견',
          'Quick Win 1개 제공',
          'AI 인용 가능성 예측',
        ],
        cta: '무료로 시작 →',
        href: '/signup',
        recommended: false,
      },
      {
        name: '상세 진단',
        price: '9.9만원',
        priceUnit: '/건',
        description: '5명의 AI 전문가가 분석합니다',
        features: [
          '60개+ 항목 상세 분석',
          '경쟁사 3개 비교',
          '90일 실행 계획',
          'AI 인용 실제 추적',
          'Schema 코드 자동 생성',
          'PDF 리포트 다운로드',
        ],
        cta: '상세 분석 받기 →',
        href: '/signup',
        recommended: true,
      },
    ],
  },

  faq: {
    title: '자주 묻는 질문',
    items: [
      {
        q: '마케팅 진단이 왜 필요한가요?',
        a: "중소기업 73%가 '마케팅에 돈은 쓰는데 뭐가 효과인지 모르겠다'고 합니다. (Constant Contact 2025, SMB 2,500개사 조사) 진단 없이 마케팅을 하는 건, 건강검진 없이 약을 먹는 것과 같습니다.",
      },
      {
        q: 'Findably는 어떤 서비스인가요?',
        a: 'URL 하나만 입력하면 AI가 SEO + GEO 통합 진단을 제공하는 마케팅 진단 플랫폼입니다. 60개+ 항목을 자동 분석하여 비즈니스 영향도 기반 실행 계획을 제공합니다.',
      },
      {
        q: '진단은 얼마나 걸리나요?',
        a: '약 60초면 완료됩니다. URL 입력부터 리포트 확인까지 5분 이내입니다.',
      },
      {
        q: '기존 SEO 대행업체와 어떤 차이가 있나요?',
        a: '대행업체는 월 수백만원의 지속 비용이 발생하지만, Findably는 무료 진단으로 시작해서 건당 9.9만원으로 상세 분석까지 가능합니다. 직접 판단할 수 있는 도구입니다.',
      },
      {
        q: 'GEO(AI 검색 최적화)란 무엇인가요?',
        a: 'ChatGPT, Perplexity, Google AI Overviews 같은 AI 검색에서 당신의 서비스가 추천되도록 최적화하는 것입니���. 2026년 마케팅의 핵심 영역입니다.',
      },
      {
        q: '진단 결과는 얼마나 정확한가요?',
        a: 'Google 알고리즘 기준과 업종 벤치마크 데이터를 기반으로 60개+ 항목을 분석합니다. 비즈니스 영향도는 업종 평균 추정치이며, 방향성 판단에 활용하시기를 권장합니다.',
      },
      {
        q: '무료 진단만 받아도 되나요?',
        a: '네. 첫 진단은 완전 무료이며 카드 정보도 불필요합니다. 무료 진단만으로도 즉시 실행 가능한 개선 가이드를 받으실 수 있습니다.',
      },
    ],
  },

  finalCta: {
    title: '지금 바로 시작하세요',
    description: '2분이면 당신 사이트의 마케팅 점수를 알 수 있습니다.',
    cta: {
      primary: '무료 진단 시작 →',
      secondary: '샘플 먼저 보기',
    },
  },
} as const
