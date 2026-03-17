import type {
  AICitationPossibilityScore,
  OverallScore,
} from '@/features/diagnosis-free/types'

/** 종합 점수 mock 데이터 */
export const MOCK_OVERALL_SCORE: OverallScore = {
  score: 52,
  grade: 'warning',
  gradeLabel: '주의',
  categories: [
    {
      id: 'technical',
      name: '기술 SEO',
      score: 68,
      weight: 15,
      passedCount: 8,
      totalCount: 12,
      skippedCount: 1,
      rules: [],
    },
    {
      id: 'content',
      name: '콘텐츠',
      score: 45,
      weight: 25,
      passedCount: 5,
      totalCount: 14,
      skippedCount: 2,
      rules: [],
    },
    {
      id: 'social-ai',
      name: '소셜 & AI 접근성',
      score: 55,
      weight: 12,
      passedCount: 4,
      totalCount: 7,
      skippedCount: 0,
      rules: [],
    },
    {
      id: 'performance',
      name: '성능',
      score: 72,
      weight: 13,
      passedCount: 6,
      totalCount: 8,
      skippedCount: 1,
      rules: [],
    },
    {
      id: 'security',
      name: '보안',
      score: 80,
      weight: 10,
      passedCount: 4,
      totalCount: 4,
      skippedCount: 0,
      rules: [],
    },
    {
      id: 'mobile',
      name: '모바일',
      score: 60,
      weight: 10,
      passedCount: 3,
      totalCount: 5,
      skippedCount: 1,
      rules: [],
    },
    {
      id: 'geo',
      name: 'GEO (AI 검색)',
      score: 35,
      weight: 15,
      passedCount: 2,
      totalCount: 8,
      skippedCount: 2,
      rules: [],
    },
  ],
  quickWins: [
    {
      ruleId: 'meta-description',
      ruleName: 'meta description 누락',
      category: 'content',
      severity: 'critical',
      message:
        '메타 설명이 비어 있습니다. 검색 결과에서 사이트를 설명하는 155자 이내의 문구를 추가하세요.',
      impact: 9,
      source: 'rule',
    },
    {
      ruleId: 'image-alt',
      ruleName: '이미지 alt 텍스트 누락',
      category: 'content',
      severity: 'warning',
      message:
        '12개 이미지 중 7개에 alt 텍스트가 없습니다. 검색 엔진과 스크린 리더가 이미지를 이해할 수 없습니다.',
      impact: 7,
      source: 'rule',
    },
    {
      ruleId: 'schema-markup',
      ruleName: 'Schema Markup 미적용',
      category: 'social-ai',
      severity: 'warning',
      message:
        '구조화 데이터(JSON-LD)가 감지되지 않았습니다. AI가 사이트 정보를 정확히 파악하기 어렵습니다.',
      impact: 6,
      source: 'rule',
    },
    {
      ruleId: 'llms-txt',
      ruleName: 'llms.txt 파일 없음',
      category: 'geo',
      severity: 'info',
      message:
        'AI 크롤러를 위한 llms.txt 파일이 없습니다. AI 검색에서 사이트 요약을 제공하려면 추가하세요.',
      impact: 4,
      source: 'rule',
    },
  ],
  totalRules: 50,
  passedRules: 28,
  failedRules: 15,
  skippedRules: 7,
  evaluatedAt: new Date().toISOString(),
} as const

/** AI 인용 가능성 mock 데이터 */
export const MOCK_AI_CITATION: AICitationPossibilityScore = {
  overallScore: 48,
  passed: false,
  platforms: [
    {
      platform: 'chatgpt',
      platformLabel: 'ChatGPT',
      score: 62,
      blocked: false,
      signals: {
        botAccess: 80,
        contentDiscoverability: 55,
        trustSignals: 45,
      },
    },
    {
      platform: 'claude',
      platformLabel: 'Claude',
      score: 0,
      blocked: true,
      signals: {
        botAccess: 0,
        contentDiscoverability: 55,
        trustSignals: 45,
      },
    },
    {
      platform: 'perplexity',
      platformLabel: 'Perplexity',
      score: 55,
      blocked: false,
      signals: {
        botAccess: 70,
        contentDiscoverability: 50,
        trustSignals: 40,
      },
    },
    {
      platform: 'google',
      platformLabel: 'Google AI Overview',
      score: 70,
      blocked: false,
      signals: {
        botAccess: 90,
        contentDiscoverability: 60,
        trustSignals: 55,
      },
    },
  ],
  recommendation:
    'ClaudeBot이 robots.txt에서 차단되어 있습니다. Claude AI 검색에 사이트가 노출되려면 차단을 해제하세요. 전반적으로 콘텐츠 구조화(Schema Markup)와 신뢰 신호(외부 백링크, 브랜드 언급) 개선이 필요합니다.',
} as const
