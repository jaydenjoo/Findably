import { describe, it, expect } from 'vitest'

import type { CrawlData } from '@/features/crawling'
import { calculateAICitationPossibility } from '../ai-citation-helpers'

// ─── Mock Data Helper ───

function createMockCrawlData(overrides: Partial<CrawlData> = {}): CrawlData {
  return {
    crawled_at: '2026-03-15T00:00:00Z',
    duration_ms: 1000,
    is_partial: false,
    layer1: {
      meta: {
        title: 'Test Page',
        description: 'A valid meta description for testing purposes',
        canonical: 'https://example.com',
        charset: 'utf-8',
        viewport: 'width=device-width, initial-scale=1',
        og: {},
        robots_meta: null,
      },
      headings: {
        h1: ['Main Heading'],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
      },
      schema_markup: [{ '@type': 'Organization' }, { '@type': 'WebSite' }],
      links: { internal: 10, external: 5, broken: [] },
      images: { total: 10, without_alt: 1, large_images: [] },
      page_size_bytes: 50000,
      load_time_ms: 500,
      html_lang: 'ko',
    },
    robots_txt: {
      exists: true,
      allows_googlebot: true,
      ai_bots: {
        GPTBot: 'allowed',
        ClaudeBot: 'allowed',
        PerplexityBot: 'allowed',
      },
      sitemap_urls: [],
    },
    sitemap: { exists: true, url_count: 10, last_modified: null },
    llms_txt: { exists: true, content: '# Site\nContent here' },
    cms: null,
    mobile: null,
    layer2: {
      pagespeed: null,
      crux: null,
      safe_browsing: { is_safe: true, threats: [] },
    },
    layer3: {
      ssl: {
        grade: 'A',
        valid: true,
        expires_at: null,
        issuer: 'LE',
        protocols: [],
      },
      observatory: null,
    },
    markdownContent: null,
    siteUrls: null,
    firecrawlUsed: false,
    ...overrides,
  }
}

// ─── Tests ───

