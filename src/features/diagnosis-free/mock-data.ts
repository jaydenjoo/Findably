import type {
  OverallScore,
  CategoryScore,
  RuleResult,
  QuickWin,
  AICitationPossibilityScore,
  AICitationSignals,
  PlatformCitationScore,
} from './types'
import { CATEGORY_CONFIG, AI_PLATFORM_LABELS } from './constants'

/**
 * Mock Data for Dashboard Development
 * ├─ Realistic score distribution (67 = "good" grade)
 * ├─ All 7 categories with diverse rule states (passed/failed/skipped)
 * ├─ High-impact QuickWins sorted by severity priority
 * ├─ AI citation platform scores respecting weights (ChatGPT 40%, Claude 30%, Perplexity 20%, Google 10%)
 * └─ Korean user-facing messages
 */

// ─── Mock Rule Results (diverse states: passed/failed/skipped) ───

const mockTechnicalRules: RuleResult[] = [
  {
    id: 'tech-1',
    category: 'technical',
    name: 'H1 태그 존재 여부',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message: '페이지에 H1 태그가 정확히 1개 존재합니다.',
    quickWinEligible: false,
  },
  {
    id: 'tech-2',
    category: 'technical',
    name: 'robots.txt 존재',
    points: 5,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message: 'robots.txt 파일이 없거나 접근 불가합니다.',
    quickWinEligible: true,
  },
  {
    id: 'tech-3',
    category: 'technical',
    name: 'sitemap.xml 존재',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: true,
    severity: 'info',
    message: '데이터 없음 (부분 크롤링)',
    quickWinEligible: false,
  },
  {
    id: 'tech-4',
    category: 'technical',
    name: 'SSL 인증서 유효성',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message: 'SSL 인증서가 유효합니다. 만료 예정일: 2027년 3월',
    quickWinEligible: false,
  },
]

const mockContentRules: RuleResult[] = [
  {
    id: 'content-1',
    category: 'content',
    name: '페이지 제목 길이',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: '페이지 제목이 권장 길이(10-60자)를 충족합니다.',
    quickWinEligible: false,
  },
  {
    id: 'content-2',
    category: 'content',
    name: '메타 설명 길이',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: '메타 설명이 155자 이내입니다.',
    quickWinEligible: false,
  },
  {
    id: 'content-3',
    category: 'content',
    name: '이미지 ALT 텍스트',
    points: 3,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message: '30개 이미지 중 8개에 ALT 텍스트가 없습니다.',
    quickWinEligible: true,
  },
  {
    id: 'content-4',
    category: 'content',
    name: '콘텐츠 길이',
    points: 5,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'info',
    message: '페이지 콘텐츠가 300단어 미만입니다.',
    quickWinEligible: true,
  },
  {
    id: 'content-5',
    category: 'content',
    name: 'H2-H6 구조',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: '제목이 계층적으로 잘 구조화되어 있습니다.',
    quickWinEligible: false,
  },
]

const mockSocialAiRules: RuleResult[] = [
  {
    id: 'social-ai-1',
    category: 'social-ai',
    name: 'OG 태그 (Open Graph)',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: 'SNS 공유 메타데이터가 설정되어 있습니다.',
    quickWinEligible: false,
  },
  {
    id: 'social-ai-2',
    category: 'social-ai',
    name: 'robots.txt AI 봇 허용',
    points: 2,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'critical',
    message: 'GPTBot, ClaudeBot 등 AI 봇이 차단되어 있습니다.',
    quickWinEligible: true,
  },
  {
    id: 'social-ai-3',
    category: 'social-ai',
    name: 'llms.txt 존재 및 길이',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: true,
    severity: 'info',
    message: '데이터 없음 (부분 크롤링)',
    quickWinEligible: false,
  },
]

const mockPerformanceRules: RuleResult[] = [
  {
    id: 'perf-1',
    category: 'performance',
    name: 'PageSpeed Insights 점수',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: '모바일 PSI 점수: 72 (권장: 50 이상)',
    quickWinEligible: false,
  },
  {
    id: 'perf-2',
    category: 'performance',
    name: 'LCP (Largest Contentful Paint)',
    points: 6,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message: 'LCP: 2.8s (권장: 2.5s 이하)',
    quickWinEligible: true,
  },
  {
    id: 'perf-3',
    category: 'performance',
    name: 'CLS (Cumulative Layout Shift)',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: 'CLS: 0.08 (권장: 0.1 이하)',
    quickWinEligible: false,
  },
]

