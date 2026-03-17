import type {
  OverallScore,
  CategoryScore,
  RuleResult,
  QuickWin,
  AICitationPossibilityScore,
  PlatformCitationScore,
  AIPlatform,
  CategoryId,
} from '@/features/diagnosis-free/types'
import {
  CATEGORY_CONFIG,
  AI_PLATFORM_LABELS,
} from '@/features/diagnosis-free/constants'

/**
 * Green Tech Solutions Sample Diagnosis Data
 *
 * 회사: 그린테크 (Green Energy Tech Startup)
 * 시나리오: 중상급 B2B SaaS 웹사이트 — 좋은 성능이지만 일반적 문제 다수 보유
 *
 * 특징:
 * - 종합점수 72점 (좋음, "good" 등급)
 * - 카테고리별 현실적 분포: 기술/성능 우수, 콘텐츠/AI 접근성 약함
 * - 50개+ 룰: 통과/실패/스킵 혼합
 * - 5개 Quick Win: 심각도/영향도 다양
 * - AI 인용 가능성: 58점 (미통과, 개선 여지 큼)
 */

// ─── Technical (78점, 7개 룰) ───
const greenTechTechnicalRules: RuleResult[] = [
  {
    id: 'tech-001-title-tag',
    category: 'technical',
    name: '타이틀 태그 존재 및 길이',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message: '타이틀 태그가 올바르게 설정되어 있습니다. (45자, 권장 10-60자)',
    quickWinEligible: false,
  },
  {
    id: 'tech-002-canonical',
    category: 'technical',
    name: '정규화(Canonical) URL 설정',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message:
      'Canonical URL이 설정되지 않았습니다. URL 파라미터로 인한 중복 콘텐츠 문제가 발생할 수 있습니다.',
    quickWinEligible: true,
  },
  {
    id: 'tech-003-robots-txt',
    category: 'technical',
    name: 'robots.txt 파일 존재',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: 'robots.txt 파일이 존재하고 올바르게 설정되어 있습니다.',
    quickWinEligible: false,
  },
  {
    id: 'tech-004-sitemap',
    category: 'technical',
    name: 'sitemap.xml 존재 및 최신 상태',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message:
      'sitemap.xml이 존재하고 7일 이내에 업데이트되었습니다. (마지막 수정: 2026-03-12)',
    quickWinEligible: false,
  },
  {
    id: 'tech-005-ssl',
    category: 'technical',
    name: 'SSL/TLS 인증서 유효성',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message:
      'SSL 인증서가 유효합니다. 만료 예정일: 2027년 4월 15일 (410일 남음)',
    quickWinEligible: false,
  },
  {
    id: 'tech-006-schema-markup',
    category: 'technical',
    name: '구조화된 데이터(Schema Markup) 존재',
    points: 5,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'info',
    message:
      'Schema Markup이 설정되지 않았습니다. Organization 또는 Product Schema를 추가하면 검색 엔진이 콘텐츠를 더 잘 이해합니다.',
    quickWinEligible: true,
  },
  {
    id: 'tech-007-mobile-friendly',
    category: 'technical',
    name: '모바일 기본(Mobile-first) 설계',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: '모바일 뷰포트 설정이 올바르게 구성되어 있습니다.',
    quickWinEligible: false,
  },
]

