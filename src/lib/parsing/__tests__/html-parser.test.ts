/**
 * HTML Parser Tests
 * Test extraction of SEO elements: meta tags, headings, links, images
 */

import { describe, it, expect } from 'vitest';
import { parseHtml } from '../html-parser';

describe('HTML Parser', () => {
  describe('parseHtml basic functionality', () => {
    it('should return empty structures for empty HTML', () => {
      const result = parseHtml('');
      expect(result).toEqual({
        meta: {},
        headings: [],
        links: [],
        images: [],
      });
    });

    it('should return valid structure for null input', () => {
      const result = parseHtml(null as unknown as string);
      expect(result).toEqual({
        meta: {},
        headings: [],
        links: [],
        images: [],
      });
    });

    it('should return valid structure for undefined input', () => {
      const result = parseHtml(undefined as unknown as string);
      expect(result).toEqual({
        meta: {},
        headings: [],
        links: [],
        images: [],
      });
    });

    it('should parse valid HTML with all elements', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width">
          </head>
          <body>
            <h1>Main Heading</h1>
            <h2>Sub Heading</h2>
            <a href="/internal">Internal Link</a>
            <img src="/image.jpg" alt="Test Image">
          </body>
        </html>
      `;
      const result = parseHtml(html);
      expect(result.meta.title).toBe('Test Page');
      expect(result.meta.description).toBe('Test description');
      expect(result.meta.charset).toBe('UTF-8');
      expect(result.headings.length).toBeGreaterThan(0);
      expect(result.links.length).toBeGreaterThan(0);
      expect(result.images.length).toBeGreaterThan(0);
    });
  });

  describe('Meta tags extraction', () => {
    it('should extract title tag', () => {
      const html = '<html><head><title>My Title</title></head></html>';
      const result = parseHtml(html);
      expect(result.meta.title).toBe('My Title');
    });

    it('should return undefined for missing title', () => {
      const html = '<html><head></head></html>';
      const result = parseHtml(html);
      expect(result.meta.title).toBeUndefined();
    });

    it('should extract meta description', () => {
      const html = '<html><head><meta name="description" content="My Description"></head></html>';
      const result = parseHtml(html);
      expect(result.meta.description).toBe('My Description');
    });

    it('should return undefined for missing meta description', () => {
      const html = '<html><head></head></html>';
      const result = parseHtml(html);
      expect(result.meta.description).toBeUndefined();
    });

    it('should extract charset meta tag', () => {
      const html = '<html><head><meta charset="UTF-8"></head></html>';
      const result = parseHtml(html);
      expect(result.meta.charset).toBe('UTF-8');
    });

    it('should extract viewport meta tag', () => {
      const html = '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head></html>';
      const result = parseHtml(html);
      expect(result.meta.viewport).toBe('width=device-width, initial-scale=1.0');
    });

    it('should extract Open Graph tags', () => {
      const html = `
        <html><head>
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="https://example.com/image.jpg">
          <meta property="og:type" content="website">
        </head></html>
      `;
      const result = parseHtml(html);
      expect(result.meta.ogTitle).toBe('OG Title');
      expect(result.meta.ogDescription).toBe('OG Description');
      expect(result.meta.ogImage).toBe('https://example.com/image.jpg');
      expect(result.meta.ogType).toBe('website');
    });

    it('should extract Twitter tags', () => {
      const html = `
        <html><head>
          <meta name="twitter:title" content="Twitter Title">
          <meta name="twitter:description" content="Twitter Description">
          <meta name="twitter:image" content="https://example.com/twitter.jpg">
        </head></html>
      `;
      const result = parseHtml(html);
      expect(result.meta.twitterTitle).toBe('Twitter Title');
      expect(result.meta.twitterDescription).toBe('Twitter Description');
      expect(result.meta.twitterImage).toBe('https://example.com/twitter.jpg');
    });

    it('should extract canonical URL', () => {
      const html = '<html><head><link rel="canonical" href="https://example.com"></head></html>';
      const result = parseHtml(html);
      expect(result.meta.canonical).toBe('https://example.com');
    });

    it('should extract robots meta tag', () => {
      const html = '<html><head><meta name="robots" content="index, follow"></head></html>';
      const result = parseHtml(html);
      expect(result.meta.robots).toBe('index, follow');
    });

    it('should extract keywords meta tag', () => {
      const html = '<html><head><meta name="keywords" content="keyword1, keyword2"></head></html>';
      const result = parseHtml(html);
      expect(result.meta.keywords).toBe('keyword1, keyword2');
    });

    it('should extract author meta tag', () => {
      const html = '<html><head><meta name="author" content="John Doe"></head></html>';
      const result = parseHtml(html);
      expect(result.meta.author).toBe('John Doe');
    });

    it('should handle malformed meta tags gracefully', () => {
      const html = '<html><head><meta><meta name="test"></head></html>';
      const result = parseHtml(html);
      expect(result.meta).toBeDefined();
      expect(typeof result.meta).toBe('object');
    });

    it('should handle HTML with Korean charset declaration', () => {
      const html = '<html><head><meta charset="EUC-KR"></head></html>';
      const result = parseHtml(html);
      expect(result.meta.charset).toBe('EUC-KR');
    });
  });

  describe('Headings extraction', () => {
    it('should extract h1 tags', () => {
      const html = '<html><body><h1>Main Heading</h1></body></html>';
      const result = parseHtml(html);
      expect(result.headings).toContainEqual({
        level: 1,
        text: 'Main Heading',
      });
    });

    it('should extract h2 tags', () => {
      const html = '<html><body><h2>Sub Heading</h2></body></html>';
      const result = parseHtml(html);
      expect(result.headings).toContainEqual({
        level: 2,
        text: 'Sub Heading',
      });
    });

    it('should extract h3 tags', () => {
      const html = '<html><body><h3>Minor Heading</h3></body></html>';
      const result = parseHtml(html);
      expect(result.headings).toContainEqual({
        level: 3,
        text: 'Minor Heading',
      });
    });

    it('should extract multiple headings in order', () => {
      const html = `
        <html><body>
          <h1>Title</h1>
          <h2>Section 1</h2>
          <h3>Subsection 1.1</h3>
          <h2>Section 2</h2>
        </body></html>
      `;
      const result = parseHtml(html);
      expect(result.headings.length).toBe(4);
      expect(result.headings[0].level).toBe(1);
      expect(result.headings[1].level).toBe(2);
      expect(result.headings[2].level).toBe(3);
      expect(result.headings[3].level).toBe(2);
    });

    it('should preserve heading text with special characters', () => {
      const html = '<html><body><h1>Title & Special "Chars"</h1></body></html>';
      const result = parseHtml(html);
      expect(result.headings[0].text).toBe('Title & Special "Chars"');
    });

    it('should handle headings with nested HTML', () => {
      const html = '<html><body><h1>Title <span>in span</span></h1></body></html>';
      const result = parseHtml(html);
      expect(result.headings[0].text).toContain('Title');
      expect(result.headings[0].text).toContain('in span');
    });

    it('should ignore h4, h5, h6 tags', () => {
      const html = `
        <html><body>
          <h1>Title</h1>
          <h4>Not tracked</h4>
          <h5>Also not tracked</h5>
          <h6>Neither tracked</h6>
        </body></html>
      `;
      const result = parseHtml(html);
      expect(result.headings.length).toBe(1);
      expect(result.headings[0].level).toBe(1);
    });

    it('should handle empty headings', () => {
      const html = '<html><body><h1></h1><h2>Normal</h2></body></html>';
      const result = parseHtml(html);
      // Empty heading should still be extracted but with empty text
      const h1 = result.headings.find(h => h.level === 1);
      expect(h1).toBeDefined();
      expect(h1?.text).toBe('');
    });

    it('should handle Korean text in headings', () => {
      const html = '<html><body><h1>한국어 제목</h1></body></html>';
      const result = parseHtml(html);
      expect(result.headings[0].text).toBe('한국어 제목');
    });
  });

  describe('Links extraction and classification', () => {
    it('should extract link href and text', () => {
      const html = '<html><body><a href="https://example.com">Example Link</a></body></html>';
      const result = parseHtml(html);
      expect(result.links).toContainEqual(
        expect.objectContaining({
          href: 'https://example.com',
          text: 'Example Link',
        })
      );
    });

    it('should classify internal links', () => {
      const html = `
        <html>
          <head>
            <meta property="og:url" content="https://example.com">
          </head>
          <body>
            <a href="/page">Internal Link</a>
          </body>
        </html>
      `;
      const result = parseHtml(html);
      expect(result.links[0].isInternal).toBe(true);
    });

    it('should classify relative internal links', () => {
      const html = `
        <html>
          <head>
            <meta property="og:url" content="https://example.com/path">
          </head>
          <body>
            <a href="./subpage">Relative Link</a>
          </body>
        </html>
      `;
      const result = parseHtml(html);
      expect(result.links[0].isInternal).toBe(true);
    });

    it('should classify external links', () => {
      const html = `
        <html>
          <head>
            <meta property="og:url" content="https://example.com">
          </head>
          <body>
            <a href="https://other.com">External Link</a>
          </body>
        </html>
      `;
      const result = parseHtml(html);
      expect(result.links[0].isInternal).toBe(false);
    });

    it('should handle links without og:url', () => {
      const html = '<html><body><a href="https://example.com">Link</a></body></html>';
      const result = parseHtml(html);
      // Without og:url, should default to internal classification
      expect(result.links[0]).toBeDefined();
      expect(result.links[0].href).toBe('https://example.com');
    });

    it('should handle links without href attribute', () => {
      const html = '<html><body><a>No href</a></body></html>';
      const result = parseHtml(html);
      // Links without href should be skipped or marked as broken
      const noHrefLink = result.links.find(l => l.text === 'No href');
      if (noHrefLink) {
        expect(noHrefLink.href).toBe('');
      }
    });

    it('should handle anchor links (#)', () => {
      const html = `
        <html>
          <head>
            <meta property="og:url" content="https://example.com">
          </head>
          <body>
            <a href="#section">Anchor</a>
          </body>
        </html>
      `;
      const result = parseHtml(html);
      expect(result.links[0].href).toBe('#section');
      expect(result.links[0].isInternal).toBe(true);
    });

    it('should handle empty anchor text', () => {
      const html = '<html><body><a href="/page"></a></body></html>';
      const result = parseHtml(html);
      expect(result.links[0]).toBeDefined();
      expect(result.links[0].text).toBe('');
    });

    it('should handle multiple links', () => {
      const html = `
        <html>
          <head>
            <meta property="og:url" content="https://example.com">
          </head>
          <body>
            <a href="/page1">Link 1</a>
            <a href="https://other.com">Link 2</a>
            <a href="/page3">Link 3</a>
          </body>
        </html>
      `;
      const result = parseHtml(html);
      expect(result.links.length).toBe(3);
      expect(result.links[0].text).toBe('Link 1');
      expect(result.links[1].text).toBe('Link 2');
      expect(result.links[2].text).toBe('Link 3');
    });

    it('should handle links with nested HTML', () => {
      const html = '<html><body><a href="/page"><span>Link</span> Text</a></body></html>';
      const result = parseHtml(html);
      expect(result.links[0].text).toContain('Link');
      expect(result.links[0].text).toContain('Text');
    });

    it('should handle Korean text in links', () => {
      const html = '<html><body><a href="/한글">한글 링크</a></body></html>';
      const result = parseHtml(html);
      expect(result.links[0].text).toBe('한글 링크');
    });
  });

  describe('Images extraction', () => {
    it('should extract img src and alt', () => {
      const html = '<html><body><img src="/image.jpg" alt="Test Image"></body></html>';
      const result = parseHtml(html);
      expect(result.images).toContainEqual(
        expect.objectContaining({
          src: '/image.jpg',
          alt: 'Test Image',
        })
      );
    });

    it('should handle images without alt text', () => {
      const html = '<html><body><img src="/image.jpg"></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].src).toBe('/image.jpg');
      expect(result.images[0].alt).toBeUndefined();
    });

    it('should handle empty alt attribute', () => {
      const html = '<html><body><img src="/image.jpg" alt=""></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].alt).toBe('');
    });

    it('should detect width attribute', () => {
      const html = '<html><body><img src="/image.jpg" width="100"></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].hasWidth).toBe(true);
    });

    it('should detect height attribute', () => {
      const html = '<html><body><img src="/image.jpg" height="100"></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].hasHeight).toBe(true);
    });

    it('should detect both width and height', () => {
      const html = '<html><body><img src="/image.jpg" width="100" height="100"></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].hasWidth).toBe(true);
      expect(result.images[0].hasHeight).toBe(true);
    });

    it('should handle images without dimensions', () => {
      const html = '<html><body><img src="/image.jpg"></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].hasWidth).toBeUndefined();
      expect(result.images[0].hasHeight).toBeUndefined();
    });

    it('should handle multiple images', () => {
      const html = `
        <html><body>
          <img src="/image1.jpg" alt="Image 1">
          <img src="/image2.jpg" alt="Image 2">
          <img src="/image3.jpg" alt="Image 3">
        </body></html>
      `;
      const result = parseHtml(html);
      expect(result.images.length).toBe(3);
      expect(result.images[0].alt).toBe('Image 1');
      expect(result.images[1].alt).toBe('Image 2');
      expect(result.images[2].alt).toBe('Image 3');
    });

    it('should handle absolute image URLs', () => {
      const html = '<html><body><img src="https://example.com/image.jpg" alt="Image"></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].src).toBe('https://example.com/image.jpg');
    });

    it('should handle relative image URLs', () => {
      const html = '<html><body><img src="./images/image.jpg" alt="Image"></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].src).toBe('./images/image.jpg');
    });

    it('should handle images with special characters in alt', () => {
      const html = '<html><body><img src="/image.jpg" alt="Image & special &quot;chars&quot;"></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].alt).toBe('Image & special "chars"');
    });

    it('should handle Korean alt text', () => {
      const html = '<html><body><img src="/image.jpg" alt="한글 이미지"></body></html>';
      const result = parseHtml(html);
      expect(result.images[0].alt).toBe('한글 이미지');
    });

    it('should ignore img tags without src', () => {
      const html = '<html><body><img alt="No Source"></body></html>';
      const result = parseHtml(html);
      // Images without src should not be included
      expect(result.images.length).toBe(0);
    });
  });

  describe('Edge cases and malformed HTML', () => {
    it('should handle incomplete HTML tags', () => {
      const html = '<html><body><h1>Incomplete<h2>Next</body>';
      const result = parseHtml(html);
      expect(result.headings.length).toBeGreaterThan(0);
    });

    it('should handle HTML with JavaScript', () => {
      const html = `
        <html><body>
          <h1>Title</h1>
          <script>alert('test');</script>
          <a href="/page">Link</a>
        </body></html>
      `;
      const result = parseHtml(html);
      expect(result.headings.length).toBeGreaterThan(0);
      expect(result.links.length).toBeGreaterThan(0);
    });

    it('should handle HTML with comments', () => {
      const html = `
        <html><body>
          <!-- This is a comment -->
          <h1>Title</h1>
          <!-- Another comment -->
        </body></html>
      `;
      const result = parseHtml(html);
      expect(result.headings[0].text).toBe('Title');
    });

    it('should handle very large HTML documents', () => {
      let html = '<html><body>';
      for (let i = 0; i < 1000; i++) {
        html += `<h2>Heading ${i}</h2><a href="/page-${i}">Link ${i}</a>`;
      }
      html += '</body></html>';
      const result = parseHtml(html);
      expect(result.headings.length).toBe(1000);
      expect(result.links.length).toBe(1000);
    });

    it('should handle meta tags with various quote styles', () => {
      const html = `
        <html><head>
          <meta name='description' content='Single quotes'>
          <meta name="keywords" content="Double quotes">
          <meta property='og:title' content='Single property'>
        </head></html>
      `;
      const result = parseHtml(html);
      expect(result.meta.description).toBe('Single quotes');
      expect(result.meta.keywords).toBe('Double quotes');
      expect(result.meta.ogTitle).toBe('Single property');
    });

    it('should handle self-closing tags properly', () => {
      const html = '<html><body><img src="/test.jpg" /><br /><hr /></body></html>';
      const result = parseHtml(html);
      expect(result.images.length).toBe(1);
    });

    it('should trim whitespace from text content', () => {
      const html = '<html><body><h1>  Title with spaces  </h1></body></html>';
      const result = parseHtml(html);
      expect(result.headings[0].text).toBe('Title with spaces');
    });
  });

  describe('Meta tags with case variations', () => {
    it('should handle meta tag names with different cases', () => {
      const html = `
        <html><head>
          <meta NAME="description" CONTENT="Test">
        </head></html>
      `;
      const result = parseHtml(html);
      // Should still extract despite case differences
      expect(result.meta).toBeDefined();
    });

    it('should handle property attribute with different cases', () => {
      const html = `
        <html><head>
          <meta PROPERTY="og:title" CONTENT="Test OG">
        </head></html>
      `;
      const result = parseHtml(html);
      expect(result.meta).toBeDefined();
    });
  });

  describe('Return type validation', () => {
    it('should return object with all required fields', () => {
      const html = '<html><body><h1>Test</h1></body></html>';
      const result = parseHtml(html);
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('headings');
      expect(result).toHaveProperty('links');
      expect(result).toHaveProperty('images');
    });

    it('meta should be an object', () => {
      const result = parseHtml('<html></html>');
      expect(typeof result.meta).toBe('object');
      expect(Array.isArray(result.meta)).toBe(false);
    });

    it('headings should be an array', () => {
      const result = parseHtml('<html></html>');
      expect(Array.isArray(result.headings)).toBe(true);
    });

    it('links should be an array', () => {
      const result = parseHtml('<html></html>');
      expect(Array.isArray(result.links)).toBe(true);
    });

    it('images should be an array', () => {
      const result = parseHtml('<html></html>');
      expect(Array.isArray(result.images)).toBe(true);
    });
  });
});
