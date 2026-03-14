import { describe, it, expect } from 'vitest'
import { parseSitemap } from '../sitemap'

describe('parseSitemap', () => {
  // ─── 기본 동작 ───

  describe('기본 동작', () => {
    it('파일 미존재 시 exists: false', () => {
      const result = parseSitemap(null)

      expect(result.exists).toBe(false)
      expect(result.url_count).toBe(0)
      expect(result.last_modified).toBeNull()
    })

    it('빈 파일 시 exists: true, url_count: 0', () => {
      const result = parseSitemap('')

      expect(result.exists).toBe(true)
      expect(result.url_count).toBe(0)
      expect(result.last_modified).toBeNull()
    })

    it('URL 1개 카운팅', () => {
      const raw = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
  </url>
</urlset>`
      const result = parseSitemap(raw)

      expect(result.exists).toBe(true)
      expect(result.url_count).toBe(1)
    })

    it('URL 복수 카운팅', () => {
      const raw = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
  <url><loc>https://example.com/contact</loc></url>
</urlset>`
      const result = parseSitemap(raw)

      expect(result.url_count).toBe(3)
    })
  })

  // ─── lastmod 추출 ───

  describe('lastmod 추출', () => {
    it('lastmod 1개 추출', () => {
      const raw = `<urlset>
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-14</lastmod>
  </url>
</urlset>`
      const result = parseSitemap(raw)

      expect(result.last_modified).toBe('2026-03-14')
    })

    it('lastmod 복수 → 최신 날짜 반환', () => {
      const raw = `<urlset>
  <url><loc>https://example.com/a</loc><lastmod>2026-01-01</lastmod></url>
  <url><loc>https://example.com/b</loc><lastmod>2026-03-14</lastmod></url>
  <url><loc>https://example.com/c</loc><lastmod>2025-12-25</lastmod></url>
</urlset>`
      const result = parseSitemap(raw)

      expect(result.last_modified).toBe('2026-03-14')
    })

    it('lastmod 없으면 null', () => {
      const raw = `<urlset>
  <url><loc>https://example.com/</loc></url>
</urlset>`
      const result = parseSitemap(raw)

      expect(result.last_modified).toBeNull()
    })
  })

  // ─── sitemap index ───

  describe('sitemap index', () => {
    it('sitemap index 감지 시 하위 사이트맵 수 카운팅', () => {
      const raw = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-posts.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-pages.xml</loc>
  </sitemap>
</sitemapindex>`
      const result = parseSitemap(raw)

      expect(result.exists).toBe(true)
      expect(result.url_count).toBe(2)
    })

    it('sitemap index + lastmod 추출', () => {
      const raw = `<sitemapindex>
  <sitemap>
    <loc>https://example.com/sitemap-1.xml</loc>
    <lastmod>2026-02-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-2.xml</loc>
    <lastmod>2026-03-10</lastmod>
  </sitemap>
</sitemapindex>`
      const result = parseSitemap(raw)

      expect(result.url_count).toBe(2)
      expect(result.last_modified).toBe('2026-03-10')
    })
  })

  // ─── 엣지 케이스 ───

  describe('엣지 케이스', () => {
    it('BOM 포함 시 BOM 무시하고 정상 파싱', () => {
      const raw = `\uFEFF<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url><loc>https://example.com/</loc></url>
</urlset>`
      const result = parseSitemap(raw)

      expect(result.exists).toBe(true)
      expect(result.url_count).toBe(1)
    })

    it('네임스페이스 포함 XML 정상 파싱', () => {
      const raw = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-14T10:30:00+09:00</lastmod>
  </url>
  <url>
    <loc>https://example.com/about</loc>
  </url>
</urlset>`
      const result = parseSitemap(raw)

      expect(result.url_count).toBe(2)
      expect(result.last_modified).toBe('2026-03-14T10:30:00+09:00')
    })

    it('malformed XML (닫는 태그 없음) → 파싱 가능한 만큼 추출', () => {
      const raw = `<urlset>
  <url><loc>https://example.com/</loc><lastmod>2026-03-14</lastmod></url>
  <url><loc>https://example.com/about</loc>
  <!-- 파일이 잘림 -->`
      const result = parseSitemap(raw)

      expect(result.exists).toBe(true)
      expect(result.url_count).toBe(2)
      expect(result.last_modified).toBe('2026-03-14')
    })
  })
})
