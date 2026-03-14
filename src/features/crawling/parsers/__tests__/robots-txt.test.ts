import { describe, it, expect } from 'vitest'
import { parseRobotsTxt } from '../robots-txt'
import { AI_BOT_LIST } from '../../constants'

describe('parseRobotsTxt', () => {
  // ─── 기본 동작 ───

  describe('기본 동작', () => {
    it('파일 미존재 시 exists: false, 모두 not_mentioned', () => {
      const result = parseRobotsTxt(null)

      expect(result.exists).toBe(false)
      expect(result.allows_googlebot).toBe(true)
      expect(result.sitemap_urls).toEqual([])
      expect(result.raw).toBeUndefined()
      for (const bot of AI_BOT_LIST) {
        expect(result.ai_bots[bot]).toBe('not_mentioned')
      }
    })

    it('빈 파일 시 exists: true, 모두 not_mentioned', () => {
      const result = parseRobotsTxt('')

      expect(result.exists).toBe(true)
      expect(result.allows_googlebot).toBe(true)
      for (const bot of AI_BOT_LIST) {
        expect(result.ai_bots[bot]).toBe('not_mentioned')
      }
    })

    it('모든 봇 허용 (Allow: /)', () => {
      const raw = 'User-agent: *\nAllow: /'
      const result = parseRobotsTxt(raw)

      expect(result.exists).toBe(true)
      expect(result.allows_googlebot).toBe(true)
      for (const bot of AI_BOT_LIST) {
        expect(result.ai_bots[bot]).toBe('allowed')
      }
    })

    it('모든 봇 차단 (Disallow: /)', () => {
      const raw = 'User-agent: *\nDisallow: /'
      const result = parseRobotsTxt(raw)

      expect(result.exists).toBe(true)
      expect(result.allows_googlebot).toBe(false)
      for (const bot of AI_BOT_LIST) {
        expect(result.ai_bots[bot]).toBe('blocked')
      }
    })

    it('빈 Disallow는 모두 허용 (RFC 9309)', () => {
      const raw = 'User-agent: *\nDisallow:'
      const result = parseRobotsTxt(raw)

      expect(result.allows_googlebot).toBe(true)
      for (const bot of AI_BOT_LIST) {
        expect(result.ai_bots[bot]).toBe('allowed')
      }
    })
  })

  // ─── AI 봇 특화 ───

  describe('AI 봇 특화', () => {
    it('GPTBot만 차단', () => {
      const raw = 'User-agent: GPTBot\nDisallow: /'
      const result = parseRobotsTxt(raw)

      expect(result.ai_bots['GPTBot']).toBe('blocked')
      expect(result.ai_bots['ClaudeBot']).toBe('not_mentioned')
      expect(result.ai_bots['PerplexityBot']).toBe('not_mentioned')
      expect(result.allows_googlebot).toBe(true)
    })

    it('복수 봇 차단 (GPTBot + ClaudeBot)', () => {
      const raw = [
        'User-agent: GPTBot',
        'Disallow: /',
        '',
        'User-agent: ClaudeBot',
        'Disallow: /',
      ].join('\n')
      const result = parseRobotsTxt(raw)

      expect(result.ai_bots['GPTBot']).toBe('blocked')
      expect(result.ai_bots['ClaudeBot']).toBe('blocked')
      expect(result.ai_bots['PerplexityBot']).toBe('not_mentioned')
    })

    it('* 차단 + 특정 봇 허용 → 봇 전용 섹션 우선', () => {
      const raw = [
        'User-agent: *',
        'Disallow: /',
        '',
        'User-agent: ClaudeBot',
        'Allow: /',
      ].join('\n')
      const result = parseRobotsTxt(raw)

      expect(result.ai_bots['ClaudeBot']).toBe('allowed')
      expect(result.ai_bots['GPTBot']).toBe('blocked')
      expect(result.allows_googlebot).toBe(false)
    })

    it('대소문자 혼용 User-agent 매칭 (RFC 9309)', () => {
      const raw = 'user-agent: gptbot\nDisallow: /'
      const result = parseRobotsTxt(raw)

      expect(result.ai_bots['GPTBot']).toBe('blocked')
    })

    it('Googlebot 차단 시 allows_googlebot: false', () => {
      const raw = 'User-agent: Googlebot\nDisallow: /'
      const result = parseRobotsTxt(raw)

      expect(result.allows_googlebot).toBe(false)
    })

    it('Googlebot 허용 + AI 봇 차단', () => {
      const raw = [
        'User-agent: Googlebot',
        'Allow: /',
        '',
        'User-agent: GPTBot',
        'Disallow: /',
        '',
        'User-agent: ClaudeBot',
        'Disallow: /',
      ].join('\n')
      const result = parseRobotsTxt(raw)

      expect(result.allows_googlebot).toBe(true)
      expect(result.ai_bots['GPTBot']).toBe('blocked')
      expect(result.ai_bots['ClaudeBot']).toBe('blocked')
    })
  })

  // ─── Sitemap 추출 ───

  describe('Sitemap 추출', () => {
    it('Sitemap URL 1개 추출', () => {
      const raw = [
        'User-agent: *',
        'Allow: /',
        'Sitemap: https://example.com/sitemap.xml',
      ].join('\n')
      const result = parseRobotsTxt(raw)

      expect(result.sitemap_urls).toEqual(['https://example.com/sitemap.xml'])
    })

    it('Sitemap URL 복수 추출', () => {
      const raw = [
        'User-agent: *',
        'Allow: /',
        'Sitemap: https://example.com/sitemap.xml',
        'Sitemap: https://example.com/sitemap-blog.xml',
      ].join('\n')
      const result = parseRobotsTxt(raw)

      expect(result.sitemap_urls).toEqual([
        'https://example.com/sitemap.xml',
        'https://example.com/sitemap-blog.xml',
      ])
    })

    it('Sitemap 없으면 빈 배열', () => {
      const raw = 'User-agent: *\nAllow: /'
      const result = parseRobotsTxt(raw)

      expect(result.sitemap_urls).toEqual([])
    })
  })

  // ─── 엣지 케이스 ───

  describe('엣지 케이스', () => {
    it('주석만 있는 파일', () => {
      const raw = '# This is a comment\n# Another comment'
      const result = parseRobotsTxt(raw)

      expect(result.exists).toBe(true)
      expect(result.allows_googlebot).toBe(true)
      for (const bot of AI_BOT_LIST) {
        expect(result.ai_bots[bot]).toBe('not_mentioned')
      }
    })

    it('BOM 포함 파일 정상 파싱', () => {
      const raw = '\uFEFFUser-agent: *\nDisallow: /'
      const result = parseRobotsTxt(raw)

      expect(result.allows_googlebot).toBe(false)
      for (const bot of AI_BOT_LIST) {
        expect(result.ai_bots[bot]).toBe('blocked')
      }
    })

    it('Windows 줄바꿈 (CRLF) 정상 파싱', () => {
      const raw = 'User-agent: *\r\nDisallow: /'
      const result = parseRobotsTxt(raw)

      expect(result.allows_googlebot).toBe(false)
      for (const bot of AI_BOT_LIST) {
        expect(result.ai_bots[bot]).toBe('blocked')
      }
    })

    it('부분 Disallow (경로 제한)는 루트 차단이 아님', () => {
      const raw = 'User-agent: GPTBot\nDisallow: /private/\nDisallow: /*.pdf$'
      const result = parseRobotsTxt(raw)

      // 루트(/)는 차단하지 않았으므로 allowed
      expect(result.ai_bots['GPTBot']).toBe('allowed')
    })

    it('복수 User-agent 그룹 독립 판정', () => {
      const raw = [
        'User-agent: *',
        'Allow: /',
        '',
        'User-agent: Googlebot',
        'Allow: /',
        '',
        'User-agent: GPTBot',
        'Disallow: /',
      ].join('\n')
      const result = parseRobotsTxt(raw)

      expect(result.allows_googlebot).toBe(true)
      expect(result.ai_bots['GPTBot']).toBe('blocked')
      expect(result.ai_bots['ClaudeBot']).toBe('allowed') // * 섹션 적용
    })

    it('raw 필드에 원본 텍스트 보존', () => {
      const raw = 'User-agent: *\nAllow: /'
      const result = parseRobotsTxt(raw)

      expect(result.raw).toBe(raw)
    })
  })
})