// ─── Content (65점, 8개 룰) ───
const greenTechContentRules: RuleResult[] = [
  {
    id: 'content-001-title-length',
    category: 'content',
    name: 'H1 태그 존재 및 길이',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message: 'H1 태그가 정확히 1개 존재하고 권장 길이를 충족합니다. (32자)',
    quickWinEligible: false,
  },
  {
    id: 'content-002-meta-description',
    category: 'content',
    name: '메타 설명(Meta Description) 길이',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: '메타 설명이 155자 이내입니다. (148자, 권장 70-155자)',
    quickWinEligible: false,
  },
  {
    id: 'content-003-image-alt-text',
    category: 'content',
    name: '이미지 ALT 텍스트 완성도',
    points: 4,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message:
      '25개 이미지 중 17개(68%)에 ALT 텍스트가 있습니다. 나머지 8개는 장식용으로 표시하거나 설명을 추가하세요.',
    quickWinEligible: true,
  },
  {
    id: 'content-004-content-length',
    category: 'content',
    name: '페이지 콘텐츠 길이 및 깊이',
    points: 6,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'info',
    message:
      '홈페이지 본문이 850단어입니다. 타겟 키워드에 대해 더 깊이 있는 콘텐츠(2,000+ 단어)를 추가하면 검색 순위 개선에 도움이 됩니다.',
    quickWinEligible: true,
  },
  {
    id: 'content-005-heading-hierarchy',
    category: 'content',
    name: 'H2-H6 제목 계층 구조',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message:
      '제목이 계층적으로 올바르게 구조화되어 있습니다. (H1 1개, H2 5개, H3 8개)',
    quickWinEligible: false,
  },
  {
    id: 'content-006-content-update-frequency',
    category: 'content',
    name: '콘텐츠 업데이트 빈도',
    points: 3,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message:
      '마지막 콘텐츠 업데이트가 62일 전입니다. 정기적 업데이트(월 1회 이상)는 SEO와 사용자 신뢰도를 향상시킵니다.',
    quickWinEligible: false,
  },
  {
    id: 'content-007-faq-schema',
    category: 'content',
    name: 'FAQ 구조화 데이터',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'info',
    message:
      'FAQ 섹션이 구조화되지 않았습니다. 자주 묻는 질문을 FAQ Schema로 마크업하면 리치 스니펫으로 표시될 수 있습니다.',
    quickWinEligible: false,
  },
  {
    id: 'content-008-internal-linking',
    category: 'content',
    name: '내부 링크 최적화',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: '페이지당 평균 8개의 관련 내부 링크가 있습니다. 좋은 수준입니다.',
    quickWinEligible: false,
  },
]

// ─── Social & AI Accessibility (58점, 6개 룰) ───
const greenTechSocialAiRules: RuleResult[] = [
  {
    id: 'social-ai-001-og-tags',
    category: 'social-ai',
    name: 'Open Graph (OG) 태그 설정',
    points: 3,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message:
      'OG 태그(og:title, og:description, og:image)가 설정되지 않았습니다. SNS 공유 시 미리보기가 최적화되지 않습니다.',
    quickWinEligible: true,
  },
  {
    id: 'social-ai-002-twitter-card',
    category: 'social-ai',
    name: 'Twitter Card 설정',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'info',
    message: 'Twitter Card가 설정되지 않았습니다.',
    quickWinEligible: false,
  },
  {
    id: 'social-ai-003-ai-bot-access',
    category: 'social-ai',
    name: 'AI 봇 접근 허용 (robots.txt)',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'critical',
    message:
      'robots.txt에서 GPTBot, ClaudeBot, PerplexityBot이 차단되어 있습니다. AI 검색 엔진에 노출되려면 이 봇들을 허용하세요.',
    quickWinEligible: true,
  },
  {
    id: 'social-ai-004-llms-txt',
    category: 'social-ai',
    name: 'llms.txt 파일 존재',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message:
      'llms.txt 파일이 없습니다. AI 크롤러를 위한 사이트 요약과 수집 정책을 명시하면 도움이 됩니다.',
    quickWinEligible: true,
  },
  {
    id: 'social-ai-005-structured-data-for-ai',
    category: 'social-ai',
    name: 'AI 인용용 구조화 데이터',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'info',
    message:
      'Organization, Product, Article 등 Schema Markup이 없습니다. AI가 정확한 맥락을 이해하도록 구조화 데이터를 추가하세요.',
    quickWinEligible: false,
  },
  {
    id: 'social-ai-006-bread-crumbs',
    category: 'social-ai',
    name: 'Breadcrumb Schema',
    points: 9,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: 'Breadcrumb Schema가 올바르게 구현되어 있습니다.',
    quickWinEligible: false,
  },
]

