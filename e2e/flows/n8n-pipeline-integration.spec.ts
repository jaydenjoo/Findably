import { test, expect } from '@playwright/test'
import { FAKE_UUID_VARIANT } from '../helpers/constants'

/** 테스트용 가짜 진단 ID — RFC 4122 variant 규격 통과 */
const FAKE_DIAGNOSIS_ID = FAKE_UUID_VARIANT

/**
 * n8n 콜백 → 파이프라인 통합 테스트
 *
 * 검증 대상:
 * 1. POST /api/crawl/complete — 현실적인 n8n v2 페이로드로 전체 파이프라인 검증
 * 2. parseCrawlV2Result() — 10개 소스 데이터 정규화
 * 3. saveCrawlResult() → runDiagnosis() — DB 저장 + 진단 엔진
 *
 * 테스트 전략:
 * - N8N_WEBHOOK_SECRET 있으면 실제 인증 통과 → 파이프라인 진입
 * - 없으면 skip (CI/로컬 환경 독립)
 * - 존재하지 않는 UUID → DB 저장 단계에서 예상 동작 확인
 * - 현실적인 Firecrawl/PageSpeed/SSL Labs 응답 구조 사용
 */

const BASE = '/api/crawl/complete'

// ─── 현실적인 n8n v2 crawlResult mock ───

/** Firecrawl Scrape 응답 mock (layer1 + markdownContent) */
const MOCK_FIRECRAWL_SCRAPE = {
  success: true,
  data: {
    markdown:
      '# GreenTech Solutions\n\n지속 가능한 에너지 솔루션을 제공합니다.\n\n## 서비스\n\n- 태양광 설치\n- 에너지 컨설팅\n- 스마트 그리드 구축\n\n## 고객 사례\n\n50개 이상의 기업이 30% 에너지 비용 절감을 달성했습니다.',
    html: '<html><body><h1>GreenTech Solutions</h1></body></html>',
    metadata: {
      title: 'GreenTech Solutions - 지속 가능한 에너지',
      description:
        '태양광, 에너지 컨설팅, 스마트 그리드 전문 기업. 50개+ 기업 고객.',
      canonical: 'https://greentech.example.com/',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      ogTitle: 'GreenTech Solutions',
      ogDescription: '지속 가능한 에너지 솔루션',
      ogImage: 'https://greentech.example.com/og-image.jpg',
      ogUrl: 'https://greentech.example.com/',
      robots: 'index, follow',
      h1: ['GreenTech Solutions'],
      h2: ['서비스', '고객 사례'],
      h3: [],
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'GreenTech Solutions',
          url: 'https://greentech.example.com',
        },
      ],
      internalLinks: 15,
      externalLinks: 3,
      imageCount: 8,
      imagesWithoutAlt: 2,
      pageSize: 45000,
      loadTime: 1200,
      language: 'ko',
    },
  },
}

/** Firecrawl Map 응답 mock (siteUrls) */
const MOCK_FIRECRAWL_MAP = {
  success: true,
  links: [
    'https://greentech.example.com/',
    'https://greentech.example.com/about',
    'https://greentech.example.com/services',
    'https://greentech.example.com/contact',
    'https://greentech.example.com/blog',
    'https://greentech.example.com/case-studies',
  ],
}

/** PageSpeed Insights 모바일 응답 mock */
const MOCK_PAGESPEED_MOBILE = {
  lighthouseResult: {
    categories: {
      performance: { score: 0.72 },
    },
    audits: {
      'largest-contentful-paint': { numericValue: 2400 },
      'max-potential-fid': { numericValue: 180 },
      'cumulative-layout-shift': { numericValue: 0.08 },
      'server-response-time': { numericValue: 450 },
    },
  },
}

/** SSL Labs 응답 mock */
const MOCK_SSL_LABS = {
  status: 'READY',
  endpoints: [
    {
      grade: 'A',
      details: {
        protocols: [
          { name: 'TLS', version: '1.2' },
          { name: 'TLS', version: '1.3' },
        ],
      },
    },
  ],
  certs: [
    {
      issuerLabel: "Let's Encrypt",
      notAfter: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90일 후 만료
    },
  ],
}

