/**
 * Seed data for local testing and development
 *
 * This file exports sample data matching the schema structure.
 * These can be inserted into a local Supabase instance for testing.
 *
 * Usage in development:
 * npx tsx src/db/seed.ts (when DB connection is established)
 *
 * Note: This is reference data, not automatically executed.
 * Database IDs are omitted as they are auto-generated on insert.
 */

// Sample company
export const sampleCompany = {
  userId: 'test-user-uuid-001',
  url: 'https://example-startup.com',
  industry: 'ecommerce' as const,
  companySize: 'small' as const,
};

// Sample crawl result
export const sampleCrawlResult = {
  companyId: 1,
  status: 'success' as const,
  metaTags: {
    title: '예시 스타트업 - 최고의 이커머스 솔루션',
    description: '예시 스타트업은 최고의 이커머스 솔루션을 제공합니다.',
    'og:title': '예시 스타트업',
    'og:description': '최고의 이커머스 솔루션',
    'og:image': 'https://example-startup.com/og.png',
    charset: 'utf-8',
    viewport: 'width=device-width, initial-scale=1',
  },
  headings: [
    { level: 1, text: '예시 스타트업에 오신 것을 환영합니다' },
    { level: 2, text: '우리의 서비스' },
    { level: 2, text: '고객 후기' },
    { level: 3, text: '자주 묻는 질문' },
  ],
  schemaMarkup: [
    {
      '@type': 'Organization',
      '@context': 'https://schema.org',
      name: '예시 스타트업',
      url: 'https://example-startup.com',
      logo: 'https://example-startup.com/logo.png',
    },
  ],
  performanceMetrics: {
    mobile: { score: 72, cwv: { lcp: 2.5, fid: 100, cls: 0.1 } },
    desktop: { score: 88, cwv: { lcp: 1.2, fid: 50, cls: 0.05 } },
  },
  robotsTxt: 'User-agent: *\nAllow: /',
  sitemapInfo: { urlCount: 15, lastModified: '2026-01-15' },
  detectedCms: 'cafe24',
  isLatest: true,
};

// Sample diagnosis
export const sampleDiagnosis = {
  companyId: 1,
  crawlResultId: 1,
  seoScore: '72.5',
  geoScore: '45.0',
  performanceScore: '80.0',
  aiScore: '65.0',
  overallScore: '64.4',
  grade: 'C' as const,
  aiInsights: {
    problems: [
      'Schema.org 마크업이 없어 AI 검색엔진에서 노출되기 어렵습니다.',
      '메타 설명이 120자 미만으로 너무 짧습니다.',
      'H1 태그가 검색 키워드를 포함하지 않고 있습니다.',
    ],
    recommendations: [
      'Organization 타입의 Schema.org JSON-LD를 추가하세요.',
      '메타 설명을 120-160자 범위로 최적화하세요.',
      'H1 태그에 주요 키워드를 포함시키세요.',
    ],
  },
  isLatest: true,
};

// Sample action items
export const sampleActionItems = [
  {
    companyId: 1,
    diagnosisId: 1,
    itemType: 'quick_win' as const,
    title: 'Schema.org Organization 마크업 추가',
    description:
      '웹사이트에 기본 Organization 타입의 JSON-LD 스키마를 추가하여 AI 검색엔진 노출을 개선합니다.',
    priority: 'high' as const,
    expectedImpactScore: '15.0',
    estimatedEffort: '<1h' as const,
    completed: false,
  },
  {
    companyId: 1,
    diagnosisId: 1,
    itemType: 'quick_win' as const,
    title: '메타 설명 최적화',
    description:
      '현재 메타 설명을 120-160자 범위로 수정하여 검색 결과 클릭률을 높입니다.',
    priority: 'high' as const,
    expectedImpactScore: '10.0',
    estimatedEffort: '<1h' as const,
    completed: false,
  },
  {
    companyId: 1,
    diagnosisId: 1,
    itemType: 'standard' as const,
    title: 'FAQ 페이지 Schema 추가',
    description:
      'FAQPage 타입의 구조화된 데이터를 추가하여 검색 결과에 FAQ 리치 스니펫을 표시합니다.',
    priority: 'medium' as const,
    expectedImpactScore: '8.0',
    estimatedEffort: '1-8h' as const,
    completed: false,
  },
];