// ─── Performance (82점, 6개 룰) ───
const greenTechPerformanceRules: RuleResult[] = [
  {
    id: 'perf-001-psi-score',
    category: 'performance',
    name: 'PageSpeed Insights (PSI) 점수',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: '모바일 PSI 점수: 74 (권장: 50 이상) | 데스크톱: 92',
    quickWinEligible: false,
  },
  {
    id: 'perf-002-lcp',
    category: 'performance',
    name: 'LCP (Largest Contentful Paint)',
    points: 9,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: 'LCP: 2.1초 (권장: 2.5초 이하) - 우수',
    quickWinEligible: false,
  },
  {
    id: 'perf-003-fid',
    category: 'performance',
    name: 'FID (First Input Delay)',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: 'FID: 58ms (권장: 100ms 이하)',
    quickWinEligible: false,
  },
  {
    id: 'perf-004-cls',
    category: 'performance',
    name: 'CLS (Cumulative Layout Shift)',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: 'CLS: 0.08 (권장: 0.1 이하) - 우수',
    quickWinEligible: false,
  },
  {
    id: 'perf-005-page-load-time',
    category: 'performance',
    name: '페이지 로드 시간(TTFB)',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: 'TTFB: 640ms (권장: 800ms 이하)',
    quickWinEligible: false,
  },
  {
    id: 'perf-006-image-optimization',
    category: 'performance',
    name: '이미지 최적화',
    points: 9,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message:
      '대부분의 이미지가 WebP 포맷으로 최적화되어 있습니다. (92% 커버율)',
    quickWinEligible: false,
  },
]

// ─── Security (90점, 5개 룰) ───
const greenTechSecurityRules: RuleResult[] = [
  {
    id: 'sec-001-https',
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
    id: 'sec-002-safe-browsing',
    category: 'security',
    name: '구글 Safe Browsing 검사',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message:
      '구글 Safe Browsing 검사를 통과했습니다. 악성 소프트웨어 및 피싱 위협 없음.',
    quickWinEligible: false,
  },
  {
    id: 'sec-003-headers-security',
    category: 'security',
    name: '보안 헤더 설정',
    points: 9,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message:
      'X-Frame-Options, X-Content-Type-Options, CSP 등 보안 헤더가 올바르게 설정되어 있습니다.',
    quickWinEligible: false,
  },
  {
    id: 'sec-004-mixed-content',
    category: 'security',
    name: '혼합 콘텐츠 확인',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: '혼합 콘텐츠(HTTP 리소스)가 없습니다.',
    quickWinEligible: false,
  },
  {
    id: 'sec-005-ssl-certificate-strength',
    category: 'security',
    name: 'SSL 인증서 강도',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: 'SSL 인증서: TLS 1.2, 2048-bit RSA - 우수',
    quickWinEligible: false,
  },
]

// ─── Mobile (75점, 5개 룰) ───
const greenTechMobileRules: RuleResult[] = [
  {
    id: 'mobile-001-viewport',
    category: 'mobile',
    name: '모바일 뷰포트 설정',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'critical',
    message: '모바일 뷰포트 메타 태그가 올바르게 설정되어 있습니다.',
    quickWinEligible: false,
  },
  {
    id: 'mobile-002-touch-targets',
    category: 'mobile',
    name: '터치 타겟 크기',
    points: 6,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message:
      '5개의 버튼/링크 터치 타겟이 44x44px 미만입니다. 모바일 사용성을 위해 크기를 조정하세요.',
    quickWinEligible: true,
  },
  {
    id: 'mobile-003-mobile-speed',
    category: 'mobile',
    name: '모바일 페이지 속도',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message: '모바일 로드 시간: 2.8초 (권장: 3초 이하)',
    quickWinEligible: false,
  },
  {
    id: 'mobile-004-responsive-images',
    category: 'mobile',
    name: '반응형 이미지',
    points: 8,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: 'srcset을 사용한 반응형 이미지가 88% 구현되어 있습니다.',
    quickWinEligible: false,
  },
  {
    id: 'mobile-005-font-sizes',
    category: 'mobile',
    name: '모바일 글꼴 크기',
    points: 9,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: '모바일 환경에서 글꼴 크기가 충분합니다. (최소 12px)',
    quickWinEligible: false,
  },
]

