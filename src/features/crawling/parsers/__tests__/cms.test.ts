import { describe, it, expect } from 'vitest'
import { detectCms } from '../cms'

describe('detectCms', () => {
  // ─── 기본 동작 ───

  describe('기본 동작', () => {
    it('null 입력 → detected: null, confidence: 0', () => {
      const result = detectCms(null)

      expect(result.detected).toBeNull()
      expect(result.confidence).toBe(0)
      expect(result.technologies).toEqual([])
    })

    it('빈 HTML → detected: null, confidence: 0', () => {
      const result = detectCms('')

      expect(result.detected).toBeNull()
      expect(result.confidence).toBe(0)
      expect(result.technologies).toEqual([])
    })

    it('CMS 없는 순수 HTML → detected: null', () => {
      const html = `<!DOCTYPE html>
<html><head><title>Test</title></head>
<body><h1>Hello</h1></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBeNull()
      expect(result.confidence).toBe(0)
    })
  })

  // ─── meta generator 감지 ───

  describe('meta generator 감지', () => {
    it('WordPress generator → detected: WordPress, confidence: 95', () => {
      const html = `<html><head>
<meta name="generator" content="WordPress 6.4.2">
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('WordPress')
      expect(result.confidence).toBe(95)
    })

    it('Shopify generator → detected: Shopify, confidence: 95', () => {
      const html = `<html><head>
<meta name="generator" content="Shopify">
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('Shopify')
      expect(result.confidence).toBe(95)
    })

    it('Wix generator → detected: Wix, confidence: 95', () => {
      const html = `<html><head>
<meta name="generator" content="Wix.com Website Builder">
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('Wix')
      expect(result.confidence).toBe(95)
    })

    it('알 수 없는 generator → detected: null', () => {
      const html = `<html><head>
<meta name="generator" content="UnknownCMS 1.0">
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBeNull()
    })
  })

  // ─── HTML 패턴 감지 ───

  describe('HTML 패턴 감지', () => {
    it('wp-content + wp-includes → confidence: 85', () => {
      const html = `<html><head>
<link rel="stylesheet" href="/wp-content/themes/style.css">
<script src="/wp-includes/js/jquery.js"></script>
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('WordPress')
      expect(result.confidence).toBe(85)
    })

    it('wp-content만 → confidence: 60', () => {
      const html = `<html><head>
<link rel="stylesheet" href="/wp-content/themes/style.css">
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('WordPress')
      expect(result.confidence).toBe(60)
    })

    it('cdn.shopify.com → detected: Shopify, confidence: 60', () => {
      const html = `<html><body>
<script src="https://cdn.shopify.com/s/files/1/shop.js"></script>
</body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('Shopify')
      expect(result.confidence).toBe(60)
    })

    it('cafe24 패턴 → detected: Cafe24', () => {
      const html = `<html><body>
<script src="https://img.cafe24.com/js/shop.js"></script>
<script>EC_GLOBAL_PARAM = {};</script>
</body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('Cafe24')
    })

    it('__NEXT_DATA__ → detected: Next.js, category: framework', () => {
      const html = `<html><body>
<script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>
</body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('Next.js')
      expect(result.technologies).toContain('Next.js')
    })
  })

  // ─── 복합 감지 ───

  describe('복합 감지', () => {
    it('WordPress generator + wp-content → confidence: 95 (generator 우선)', () => {
      const html = `<html><head>
<meta name="generator" content="WordPress 6.4">
<link rel="stylesheet" href="/wp-content/themes/style.css">
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('WordPress')
      expect(result.confidence).toBe(95)
    })

    it('여러 기술 동시 감지 → technologies에 모두 포함', () => {
      const html = `<html><head>
<meta name="generator" content="WordPress 6.4">
</head><body>
<script id="__NEXT_DATA__" type="application/json">{}</script>
</body></html>`

      const result = detectCms(html)

      expect(result.technologies).toContain('WordPress')
      expect(result.technologies).toContain('Next.js')
      expect(result.technologies.length).toBeGreaterThanOrEqual(2)
    })

    it('CMS + framework 동시 → CMS가 detected 우선', () => {
      const html = `<html><body>
<script src="https://cdn.shopify.com/shop.js"></script>
<script id="__NEXT_DATA__">{}</script>
</body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('Shopify')
      expect(result.technologies).toContain('Next.js')
    })
  })

  // ─── 엣지 케이스 ───

  describe('엣지 케이스', () => {
    it('BOM 포함 HTML → 정상 감지', () => {
      const html = `\uFEFF<html><head>
<meta name="generator" content="WordPress 6.4">
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('WordPress')
      expect(result.confidence).toBe(95)
    })

    it('대소문자 혼합 meta 태그 → 정상 감지', () => {
      const html = `<html><head>
<META NAME="Generator" CONTENT="Shopify">
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('Shopify')
      expect(result.confidence).toBe(95)
    })

    it('meta generator 내용이 비어있음 → 패턴으로 폴백', () => {
      const html = `<html><head>
<meta name="generator" content="">
</head><body>
<script src="/wp-content/themes/app.js"></script>
</body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('WordPress')
      expect(result.confidence).toBe(60)
    })

    it('content 속성이 name보다 앞에 있는 meta 태그', () => {
      const html = `<html><head>
<meta content="WordPress 6.4" name="generator">
</head><body></body></html>`

      const result = detectCms(html)

      expect(result.detected).toBe('WordPress')
      expect(result.confidence).toBe(95)
    })

    it('공백만 있는 HTML → detected: null', () => {
      const result = detectCms('   \n\t  ')

      expect(result.detected).toBeNull()
      expect(result.confidence).toBe(0)
    })
  })
})