const mockSecurityRules: RuleResult[] = [
  {
    id: 'sec-1',
    category: 'security',
    name: 'HTTPS 암호화',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message: '모든 페이지가 HTTPS로 제공됩니다.',
    quickWinEligible: false,
  },
  {
    id: 'sec-2',
    category: 'security',
    name: 'Safe Browsing 상태',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message: '구글 Safe Browsing 검사 통과',
    quickWinEligible: false,
  },
]

const mockMobileRules: RuleResult[] = [
  {
    id: 'mobile-1',
    category: 'mobile',
    name: '모바일 뷰포트 설정',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message: '모바일 뷰포트 메타태그가 설정되어 있습니다.',
    quickWinEligible: false,
  },
  {
    id: 'mobile-2',
    category: 'mobile',
    name: '터치 타겟 크기',
    points: 5,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message: '일부 터치 타겟이 44x44px 미만입니다. (8개)',
    quickWinEligible: true,
  },
]

const mockGeoRules: RuleResult[] = [
  {
    id: 'geo-1',
    category: 'geo',
    name: 'Schema Markup (structured-data)',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: 'Organization, Product 2개 Schema 타입 감지',
    quickWinEligible: false,
  },
  {
    id: 'geo-2',
    category: 'geo',
    name: 'llms.txt AI 크롤러 가이드',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: true,
    severity: 'info',
    message: '데이터 없음 (부분 크롤링)',
    quickWinEligible: false,
  },
  {
    id: 'geo-3',
    category: 'geo',
    name: 'AI 인용 가능성',
    points: 6,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message: '4개 AI 플랫폼 중 3개에서 인용 가능성 확인',
    quickWinEligible: false,
  },
]

// ─── Category Scores ───

const mockCategoryScores: CategoryScore[] = [
  {
    id: 'technical',
    name: CATEGORY_CONFIG.technical.name,
    score: 62.5,
    weight: CATEGORY_CONFIG.technical.weight,
    rules: mockTechnicalRules,
    passedCount: 2,
    totalCount: 4,
    skippedCount: 1,
  },
  {
    id: 'content',
    name: CATEGORY_CONFIG.content.name,
    score: 72,
    weight: CATEGORY_CONFIG.content.weight,
    rules: mockContentRules,
    passedCount: 3,
    totalCount: 5,
    skippedCount: 0,
  },
  {
    id: 'social-ai',
    name: CATEGORY_CONFIG['social-ai'].name,
    score: 33.3,
    weight: CATEGORY_CONFIG['social-ai'].weight,
    rules: mockSocialAiRules,
    passedCount: 1,
    totalCount: 3,
    skippedCount: 1,
  },
  {
    id: 'performance',
    name: CATEGORY_CONFIG.performance.name,
    score: 80,
    weight: CATEGORY_CONFIG.performance.weight,
    rules: mockPerformanceRules,
    passedCount: 2,
    totalCount: 3,
    skippedCount: 0,
  },
  {
    id: 'security',
    name: CATEGORY_CONFIG.security.name,
    score: 100,
    weight: CATEGORY_CONFIG.security.weight,
    rules: mockSecurityRules,
    passedCount: 2,
    totalCount: 2,
    skippedCount: 0,
  },
  {
    id: 'mobile',
    name: CATEGORY_CONFIG.mobile.name,
    score: 75,
    weight: CATEGORY_CONFIG.mobile.weight,
    rules: mockMobileRules,
    passedCount: 1,
    totalCount: 2,
    skippedCount: 0,
  },
  {
    id: 'geo',
    name: CATEGORY_CONFIG.geo.name,
    score: 53.3,
    weight: CATEGORY_CONFIG.geo.weight,
    rules: mockGeoRules,
    passedCount: 2,
    totalCount: 3,
    skippedCount: 1,
  },
]

// ─── Quick Wins (sorted by severity priority) ───