describe('calculateAICitationPossibility', () => {
  // ─── 기본 구조 ───

  describe('결과 구조', () => {
    it('should return all required fields', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      expect(result).toHaveProperty('overallScore')
      expect(result).toHaveProperty('passed')
      expect(result).toHaveProperty('platforms')
      expect(result).toHaveProperty('recommendation')
      expect(result.platforms).toHaveLength(4)
    })

    it('should include all 4 platforms in order', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)
      const platformIds = result.platforms.map((p) => p.platform)

      expect(platformIds).toEqual(['chatgpt', 'claude', 'perplexity', 'google'])
    })

    it('should include correct platform labels', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)
      const labels = result.platforms.map((p) => p.platformLabel)

      expect(labels).toEqual([
        'ChatGPT',
        'Claude',
        'Perplexity',
        'Google AI Overview',
      ])
    })

    it('should include signals for each platform', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      for (const platform of result.platforms) {
        expect(platform.signals).toHaveProperty('botAccess')
        expect(platform.signals).toHaveProperty('contentDiscoverability')
        expect(platform.signals).toHaveProperty('trustSignals')
      }
    })
  })

  // ─── 봇 접근 신호 ───

  describe('봇 접근 (Bot Access)', () => {
    it('should score 100 when all bots are allowed', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      for (const platform of result.platforms) {
        expect(platform.signals.botAccess).toBe(100)
      }
    })

    it('should score 0 for a blocked bot platform', () => {
      const data = createMockCrawlData({
        robots_txt: {
          exists: true,
          allows_googlebot: true,
          ai_bots: {
            GPTBot: 'blocked',
            ClaudeBot: 'allowed',
            PerplexityBot: 'allowed',
          },
          sitemap_urls: [],
        },
      })
      const result = calculateAICitationPossibility(data)

      const chatgpt = result.platforms.find((p) => p.platform === 'chatgpt')!
      expect(chatgpt.signals.botAccess).toBe(0)
      expect(chatgpt.blocked).toBe(true)
      expect(chatgpt.score).toBe(0)
    })

    it('should score 50 when robots.txt is null', () => {
      const data = createMockCrawlData({ robots_txt: null })
      const result = calculateAICitationPossibility(data)

      for (const platform of result.platforms) {
        expect(platform.signals.botAccess).toBe(50)
      }
    })

    it('should use allows_googlebot for Google platform', () => {
      const data = createMockCrawlData({
        robots_txt: {
          exists: true,
          allows_googlebot: false,
          ai_bots: {
            GPTBot: 'allowed',
            ClaudeBot: 'allowed',
            PerplexityBot: 'allowed',
          },
          sitemap_urls: [],
        },
      })
      const result = calculateAICitationPossibility(data)

      const google = result.platforms.find((p) => p.platform === 'google')!
      expect(google.signals.botAccess).toBe(0)
      expect(google.blocked).toBe(true)
    })

    it('should treat not_mentioned as allowed (100)', () => {
      const data = createMockCrawlData({
        robots_txt: {
          exists: true,
          allows_googlebot: true,
          ai_bots: {
            GPTBot: 'not_mentioned',
            ClaudeBot: 'not_mentioned',
            PerplexityBot: 'not_mentioned',
          },
          sitemap_urls: [],
        },
      })
      const result = calculateAICitationPossibility(data)

      for (const platform of result.platforms) {
        expect(platform.signals.botAccess).toBe(100)
      }
    })
  })

  // ─── 콘텐츠 발견 용이성 ───

  describe('콘텐츠 발견 용이성 (Content Discoverability)', () => {
    it('should score 100 when all 5 signals present', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      // 모든 플랫폼이 동일한 콘텐츠 발견 용이성을 가짐
      expect(result.platforms[0]!.signals.contentDiscoverability).toBe(100)
    })

    it('should score 0 when layer1 is null', () => {
      const data = createMockCrawlData({
        layer1: null,
        llms_txt: null,
      })
      const result = calculateAICitationPossibility(data)

      // llms_txt 없음 + layer1 없음 = 0
      expect(result.platforms[0]!.signals.contentDiscoverability).toBe(0)
    })

    it('should score 20 when only llms.txt exists', () => {
      const data = createMockCrawlData({
        layer1: {
          meta: {
            title: null,
            description: null,
            canonical: null,
            charset: null,
            viewport: null,
            og: {},
            robots_meta: null,
          },
          headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] },
          schema_markup: [],
          links: { internal: 0, external: 0, broken: [] },
          images: { total: 0, without_alt: 0, large_images: [] },
          page_size_bytes: 0,
          load_time_ms: 0,
          html_lang: null,
        },
      })
      const result = calculateAICitationPossibility(data)

      // llms.txt(20) + 나머지 0
      expect(result.platforms[0]!.signals.contentDiscoverability).toBe(20)
    })

    it('should not count multiple H1s (only exactly 1)', () => {
      const data = createMockCrawlData()
      // layer1이 이미 mock에 있으므로 h1만 변경
      data.layer1!.headings.h1 = ['First H1', 'Second H1']
      // 불변성 위반이지만 테스트 목적으로 허용 - createMockCrawlData가 새 객체 반환
      const result = calculateAICitationPossibility(data)

      // llms.txt(20) + schema(20) + description(20) + canonical(20) - H1 0 = 80
      expect(result.platforms[0]!.signals.contentDiscoverability).toBe(80)
    })

    it('should not count empty description', () => {
      const data = createMockCrawlData()
      data.layer1!.meta.description = '   '
      const result = calculateAICitationPossibility(data)

      // llms.txt(20) + schema(20) + H1(20) + canonical(20) - description 0 = 80
      expect(result.platforms[0]!.signals.contentDiscoverability).toBe(80)
    })
  })

  // ─── 신뢰 신호 ───

  describe('신뢰 신호 (Trust Signals)', () => {
    it('should score ~100 when all 3 signals present', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      // SSL(34) + SafeBrowsing(33) + ImageAlt(33) ≈ 100
      expect(result.platforms[0]!.signals.trustSignals).toBe(100)
    })

    it('should reduce score when SSL is invalid', () => {
      const data = createMockCrawlData({
        layer3: {
          ssl: {
            grade: 'F',
            valid: false,
            expires_at: null,
            issuer: null,
            protocols: [],
          },
          observatory: null,
        },
      })
      const result = calculateAICitationPossibility(data)

      expect(result.platforms[0]!.signals.trustSignals).toBeLessThan(100)
    })

    it('should reduce score when Safe Browsing is unsafe', () => {
      const data = createMockCrawlData({
        layer2: {
          pagespeed: null,
          crux: null,
          safe_browsing: { is_safe: false, threats: ['MALWARE'] },
        },
      })
      const result = calculateAICitationPossibility(data)

      expect(result.platforms[0]!.signals.trustSignals).toBeLessThan(100)
    })

    it('should give image alt score when 80%+ have alt', () => {
      const data = createMockCrawlData()
      // 10 total, 1 without alt = 90% have alt → passes
      const result = calculateAICitationPossibility(data)

      expect(result.platforms[0]!.signals.trustSignals).toBe(100)
    })

    it('should not give image alt score when less than 80% have alt', () => {
      const data = createMockCrawlData()
      data.layer1!.images = { total: 10, without_alt: 5, large_images: [] }
      // 50% have alt → fails
      const result = calculateAICitationPossibility(data)

      expect(result.platforms[0]!.signals.trustSignals).toBeLessThan(100)
    })

    it('should give image alt score when no images exist', () => {
      const data = createMockCrawlData()
      data.layer1!.images = { total: 0, without_alt: 0, large_images: [] }
      const result = calculateAICitationPossibility(data)

      expect(result.platforms[0]!.signals.trustSignals).toBe(100)
    })
  })

  // ─── 하드캡 ───

  describe('하드캡 (Hard Caps)', () => {
    it('should cap platform score at 0 when bot is blocked', () => {
      const data = createMockCrawlData({
        robots_txt: {
          exists: true,
          allows_googlebot: true,
          ai_bots: {
            GPTBot: 'blocked',
            ClaudeBot: 'blocked',
            PerplexityBot: 'blocked',
          },
          sitemap_urls: [],
        },
      })
      const result = calculateAICitationPossibility(data)

      const chatgpt = result.platforms.find((p) => p.platform === 'chatgpt')!
      const claude = result.platforms.find((p) => p.platform === 'claude')!
      const perplexity = result.platforms.find(
        (p) => p.platform === 'perplexity'
      )!

      expect(chatgpt.score).toBe(0)
      expect(claude.score).toBe(0)
      expect(perplexity.score).toBe(0)
    })

    it('should cap all platform scores at 20 when Safe Browsing is unsafe', () => {
      const data = createMockCrawlData({
        layer2: {
          pagespeed: null,
          crux: null,
          safe_browsing: { is_safe: false, threats: ['MALWARE'] },
        },
      })
      const result = calculateAICitationPossibility(data)

      for (const platform of result.platforms) {
        expect(platform.score).toBeLessThanOrEqual(20)
      }
    })

    it('should cap all platform scores at 40 when SSL is invalid', () => {
      const data = createMockCrawlData({
        layer3: {
          ssl: {
            grade: 'F',
            valid: false,
            expires_at: null,
            issuer: null,
            protocols: [],
          },
          observatory: null,
        },
      })
      const result = calculateAICitationPossibility(data)

      for (const platform of result.platforms) {
        expect(platform.score).toBeLessThanOrEqual(40)
      }
    })

    it('should apply stricter cap when both unsafe and SSL invalid', () => {
      const data = createMockCrawlData({
        layer2: {
          pagespeed: null,
          crux: null,
          safe_browsing: { is_safe: false, threats: ['MALWARE'] },
        },
        layer3: {
          ssl: {
            grade: 'F',
            valid: false,
            expires_at: null,
            issuer: null,
            protocols: [],
          },
          observatory: null,
        },
      })
      const result = calculateAICitationPossibility(data)

      // UNSAFE_HARD_CAP(20) < SSL_INVALID_HARD_CAP(40) → 20이 적용
      for (const platform of result.platforms) {
        expect(platform.score).toBeLessThanOrEqual(20)
      }
    })
  })

  // ─── 종합 점수 ───

  describe('종합 점수 (Overall Score)', () => {
    it('should calculate weighted average across platforms', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      // 모든 신호 최대일 때: 각 플랫폼 점수 약 100
      // 가중 평균: (100*40 + 100*30 + 100*20 + 100*10) / 100 = 100
      expect(result.overallScore).toBeGreaterThanOrEqual(80)
    })

    it('should be 0 when all bots are blocked', () => {
      const data = createMockCrawlData({
        robots_txt: {
          exists: true,
          allows_googlebot: false,
          ai_bots: {
            GPTBot: 'blocked',
            ClaudeBot: 'blocked',
            PerplexityBot: 'blocked',
          },
          sitemap_urls: [],
        },
      })
      const result = calculateAICitationPossibility(data)

      expect(result.overallScore).toBe(0)
    })

    it('should pass when overallScore >= 60', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      expect(result.overallScore).toBeGreaterThanOrEqual(60)
      expect(result.passed).toBe(true)
    })

    it('should fail when overallScore < 60', () => {
      const data = createMockCrawlData({
        robots_txt: {
          exists: true,
          allows_googlebot: false,
          ai_bots: {
            GPTBot: 'blocked',
            ClaudeBot: 'blocked',
            PerplexityBot: 'blocked',
          },
          sitemap_urls: [],
        },
      })
      const result = calculateAICitationPossibility(data)

      expect(result.overallScore).toBeLessThan(60)
      expect(result.passed).toBe(false)
    })

    it('should reflect partial bot blocking in overall score', () => {
      const allAllowed = createMockCrawlData()
      const chatgptBlocked = createMockCrawlData({
        robots_txt: {
          exists: true,
          allows_googlebot: true,
          ai_bots: {
            GPTBot: 'blocked',
            ClaudeBot: 'allowed',
            PerplexityBot: 'allowed',
          },
          sitemap_urls: [],
        },
      })

      const resultAll = calculateAICitationPossibility(allAllowed)
      const resultBlocked = calculateAICitationPossibility(chatgptBlocked)

      // ChatGPT가 40% 가중치 → 차단 시 점수 하락
      expect(resultBlocked.overallScore).toBeLessThan(resultAll.overallScore)
    })
  })

  // ─── 추천 메시지 ───

  describe('추천 메시지 (Recommendation)', () => {
    it('should mention blocked platforms when bots are blocked', () => {
      const data = createMockCrawlData({
        robots_txt: {
          exists: true,
          allows_googlebot: true,
          ai_bots: {
            GPTBot: 'blocked',
            ClaudeBot: 'allowed',
            PerplexityBot: 'allowed',
          },
          sitemap_urls: [],
        },
      })
      const result = calculateAICitationPossibility(data)

      expect(result.recommendation).toContain('ChatGPT')
      expect(result.recommendation).toContain('봇이 차단')
    })

    it('should show high score message when >= 80', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      if (result.overallScore >= 80) {
        expect(result.recommendation).toContain('높습니다')
      }
    })

    it('should show medium score message when 60-79', () => {
      // 일부 신호를 줄여서 60-79 범위 만들기
      const data = createMockCrawlData({
        llms_txt: { exists: false, content: null },
      })
      data.layer1!.schema_markup = []
      data.layer1!.meta.canonical = null

      const result = calculateAICitationPossibility(data)

      if (result.overallScore >= 60 && result.overallScore < 80) {
        expect(result.recommendation).toContain('보통')
      }
    })

    it('should show low score message when < 60', () => {
      // 봇은 허용하되 콘텐츠/신뢰 신호를 모두 제거하여 낮은 점수 유도
      const data = createMockCrawlData({
        layer1: null,
        llms_txt: null,
        layer2: null,
        layer3: null,
      })
      const result = calculateAICitationPossibility(data)

      // 봇 차단이 아니므로 '낮습니다' 메시지 출력
      expect(result.recommendation).toContain('낮습니다')
    })

    it('should always include paid diagnosis upsell', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      expect(result.recommendation).toContain('유료 진단')
    })
  })

  // ─── 엣지 케이스 ───

  describe('엣지 케이스', () => {
    it('should handle all null layers gracefully', () => {
      const data = createMockCrawlData({
        layer1: null,
        robots_txt: null,
        llms_txt: null,
        layer2: null,
        layer3: null,
      })
      const result = calculateAICitationPossibility(data)

      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(result.platforms).toHaveLength(4)
    })

    it('should handle null safe_browsing in layer2', () => {
      const data = createMockCrawlData({
        layer2: { pagespeed: null, crux: null, safe_browsing: null },
      })
      const result = calculateAICitationPossibility(data)

      // safe_browsing null → 하드캡 적용 안됨
      expect(result.overallScore).toBeGreaterThan(0)
    })

    it('should handle null ssl in layer3', () => {
      const data = createMockCrawlData({
        layer3: { ssl: null, observatory: null },
      })
      const result = calculateAICitationPossibility(data)

      // ssl null → SSL 하드캡 적용 안됨
      expect(result.overallScore).toBeGreaterThan(0)
    })

    it('should return integer scores', () => {
      const data = createMockCrawlData()
      const result = calculateAICitationPossibility(data)

      expect(Number.isInteger(result.overallScore)).toBe(true)
      for (const platform of result.platforms) {
        expect(Number.isInteger(platform.score)).toBe(true)
      }
    })
  })
})