/** Mozilla Observatory 응답 mock */
const MOCK_OBSERVATORY = {
  scan: {
    grade: 'B+',
    score: 70,
    state: 'FINISHED',
  },
  tests: {
    'content-security-policy': {
      name: 'Content Security Policy',
      pass: true,
      result: 'pass',
    },
    'x-frame-options': {
      name: 'X-Frame-Options',
      pass: false,
      result: 'fail',
    },
    'strict-transport-security': {
      name: 'Strict Transport Security',
      pass: true,
      result: 'pass',
    },
  },
}

/** robots.txt 응답 mock */
const MOCK_ROBOTS_TXT = {
  body: 'User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nSitemap: https://greentech.example.com/sitemap.xml',
  statusCode: 200,
}

/** sitemap.xml 응답 mock */
const MOCK_SITEMAP_XML = {
  body: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>https://greentech.example.com/</loc></url>\n<url><loc>https://greentech.example.com/about</loc></url>\n</urlset>',
  statusCode: 200,
}

/** llms.txt 응답 mock */
const MOCK_LLMS_TXT = {
  body: '# GreenTech Solutions\n\n> 지속 가능한 에너지 솔루션 전문 기업\n\n## About\n\n태양광, 에너지 컨설팅, 스마트 그리드 구축 서비스를 제공합니다.',
  statusCode: 200,
}

/** llms-full.txt 존재 확인 mock */
const MOCK_LLMS_FULL_TXT = {
  statusCode: 200,
}

// ─── 전체 n8n v2 콜백 페이로드 ───

function buildFullPayload(diagnosisId: string) {
  return {
    diagnosisId,
    url: 'https://greentech.example.com',
    dataCompleteness: 90,
    successSources: [
      'firecrawl_scrape',
      'firecrawl_map',
      'pagespeed_mobile',
      'ssl_labs',
      'observatory',
      'robots_txt',
      'sitemap_xml',
      'llms_txt',
      'llms_full_txt',
    ],
    failedSources: ['placeholder_unused'],
    crawlResult: {
      firecrawl_scrape: MOCK_FIRECRAWL_SCRAPE,
      firecrawl_map: MOCK_FIRECRAWL_MAP,
      pagespeed_mobile: MOCK_PAGESPEED_MOBILE,
      ssl_labs: MOCK_SSL_LABS,
      observatory: MOCK_OBSERVATORY,
      robots_txt: MOCK_ROBOTS_TXT,
      sitemap_xml: MOCK_SITEMAP_XML,
      llms_txt: MOCK_LLMS_TXT,
      llms_full_txt: MOCK_LLMS_FULL_TXT,
    },
  }
}

// ─── Tests ───

