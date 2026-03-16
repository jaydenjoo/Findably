import { describe, it, expect } from 'vitest'
import { extractCompetitorUrls } from '../extract-competitor-urls'
import type { CompetitorAnalysis } from '@/features/diagnosis-paid'

function makeCompetitor(url: string): CompetitorAnalysis {
  return { url, overallScore: 70, strengths: [], weaknesses: [], gaps: [] }
}

describe('extractCompetitorUrls', () => {
  const originalUrl = 'https://example.com'

  it('should extract URLs from AI competitors', () => {
    const result = extractCompetitorUrls({
      aiCompetitors: [
        makeCompetitor('https://competitor1.com'),
        makeCompetitor('https://competitor2.com'),
      ],
      originalUrl,
    })

    expect(result.urls).toEqual([
      'https://competitor1.com',
      'https://competitor2.com',
    ])
    expect(result.sources).toEqual(['ai_agent', 'ai_agent'])
  })

  it('should prioritize user input URLs over AI', () => {
    const result = extractCompetitorUrls({
      aiCompetitors: [makeCompetitor('https://ai-found.com')],
      userCompetitorUrls: ['https://user-input.com'],
      originalUrl,
    })

    expect(result.urls[0]).toBe('https://user-input.com')
    expect(result.sources[0]).toBe('user_input')
  })

  it('should limit to MAX_COMPETITORS (3)', () => {
    const result = extractCompetitorUrls({
      aiCompetitors: [
        makeCompetitor('https://a.com'),
        makeCompetitor('https://b.com'),
        makeCompetitor('https://c.com'),
        makeCompetitor('https://d.com'),
      ],
      originalUrl,
    })

    expect(result.urls).toHaveLength(3)
  })

  it('should exclude original URL', () => {
    const result = extractCompetitorUrls({
      aiCompetitors: [
        makeCompetitor('https://example.com'),
        makeCompetitor('https://competitor.com'),
      ],
      originalUrl,
    })

    expect(result.urls).toEqual(['https://competitor.com'])
    expect(result.sources).toEqual(['ai_agent'])
  })

  it('should exclude www variant of original URL', () => {
    const result = extractCompetitorUrls({
      aiCompetitors: [makeCompetitor('https://www.example.com')],
      originalUrl,
    })

    expect(result.urls).toHaveLength(0)
  })

  it('should deduplicate by hostname', () => {
    const result = extractCompetitorUrls({
      aiCompetitors: [
        makeCompetitor('https://competitor.com/page1'),
        makeCompetitor('https://competitor.com/page2'),
      ],
      originalUrl,
    })

    expect(result.urls).toHaveLength(1)
    expect(result.urls[0]).toBe('https://competitor.com')
  })

  it('should handle URLs without protocol', () => {
    const result = extractCompetitorUrls({
      aiCompetitors: [],
      userCompetitorUrls: ['competitor.com'],
      originalUrl,
    })

    expect(result.urls).toEqual(['https://competitor.com'])
  })

  it('should skip invalid URLs', () => {
    const result = extractCompetitorUrls({
      aiCompetitors: [makeCompetitor('not-a-url')],
      userCompetitorUrls: ['', '   ', 'just-text'],
      originalUrl,
    })

    expect(result.urls).toHaveLength(0)
  })

  it('should return empty when no competitors found', () => {
    const result = extractCompetitorUrls({
      aiCompetitors: [],
      originalUrl,
    })

    expect(result.urls).toHaveLength(0)
    expect(result.sources).toHaveLength(0)
  })
})