const mockQuickWins: QuickWin[] = [
  {
    ruleId: 'social-ai-2',
    ruleName: 'robots.txt AI 봇 허용',
    category: 'social-ai',
    severity: 'critical',
    message:
      'GPTBot, ClaudeBot 등 AI 봇을 robots.txt에서 차단하고 있습니다. 이를 허용하면 ChatGPT, Claude 등에서 인용될 확률이 높아집니다.',
    impact: 12,
    source: 'rule',
  },
  {
    ruleId: 'tech-2',
    ruleName: 'robots.txt 존재',
    category: 'technical',
    severity: 'warning',
    message: 'robots.txt 파일을 생성하고 검색 엔진 크롤러를 안내하세요.',
    impact: 8,
    source: 'rule',
  },
  {
    ruleId: 'content-3',
    ruleName: '이미지 ALT 텍스트',
    category: 'content',
    severity: 'warning',
    message: '30개 이미지 중 8개에 설명적인 ALT 텍스트를 추가하세요.',
    impact: 7,
    source: 'rule',
  },
  {
    ruleId: 'perf-2',
    ruleName: 'LCP (Largest Contentful Paint)',
    category: 'performance',
    severity: 'warning',
    message:
      'LCP를 2.5초 이하로 개선하세요. 이미지 최적화와 스크립트 지연 로딩을 확인하세요.',
    impact: 6,
    source: 'rule',
  },
  {
    ruleId: 'mobile-2',
    ruleName: '터치 타겟 크기',
    category: 'mobile',
    severity: 'warning',
    message: '8개 터치 타겟을 44x44px 이상으로 확대하세요.',
    impact: 5,
    source: 'rule',
  },
  {
    ruleId: 'content-4',
    ruleName: '콘텐츠 길이',
    category: 'content',
    severity: 'info',
    message:
      '페이지 콘텐츠를 300단어 이상으로 확대하면 검색 순위가 개선될 수 있습니다.',
    impact: 3,
    source: 'rule',
  },
]

// ─── AI Citation Signals ───

const mockAICitationSignals: AICitationSignals = {
  botAccess: 35, // AI 봇이 차단되어 있어 낮음
  contentDiscoverability: 72, // 구조화된 데이터와 Schema가 있어 양호
  trustSignals: 88, // HTTPS, Safe Browsing, 오래된 도메인으로 높음
}

// ─── Platform Citation Scores ───

const mockPlatformCitationScores: PlatformCitationScore[] = [
  {
    platform: 'chatgpt',
    platformLabel: AI_PLATFORM_LABELS.chatgpt,
    score: 42,
    blocked: true,
    signals: {
      botAccess: 0, // robots.txt에서 GPTBot 차단
      contentDiscoverability: 72,
      trustSignals: 88,
    },
  },
  {
    platform: 'claude',
    platformLabel: AI_PLATFORM_LABELS.claude,
    score: 38,
    blocked: true,
    signals: {
      botAccess: 0, // robots.txt에서 ClaudeBot 차단
      contentDiscoverability: 72,
      trustSignals: 88,
    },
  },
  {
    platform: 'perplexity',
    platformLabel: AI_PLATFORM_LABELS.perplexity,
    score: 65,
    blocked: false,
    signals: {
      botAccess: 80, // PerplexityBot 차단 안 됨
      contentDiscoverability: 72,
      trustSignals: 88,
    },
  },
  {
    platform: 'google',
    platformLabel: AI_PLATFORM_LABELS.google,
    score: 75,
    blocked: false,
    signals: {
      botAccess: 95, // Googlebot 항상 허용
      contentDiscoverability: 72,
      trustSignals: 88,
    },
  },
]

// ─── AI Citation Possibility Score ───

const mockAICitationPossibilityScore: AICitationPossibilityScore = {
  overallScore: 55,
  passed: false, // 60점 미만 (PASS_SCORE = 60)
  platforms: mockPlatformCitationScores,
  recommendation:
    'robots.txt에서 AI 봇 차단을 해제하면 ChatGPT, Claude 등에서 인용될 확률을 크게 높일 수 있습니다. Perplexity와 Google AI에서는 이미 인용 가능하므로, 특히 ChatGPT와 Claude에 집중하세요.',
}

// ─── Overall Score (weighted calculation: 67 = "good" grade) ───

const mockOverallScore: OverallScore = {
  score: 67,
  grade: 'good',
  gradeLabel: '보통',
  categories: mockCategoryScores,
  quickWins: mockQuickWins,
  totalRules: mockCategoryScores.reduce((sum, cat) => sum + cat.totalCount, 0),
  passedRules: mockCategoryScores.reduce(
    (sum, cat) => sum + cat.passedCount,
    0
  ),
  failedRules: mockCategoryScores.reduce(
    (sum, cat) => sum + (cat.totalCount - cat.passedCount - cat.skippedCount),
    0
  ),
  skippedRules: mockCategoryScores.reduce(
    (sum, cat) => sum + cat.skippedCount,
    0
  ),
  evaluatedAt: new Date('2026-03-15T10:30:00Z').toISOString(),
}

// ─── Exports ───

export {
  mockOverallScore,
  mockCategoryScores,
  mockQuickWins,
  mockAICitationSignals,
  mockPlatformCitationScores,
  mockAICitationPossibilityScore,
}

/** Complete dashboard mock data aggregate */
export const mockDashboardData = {
  overallScore: mockOverallScore,
  aiCitationScore: mockAICitationPossibilityScore,
  loading: false,
  error: null,
}
