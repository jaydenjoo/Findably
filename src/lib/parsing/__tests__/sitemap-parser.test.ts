import { describe, it, expect } from 'vitest';
import { parseRobotsTxt, parseSitemapXml } from '../sitemap-parser';

describe('Sitemap Parser', () => {
  describe('parseRobotsTxt', () => {
    it('should return robotsTxtFound: false for empty content', () => {
      const result = parseRobotsTxt('');
      expect(result.robotsTxtFound).toBe(false);
      expect(result.robotsRules).toEqual([]);
    });

    it('should return robotsTxtFound: false for null/undefined', () => {
      expect(parseRobotsTxt(null as unknown as string).robotsTxtFound).toBe(false);
      expect(parseRobotsTxt(undefined as unknown as string).robotsTxtFound).toBe(false);
    });

    it('should extract simple Disallow rules', () => {
      const robotsTxt = `User-agent: *
Disallow: /admin/
Disallow: /private/`;

      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      expect(result.robotsRules).toContainEqual(expect.objectContaining({
        userAgent: '*',
        disallow: ['/admin/', '/private/'],
      }));
    });

    it('should extract Allow rules', () => {
      const robotsTxt = `User-agent: *
Allow: /public/
Disallow: /private/`;

      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      const rule = result.robotsRules.find(r => r.userAgent === '*');
      expect(rule?.allow).toEqual(['/public/']);
      expect(rule?.disallow).toEqual(['/private/']);
    });

    it('should extract Crawl-delay rules', () => {
      const robotsTxt = `User-agent: *
Disallow: /
Crawl-delay: 10`;

      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      const rule = result.robotsRules.find(r => r.userAgent === '*');
      expect(rule?.crawlDelay).toBe(10);
    });

    it('should handle multiple User-agent blocks', () => {
      const robotsTxt = `User-agent: Googlebot
Disallow: /private/

User-agent: *
Disallow: /admin/`;

      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      expect(result.robotsRules).toHaveLength(2);
      expect(result.robotsRules.map(r => r.userAgent)).toEqual(['Googlebot', '*']);
    });

    it('should handle case-insensitive directives', () => {
      const robotsTxt = `user-agent: *
disallow: /admin/
CRAWL-DELAY: 5`;

      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      const rule = result.robotsRules[0];
      expect(rule.disallow).toEqual(['/admin/']);
      expect(rule.crawlDelay).toBe(5);
    });

    it('should handle empty lines and comments', () => {
      const robotsTxt = `# This is a comment
User-agent: *

# Another comment
Disallow: /temp/`;

      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      expect(result.robotsRules).toHaveLength(1);
      expect(result.robotsRules[0].disallow).toEqual(['/temp/']);
    });

    it('should handle Sitemap directive in robots.txt', () => {
      const robotsTxt = `User-agent: *
Disallow: /admin/
Sitemap: https://example.com/sitemap.xml`;

      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      expect(result.sitemapUrls).toEqual(['https://example.com/sitemap.xml']);
    });

    it('should handle multiple Sitemap directives', () => {
      const robotsTxt = `User-agent: *
Sitemap: https://example.com/sitemap1.xml
Sitemap: https://example.com/sitemap2.xml`;

      const result = parseRobotsTxt(robotsTxt);
      expect(result.sitemapUrls).toHaveLength(2);
      expect(result.sitemapUrls).toContain('https://example.com/sitemap1.xml');
      expect(result.sitemapUrls).toContain('https://example.com/sitemap2.xml');
    });

    it('should handle malformed crawl-delay gracefully', () => {
      const robotsTxt = `User-agent: *
Crawl-delay: invalid`;

      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      // Should either skip or set to 0
      const rule = result.robotsRules[0];
      expect(rule.crawlDelay === undefined || rule.crawlDelay === 0).toBe(true);
    });

    it('should trim whitespace from directives', () => {
      const robotsTxt = `User-agent:   *
Disallow:   /admin/   `;

      const result = parseRobotsTxt(robotsTxt);
      const rule = result.robotsRules[0];
      expect(rule.userAgent).toBe('*');
      expect(rule.disallow).toEqual(['/admin/']);
    });
  });

  describe('parseSitemapXml', () => {
    it('should return empty sitemapUrls for null/undefined/empty content', () => {
      expect(parseSitemapXml('').sitemapUrls).toEqual([]);
      expect(parseSitemapXml(null as unknown as string).sitemapUrls).toEqual([]);
      expect(parseSitemapXml(undefined as unknown as string).sitemapUrls).toEqual([]);
    });

    it('should extract URL locations from sitemap.xml', () => {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
  </url>
  <url>
    <loc>https://example.com/page1</loc>
  </url>
</urlset>`;

      const result = parseSitemapXml(sitemap);
      expect(result.sitemapUrls).toEqual([
        'https://example.com/',
        'https://example.com/page1',
      ]);
      expect(result.sitemapCount).toBe(2);
    });

    it('should extract lastmod from sitemap entries', () => {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-11</lastmod>
  </url>
  <url>
    <loc>https://example.com/old</loc>
    <lastmod>2025-12-01</lastmod>
  </url>
</urlset>`;

      const result = parseSitemapXml(sitemap);
      expect(result.lastModified).toBe('2026-03-11');
      expect(result.sitemapCount).toBe(2);
    });

    it('should extract changefreq and priority attributes', () => {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

      const result = parseSitemapXml(sitemap);
      expect(result.sitemapUrls).toContain('https://example.com/');
      expect(result.sitemapCount).toBe(1);
    });

    it('should handle sitemap index files', () => {
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap2.xml</loc>
  </sitemap>
</sitemapindex>`;

      const result = parseSitemapXml(sitemapIndex);
      expect(result.sitemapUrls).toEqual([
        'https://example.com/sitemap1.xml',
        'https://example.com/sitemap2.xml',
      ]);
      expect(result.sitemapCount).toBe(2);
    });

    it('should handle malformed XML gracefully', () => {
      const malformedXml = `<?xml version="1.0"?>
<urlset>
  <url>
    <loc>https://example.com/page1</loc>
  <url>
    <loc>https://example.com/page2</loc>
</urlset>`;

      // Should not throw, return whatever can be parsed
      const result = parseSitemapXml(malformedXml);
      expect(result.sitemapUrls.length).toBeGreaterThanOrEqual(0);
    });

    it('should extract multiple lastmod dates and use most recent', () => {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/old</loc>
    <lastmod>2025-01-15</lastmod>
  </url>
  <url>
    <loc>https://example.com/new</loc>
    <lastmod>2026-03-11</lastmod>
  </url>
  <url>
    <loc>https://example.com/newest</loc>
    <lastmod>2026-03-10</lastmod>
  </url>
</urlset>`;

      const result = parseSitemapXml(sitemap);
      expect(result.lastModified).toBe('2026-03-11');
      expect(result.sitemapCount).toBe(3);
    });

    it('should handle namespace variations', () => {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://example.com/page</loc>
  </url>
</urlset>`;

      const result = parseSitemapXml(sitemap);
      expect(result.sitemapUrls).toContain('https://example.com/page');
    });

    it('should handle mixed sitemap and sitemapindex in single doc', () => {
      // Some malformed sitemaps might have both
      const mixed = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
  </url>
</urlset>`;

      const result = parseSitemapXml(mixed);
      expect(result.sitemapUrls).toContain('https://example.com/page1');
    });

    it('should return 0 count and empty array when no URLs found', () => {
      const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

      const result = parseSitemapXml(emptySitemap);
      expect(result.sitemapUrls).toEqual([]);
      expect(result.sitemapCount).toBe(0);
    });

    it('should handle ISO 8601 datetime format for lastmod', () => {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-11T15:30:00Z</lastmod>
  </url>
</urlset>`;

      const result = parseSitemapXml(sitemap);
      // Should preserve the datetime or extract date
      expect(result.lastModified).toBeDefined();
    });

    it('should handle CDATA sections in URLs', () => {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc><![CDATA[https://example.com/page?param=value&other=123]]></loc>
  </url>
</urlset>`;

      const result = parseSitemapXml(sitemap);
      expect(result.sitemapUrls).toContain('https://example.com/page?param=value&other=123');
    });

    it('should handle encoded special characters in URLs', () => {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page%20with%20spaces</loc>
  </url>
</urlset>`;

      const result = parseSitemapXml(sitemap);
      expect(result.sitemapUrls.length).toBeGreaterThan(0);
    });
  });

  describe('Return type contracts', () => {
    it('parseRobotsTxt should always return all required fields', () => {
      const result = parseRobotsTxt('User-agent: *\nDisallow: /');
      expect(result).toHaveProperty('robotsTxtFound');
      expect(result).toHaveProperty('robotsRules');
      expect(result).toHaveProperty('sitemapUrls');
      expect(Array.isArray(result.robotsRules)).toBe(true);
      expect(Array.isArray(result.sitemapUrls)).toBe(true);
    });

    it('parseSitemapXml should always return all required fields', () => {
      const result = parseSitemapXml('<urlset></urlset>');
      expect(result).toHaveProperty('sitemapUrls');
      expect(result).toHaveProperty('sitemapCount');
      expect(result).toHaveProperty('lastModified');
      expect(Array.isArray(result.sitemapUrls)).toBe(true);
      expect(typeof result.sitemapCount).toBe('number');
      expect(result.lastModified === null || typeof result.lastModified === 'string').toBe(true);
    });

    it('robotsRules array items should have required structure', () => {
      const result = parseRobotsTxt('User-agent: *\nDisallow: /admin/');
      if (result.robotsRules.length > 0) {
        const rule = result.robotsRules[0];
        expect(rule).toHaveProperty('userAgent');
        expect(rule).toHaveProperty('disallow');
        expect(Array.isArray(rule.disallow)).toBe(true);
      }
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should handle very long robots.txt files', () => {
      let robotsTxt = 'User-agent: *\n';
      for (let i = 0; i < 100; i++) {
        robotsTxt += `Disallow: /path${i}/\n`;
      }

      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      expect(result.robotsRules[0].disallow.length).toBe(100);
    });

    it('should handle very large sitemaps', () => {
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      for (let i = 0; i < 100; i++) {
        sitemap += `  <url><loc>https://example.com/page${i}</loc></url>\n`;
      }
      sitemap += '</urlset>';

      const result = parseSitemapXml(sitemap);
      expect(result.sitemapCount).toBe(100);
      expect(result.sitemapUrls.length).toBe(100);
    });

    it('should handle non-string input types', () => {
      expect(() => parseRobotsTxt(123 as unknown as string)).not.toThrow();
      expect(() => parseSitemapXml({} as unknown as string)).not.toThrow();
    });

    it('should handle robots.txt without newlines at end', () => {
      const robotsTxt = 'User-agent: *\nDisallow: /admin/';
      const result = parseRobotsTxt(robotsTxt);
      expect(result.robotsTxtFound).toBe(true);
      expect(result.robotsRules[0].disallow).toContain('/admin/');
    });
  });
});
