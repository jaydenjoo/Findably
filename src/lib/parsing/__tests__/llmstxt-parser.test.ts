import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchLlmsTxt } from '../llmstxt-parser'

// ─── fetch mock ───

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── 헬퍼 ───

function okTextResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}

function notFoundResponse(): Response {
  return new Response('Not Found', { status: 404 })
}

function htmlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/html' },
  })
}

// ─── 정상 케이스 ───

describe('fetchLlmsTxt — success', () => {
  it('should return exists=true when llms.txt found', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/llms.txt'))
        return Promise.resolve(okTextResponse('# My Site'))
      return Promise.resolve(notFoundResponse())
    })

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(true)
    expect(result.content).toBe('# My Site')
    expect(result.hasFullVersion).toBe(false)
  })

  it('should detect hasFullVersion when llms-full.txt also exists', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/llms.txt'))
        return Promise.resolve(okTextResponse('# Main'))
      if (url.endsWith('/llms-full.txt'))
        return Promise.resolve(okTextResponse('# Full'))
      return Promise.resolve(notFoundResponse())
    })

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(true)
    expect(result.hasFullVersion).toBe(true)
  })

  it('should normalize trailing slashes in baseUrl', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === 'https://example.com/llms.txt')
        return Promise.resolve(okTextResponse('ok'))
      return Promise.resolve(notFoundResponse())
    })

    const result = await fetchLlmsTxt('https://example.com///')

    expect(result.exists).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/llms.txt',
      expect.any(Object)
    )
  })
})

// ─── 미존재 케이스 ───

describe('fetchLlmsTxt — not found', () => {
  it('should return exists=false when llms.txt 404', async () => {
    mockFetch.mockResolvedValue(notFoundResponse())

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(false)
    expect(result.content).toBeNull()
  })

  it('should still detect hasFullVersion even if llms.txt is missing', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/llms-full.txt'))
        return Promise.resolve(okTextResponse('Full'))
      return Promise.resolve(notFoundResponse())
    })

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(false)
    expect(result.hasFullVersion).toBe(true)
  })
})

// ─── 빈 콘텐츠 ───

describe('fetchLlmsTxt — empty content', () => {
  it('should return exists=false when llms.txt is empty', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/llms.txt')) return Promise.resolve(okTextResponse(''))
      return Promise.resolve(notFoundResponse())
    })

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(false)
    expect(result.content).toBeNull()
  })

  it('should return exists=false when llms.txt is whitespace only', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/llms.txt'))
        return Promise.resolve(okTextResponse('   \n\t  '))
      return Promise.resolve(notFoundResponse())
    })

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(false)
  })
})

// ─── BOM 제거 ───

describe('fetchLlmsTxt — BOM handling', () => {
  it('should strip BOM from content', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/llms.txt'))
        return Promise.resolve(okTextResponse('\uFEFF# Site'))
      return Promise.resolve(notFoundResponse())
    })

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(true)
    expect(result.content).toBe('# Site')
    expect(result.content?.startsWith('\uFEFF')).toBe(false)
  })
})

// ─── content-type 검증 ───

describe('fetchLlmsTxt — content-type validation', () => {
  it('should reject non-text content types', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/llms.txt')) {
        return Promise.resolve(
          new Response('{"json": true}', {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        )
      }
      return Promise.resolve(notFoundResponse())
    })

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(false)
  })

  it('should accept text/html as text/* type', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.endsWith('/llms.txt'))
        return Promise.resolve(htmlResponse('# Content'))
      return Promise.resolve(notFoundResponse())
    })

    const result = await fetchLlmsTxt('https://example.com')

    // text/html contains 'text/' so it passes
    expect(result.exists).toBe(true)
  })
})

// ─── 네트워크 에러 / 타임아웃 ───

describe('fetchLlmsTxt — error handling', () => {
  it('should return exists=false on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(false)
    expect(result.content).toBeNull()
  })

  it('should return exists=false on abort (timeout)', async () => {
    mockFetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    const result = await fetchLlmsTxt('https://example.com')

    expect(result.exists).toBe(false)
  })

  it('should pass User-Agent header', async () => {
    mockFetch.mockResolvedValue(notFoundResponse())

    await fetchLlmsTxt('https://example.com')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'User-Agent': 'Findably-Bot/1.0' },
      })
    )
  })

  it('should pass AbortSignal for timeout', async () => {
    mockFetch.mockResolvedValue(notFoundResponse())

    await fetchLlmsTxt('https://example.com')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    )
  })
})