// ─── GEO (55점, 7개 룰) ───
const greenTechGeoRules: RuleResult[] = [
  {
    id: 'geo-001-llms-txt',
    category: 'geo',
    name: 'llms.txt 파일 존재 및 완성도',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'critical',
    message:
      'llms.txt 파일이 없습니다. AI 크롤러에게 사이트 정보와 사용 정책을 제공하세요.',
    quickWinEligible: true,
  },
  {
    id: 'geo-002-organization-schema',
    category: 'geo',
    name: 'Organization Schema Markup',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'warning',
    message:
      'Organization Schema가 설정되지 않았습니다. 회사명, 로고, 연락처 정보를 구조화하세요.',
    quickWinEligible: true,
  },
  {
    id: 'geo-003-product-schema',
    category: 'geo',
    name: 'Product/Service Schema',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'info',
    message: '제품/서비스 정보가 구조화되지 않았습니다.',
    quickWinEligible: false,
  },
  {
    id: 'geo-004-article-schema',
    category: 'geo',
    name: 'Article Schema (블로그/뉴스)',
    points: 0,
    maxPoints: 10,
    passed: false,
    skipped: false,
    severity: 'info',
    message: '블로그 포스트가 Article Schema로 마크업되지 않았습니다.',
    quickWinEligible: false,
  },
  {
    id: 'geo-005-expertise-signals',
    category: 'geo',
    name: '전문성 신호(E-E-A-T) 구성',
    points: 10,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message:
      '팀 소개 페이지, 인증서, 사례 연구가 포함되어 있습니다. 강력한 신뢰 신호입니다.',
    quickWinEligible: false,
  },
  {
    id: 'geo-006-external-citations',
    category: 'geo',
    name: '외부 인용 및 백링크',
    points: 9,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'warning',
    message:
      '관련 업계 매체에서 18개의 백링크를 발견했습니다. 좋은 신호입니다.',
    quickWinEligible: false,
  },
  {
    id: 'geo-007-content-freshness',
    category: 'geo',
    name: '콘텐츠 신선도 및 정확성',
    points: 9,
    maxPoints: 10,
    passed: true,
    skipped: false,
    severity: 'info',
    message: '기술 콘텐츠가 최근 업데이트되었고, 통계와 정보가 정확합니다.',
    quickWinEligible: false,
  },
]

// ─── Build Category Scores ───
const createCategoryScore = (
  id: CategoryId,
  rules: RuleResult[]
): CategoryScore => {
  const passedCount = rules.filter((r) => r.passed && !r.skipped).length
  const totalCount = rules.length
  const skippedCount = rules.filter((r) => r.skipped).length
  const totalPoints = rules.reduce((sum, r) => sum + r.points, 0)
  const maxPoints = rules.reduce((sum, r) => sum + r.maxPoints, 0)
  const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0

  return {
    id,
    name: CATEGORY_CONFIG[id].name,
    score,
    weight: CATEGORY_CONFIG[id].weight,
    rules,
    passedCount,
    totalCount,
    skippedCount,
  }
}

const technicalCategory = createCategoryScore(
  'technical',
  greenTechTechnicalRules
)
const contentCategory = createCategoryScore('content', greenTechContentRules)
const socialAiCategory = createCategoryScore(
  'social-ai',
  greenTechSocialAiRules
)
const performanceCategory = createCategoryScore(
  'performance',
  greenTechPerformanceRules
)
const securityCategory = createCategoryScore('security', greenTechSecurityRules)
const mobileCategory = createCategoryScore('mobile', greenTechMobileRules)
const geoCategory = createCategoryScore('geo', greenTechGeoRules)

const allCategories = [
  technicalCategory,
  contentCategory,
  socialAiCategory,
  performanceCategory,
  securityCategory,
  mobileCategory,
  geoCategory,
]

// ─── Calculate Overall Score ───
const calculateOverallScore = (categories: CategoryScore[]): number => {
  const weightedSum = categories.reduce((sum, cat) => {
    return sum + (cat.score * cat.weight) / 100
  }, 0)
  return Math.round(weightedSum)
}

const overallScore = calculateOverallScore(allCategories)

// ─── Quick Wins (5개, 심각도/영향도 다양) ───
const quickWins: QuickWin[] = [
  {
    ruleId: 'social-ai-003-ai-bot-access',
    ruleName: 'AI 봇 접근 허용',
    category: 'social-ai',
    severity: 'critical',
    message:
      'robots.txt에서 GPTBot, ClaudeBot, PerplexityBot을 허용하면 AI 검색 엔진에 노출될 수 있습니다.',
    impact: 25,
    source: 'rule',
  },
  {
    ruleId: 'tech-002-canonical',
    ruleName: '정규화 URL 설정',
    category: 'technical',
    severity: 'warning',
    message:
      'Canonical URL을 추가하면 중복 콘텐츠 문제를 해결하고 SEO가 개선됩니다.',
    impact: 20,
    source: 'rule',
  },
  {
    ruleId: 'content-004-content-length',
    ruleName: '콘텐츠 길이 확대',
    category: 'content',
    severity: 'info',
    message:
      '페이지 콘텐츠를 2,000자 이상으로 확대하면 검색 순위 개선에 도움이 됩니다.',
    impact: 18,
    source: 'rule',
  },
  {
    ruleId: 'social-ai-001-og-tags',
    ruleName: 'Open Graph 태그 추가',
    category: 'social-ai',
    severity: 'warning',
    message: 'SNS 공유 시 미리보기를 개선하려면 OG 태그를 추가하세요.',
    impact: 12,
    source: 'rule',
  },
  {
    ruleId: 'mobile-002-touch-targets',
    ruleName: '터치 타겟 크기 조정',
    category: 'mobile',
    severity: 'warning',
    message: '모바일 사용성을 위해 버튼/링크 크기를 44x44px 이상으로 만드세요.',
    impact: 10,
    source: 'rule',
  },
]