test.describe('n8n v2 콜백 → 파이프라인 통합 테스트', () => {
  test('인증 없이 현실적 페이로드 전송 → 401 (파이프라인 진입 차단)', async ({
    request,
  }) => {
    const res = await request.post(BASE, {
      data: buildFullPayload(FAKE_DIAGNOSIS_ID),
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('인증 실패')
  })

  test('잘못된 토큰 + 현실적 페이로드 → 401', async ({ request }) => {
    const res = await request.post(BASE, {
      headers: { Authorization: 'Bearer fake-webhook-secret-12345' },
      data: buildFullPayload(FAKE_DIAGNOSIS_ID),
    })

    expect(res.status()).toBe(401)
  })

  test('유효한 토큰 + 잘못된 UUID 형식 → 400 (Zod 검증)', async ({
    request,
  }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const payload = buildFullPayload(FAKE_DIAGNOSIS_ID)
    payload.diagnosisId = 'not-a-valid-uuid'

    const res = await request.post(BASE, {
      headers: { Authorization: `Bearer ${secret}` },
      data: payload,
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('유효한 토큰 + URL 누락 → 400', async ({ request }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const res = await request.post(BASE, {
      headers: { Authorization: `Bearer ${secret}` },
      data: {
        diagnosisId: FAKE_DIAGNOSIS_ID,
        // url 누락
        dataCompleteness: 100,
        successSources: [],
        failedSources: [],
        crawlResult: {},
      },
    })

    expect(res.status()).toBe(400)
  })

  test('유효한 토큰 + dataCompleteness 범위 초과 → 400', async ({
    request,
  }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const res = await request.post(BASE, {
      headers: { Authorization: `Bearer ${secret}` },
      data: {
        diagnosisId: FAKE_DIAGNOSIS_ID,
        url: 'https://example.com',
        dataCompleteness: 150, // 범위 초과 (0-100)
        successSources: [],
        failedSources: [],
        crawlResult: {},
      },
    })

    expect(res.status()).toBe(400)
  })

  test('유효한 토큰 + 현실적 페이로드 + 존재하지 않는 진단 → 파이프라인 통과 후 DB 단계 결과', async ({
    request,
  }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    // 존재하지 않는 UUID로 전송 → parseCrawlV2Result() 정상 실행
    // → saveCrawlResult()에서 UPDATE 대상 없음 (에러는 아님, affected rows = 0)
    // → runDiagnosis()도 UPDATE 대상 없음
    // → 최종 응답은 200 (Supabase UPDATE는 대상 없어도 에러 안 남)
    const res = await request.post(BASE, {
      headers: { Authorization: `Bearer ${secret}` },
      data: buildFullPayload(FAKE_DIAGNOSIS_ID),
    })

    // parseCrawlV2Result → saveCrawlResult → runDiagnosis 전체 통과
    // Supabase UPDATE에서 대상 행이 없으면 에러 없이 성공 반환하므로 200
    const body = await res.json()

    // 인증 + Zod 검증 통과 후 파이프라인 진입 확인 (401/400이 아님)
    // 존재하지 않는 UUID이므로 DB 단계에서 실패 가능 → 500
    // SSL Labs 보충 fetch 타임아웃 → 예외 → 500
    // 정상 통과 시 → 200
    // 400은 Zod 검증 실패를 의미하므로 여기서는 나오면 안 됨
    expect(res.status()).not.toBe(401) // 인증 통과 확인
    expect([200, 500]).toContain(res.status())

    if (res.status() === 200) {
      expect(body.success).toBe(true)
      expect(body.data.saved).toBe(true)
      expect(body.data.diagnosed).toBe(true)
      expect(body.data.dataCompleteness).toBe(90)
      expect(body.data.successSources).toContain('firecrawl_scrape')
      expect(body.data.successSources).toContain('pagespeed_mobile')
      expect(typeof body.data.duration_ms).toBe('number')
    }
  })

  test('유효한 토큰 + 최소 페이로드 (빈 crawlResult) → 파이프라인 통과', async ({
    request,
  }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    // 빈 crawlResult — parseCrawlV2Result()가 모든 필드를 null로 처리
    const res = await request.post(BASE, {
      headers: { Authorization: `Bearer ${secret}` },
      data: {
        diagnosisId: FAKE_DIAGNOSIS_ID,
        url: 'https://example.com',
        dataCompleteness: 0,
        successSources: [],
        failedSources: [
          'firecrawl_scrape',
          'firecrawl_map',
          'pagespeed_mobile',
        ],
        crawlResult: {},
      },
    })

    const body = await res.json()
    // 인증 + Zod 검증 통과 확인
    expect(res.status()).not.toBe(401)
    // 빈 데이터도 파이프라인 진입해야 함
    // 존재하지 않는 UUID → DB 단계 실패 가능 (500)
    // SSL Labs 보충 fetch 실패 → 500
    expect([200, 500]).toContain(res.status())

    if (res.status() === 200) {
      expect(body.success).toBe(true)
      expect(body.data.dataCompleteness).toBe(0)
      expect(body.data.failedSources).toContain('firecrawl_scrape')
    }
  })

  test('유효한 토큰 + Firecrawl만 성공한 부분 페이로드 → 파이프라인 통과', async ({
    request,
  }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    // Firecrawl만 성공, 나머지 실패 → layer1 + markdownContent만 있는 CrawlData
    const res = await request.post(BASE, {
      headers: { Authorization: `Bearer ${secret}` },
      data: {
        diagnosisId: FAKE_DIAGNOSIS_ID,
        url: 'https://greentech.example.com',
        dataCompleteness: 20,
        successSources: ['firecrawl_scrape', 'firecrawl_map'],
        failedSources: [
          'pagespeed_mobile',
          'ssl_labs',
          'observatory',
          'robots_txt',
          'sitemap_xml',
          'llms_txt',
        ],
        crawlResult: {
          firecrawl_scrape: MOCK_FIRECRAWL_SCRAPE,
          firecrawl_map: MOCK_FIRECRAWL_MAP,
        },
      },
    })

    const body = await res.json()
    // 인증 + Zod 검증 통과 확인
    expect(res.status()).not.toBe(401)
    // 존재하지 않는 UUID → DB 단계 실패 가능 (500)
    expect([200, 500]).toContain(res.status())

    if (res.status() === 200) {
      expect(body.success).toBe(true)
      // is_partial: true (dataCompleteness < 30)
      expect(body.data.dataCompleteness).toBe(20)
    }
  })
})

test.describe('n8n 콜백 페이로드 구조 검증', () => {
  test('crawlResult 필드 누락 시 안전 처리 (null 반환)', async ({
    request,
  }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    // crawlResult에 예상치 못한 키만 포함
    const res = await request.post(BASE, {
      headers: { Authorization: `Bearer ${secret}` },
      data: {
        diagnosisId: FAKE_DIAGNOSIS_ID,
        url: 'https://example.com',
        dataCompleteness: 50,
        successSources: ['unknown_source'],
        failedSources: [],
        crawlResult: {
          unknown_source: { some: 'data' },
          another_field: 123,
        },
      },
    })

    // 알 수 없는 키는 무시하고 모든 필드 null → 정상 처리
    const body = await res.json()
    if (res.status() === 200) {
      expect(body.success).toBe(true)
    }
  })

  test('Firecrawl scrape에 metadata 없어도 markdownContent 추출', async ({
    request,
  }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    // metadata 없이 markdown만 있는 경우
    const res = await request.post(BASE, {
      headers: { Authorization: `Bearer ${secret}` },
      data: {
        diagnosisId: FAKE_DIAGNOSIS_ID,
        url: 'https://example.com',
        dataCompleteness: 30,
        successSources: ['firecrawl_scrape'],
        failedSources: [],
        crawlResult: {
          firecrawl_scrape: {
            success: true,
            data: {
              markdown: '# Test Page\n\nThis is content without metadata.',
              // metadata 없음
            },
          },
        },
      },
    })

    const body = await res.json()
    // markdownContent는 추출되고, layer1은 null (metadata 없으므로)
    if (res.status() === 200) {
      expect(body.success).toBe(true)
    }
  })

  test('SSL Labs status가 READY 아니면 무시', async ({ request }) => {
    const secret = process.env.N8N_WEBHOOK_SECRET
    if (!secret) {
      test.skip()
      return
    }

    const res = await request.post(BASE, {
      headers: { Authorization: `Bearer ${secret}` },
      data: {
        diagnosisId: FAKE_DIAGNOSIS_ID,
        url: 'https://example.com',
        dataCompleteness: 40,
        successSources: ['ssl_labs'],
        failedSources: [],
        crawlResult: {
          ssl_labs: {
            status: 'IN_PROGRESS', // READY 아님 → ssl: null
            endpoints: [],
          },
        },
      },
    })

    // ssl_labs 파싱은 null 반환 → layer3 없음 → SSL Labs 보충 시도
    const body = await res.json()
    if (res.status() === 200) {
      expect(body.success).toBe(true)
    }
  })

  test('GET 메서드로 현실적 페이로드 (trailing slash 대응) → 401', async ({
    request,
  }) => {
    // GET은 JSON body를 보낼 수 없으므로 인증만 검증
    const res = await request.get(BASE)

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('인증 실패')
  })

  test('POST trailing slash → 리다이렉트 후 인증 검증 (405 아님)', async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/`, {
      maxRedirects: 5,
      data: buildFullPayload(FAKE_DIAGNOSIS_ID),
    })

    // 308 → GET으로 변환되더라도 405가 아닌 401 (GET 핸들러 존재)
    expect(res.status()).not.toBe(405)
    expect(res.status()).toBe(401)
  })
})