// Sample generated asset (schema markup)
export const sampleGeneratedAsset = {
  companyId: 1,
  diagnosisId: 1,
  assetType: 'schema_markup' as const,
  content: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '예시 스타트업',
    url: 'https://example-startup.com',
    description: '최고의 이커머스 솔루션을 제공하는 스타트업',
    logo: 'https://example-startup.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      telephone: '+82-2-XXX-XXXX',
      email: 'support@example-startup.com',
    },
  },
};

/**
 * Helper function to validate seed data types
 * Can be used in tests or seed scripts
 */
export function validateSeedData() {
  const validations = {
    company: validateCompany(sampleCompany),
    crawlResult: validateCrawlResult(sampleCrawlResult),
    diagnosis: validateDiagnosis(sampleDiagnosis),
    actionItems: sampleActionItems.map(validateActionItem),
    generatedAsset: validateGeneratedAsset(sampleGeneratedAsset),
  };

  return validations;
}

function validateCompany(company: typeof sampleCompany) {
  return (
    typeof company.userId === 'string' &&
    company.userId.length > 0 &&
    /^https?:\/\/.+/.test(company.url) &&
    ['ecommerce', 'blog', 'saas', 'local_business', 'other'].includes(
      company.industry
    ) &&
    ['solo', 'small', 'medium'].includes(company.companySize)
  );
}

function validateCrawlResult(crawl: typeof sampleCrawlResult) {
  return (
    typeof crawl.companyId === 'number' &&
    ['success', 'failed_timeout', 'failed_network', 'failed_invalid_url'].includes(
      crawl.status
    ) &&
    typeof crawl.metaTags === 'object' &&
    Array.isArray(crawl.headings) &&
    crawl.headings.length > 0 &&
    typeof crawl.performanceMetrics === 'object' &&
    typeof crawl.isLatest === 'boolean'
  );
}

function validateDiagnosis(diagnosis: typeof sampleDiagnosis) {
  return (
    typeof diagnosis.companyId === 'number' &&
    ['A', 'B', 'C', 'D', 'F'].includes(diagnosis.grade) &&
    /^\d+(\.\d+)?$/.test(diagnosis.seoScore) &&
    /^\d+(\.\d+)?$/.test(diagnosis.overallScore) &&
    typeof diagnosis.aiInsights === 'object' &&
    Array.isArray(diagnosis.aiInsights.problems) &&
    Array.isArray(diagnosis.aiInsights.recommendations) &&
    typeof diagnosis.isLatest === 'boolean'
  );
}

function validateActionItem(item: (typeof sampleActionItems)[0]) {
  return (
    typeof item.companyId === 'number' &&
    typeof item.diagnosisId === 'number' &&
    ['quick_win', 'standard', 'long_term'].includes(item.itemType) &&
    typeof item.title === 'string' &&
    item.title.length > 0 &&
    typeof item.description === 'string' &&
    item.description.length > 0 &&
    ['high', 'medium', 'low'].includes(item.priority) &&
    ['<1h', '1-8h', '>8h'].includes(item.estimatedEffort) &&
    typeof item.completed === 'boolean'
  );
}

function validateGeneratedAsset(asset: typeof sampleGeneratedAsset) {
  return (
    typeof asset.companyId === 'number' &&
    typeof asset.diagnosisId === 'number' &&
    ['schema_markup', 'meta_tags', 'guide'].includes(asset.assetType) &&
    typeof asset.content === 'object' &&
    asset.content !== null
  );
}