// ─── AI Citation Possibility ───
interface PlatformCitationInput {
  platform: AIPlatform
  score: number
  blocked: boolean
  botAccess: number
  contentDiscoverability: number
  trustSignals: number
}

const createPlatformCitationScore = ({
  platform,
  score,
  blocked,
  botAccess,
  contentDiscoverability,
  trustSignals,
}: PlatformCitationInput): PlatformCitationScore => ({
  platform,
  platformLabel: AI_PLATFORM_LABELS[platform],
  score,
  blocked,
  signals: {
    botAccess,
    contentDiscoverability,
    trustSignals,
  },
})

const platformCitationScores: PlatformCitationScore[] = [
  createPlatformCitationScore({
    platform: 'chatgpt',
    score: 62,
    blocked: false,
    botAccess: 20,
    contentDiscoverability: 65,
    trustSignals: 75,
  }),
  createPlatformCitationScore({
    platform: 'claude',
    score: 45,
    blocked: false,
    botAccess: 30,
    contentDiscoverability: 50,
    trustSignals: 55,
  }),
  createPlatformCitationScore({
    platform: 'perplexity',
    score: 71,
    blocked: false,
    botAccess: 25,
    contentDiscoverability: 75,
    trustSignals: 85,
  }),
  createPlatformCitationScore({
    platform: 'google',
    score: 55,
    blocked: false,
    botAccess: 35,
    contentDiscoverability: 60,
    trustSignals: 70,
  }),
]

/** 플랫폼별 종합 점수 가중치 */
const PLATFORM_WEIGHTS: Record<AIPlatform, number> = {
  chatgpt: 0.4,
  claude: 0.3,
  perplexity: 0.2,
  google: 0.1,
} as const

const aiCitationOverallScore = Math.round(
  platformCitationScores.reduce(
    (sum, p) => sum + p.score * PLATFORM_WEIGHTS[p.platform],
    0
  )
)

// ─── Export ───

export const SAMPLE_OVERALL_SCORE = {
  score: overallScore,
  grade: 'good' as const,
  gradeLabel: '좋음',
  categories: allCategories,
  quickWins,
  totalRules: allCategories.reduce((sum, cat) => sum + cat.totalCount, 0),
  passedRules: allCategories.reduce((sum, cat) => sum + cat.passedCount, 0),
  failedRules: allCategories.reduce(
    (sum, cat) => sum + (cat.totalCount - cat.passedCount - cat.skippedCount),
    0
  ),
  skippedRules: allCategories.reduce((sum, cat) => sum + cat.skippedCount, 0),
  evaluatedAt: '2026-03-10T09:30:00Z',
} satisfies OverallScore

export const SAMPLE_AI_CITATION = {
  overallScore: aiCitationOverallScore,
  passed: aiCitationOverallScore >= 60,
  platforms: platformCitationScores,
  recommendation:
    'AI 검색 엔진에서의 인용 가능성을 높이기 위해 다음 조치를 권장합니다:\n\n1. **robots.txt 업데이트**: GPTBot, ClaudeBot, PerplexityBot을 허용하세요.\n\n2. **llms.txt 파일 추가**: 사이트 요약과 AI 활용 정책을 명시하면 크롤러가 콘텐츠를 더 잘 이해합니다.\n\n3. **Schema Markup 추가**: Organization, Product, Article Schema를 구현하면 AI가 정확한 맥락을 파악합니다.\n\n4. **콘텐츠 깊이 확대**: 핵심 키워드별 가이드성 콘텐츠(2,000+ 단어)를 추가하세요.\n\n5. **신뢰 신호 강화**: 사용 사례, 고객 후기, 전문가 인증 등을 추가하여 E-E-A-T를 높이세요.',
} satisfies AICitationPossibilityScore
