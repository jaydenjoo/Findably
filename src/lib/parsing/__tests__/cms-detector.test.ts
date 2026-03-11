/**
 * CMS Detector Module Tests
 * Tests for detecting CMS platforms from HTML content
 */

import { describe, it, expect } from 'vitest';
import { detectCms } from '../cms-detector';

describe('detectCms - CMS Platform Detection', () => {
  // WordPress 감지 테스트
  describe('WordPress detection', () => {
    it('should detect WordPress from meta generator tag', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="generator" content="WordPress 6.2.3">
        </head>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WordPress');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should detect WordPress from wp-content script path', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="/wp-content/plugins/plugin.js"></script>
        </head>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WordPress');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should detect WordPress from wp-includes path', () => {
      const html = `
        <link rel="stylesheet" href="/wp-includes/css/style.css">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WordPress');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should detect WordPress from wp-json path', () => {
      const html = `
        <link rel="rest" href="/wp-json/">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WordPress');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });
  });

  // Shopify 감지 테스트
  describe('Shopify detection', () => {
    it('should detect Shopify from meta generator tag', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="generator" content="Shopify">
        </head>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Shopify');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should detect Shopify from /cdn/shop path', () => {
      const html = `
        <script src="https://cdn.shopify.com/cdn/shop/t/1234/assets/app.js"></script>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Shopify');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should detect Shopify from myshopify.com domain', () => {
      const html = `
        <meta property="og:url" content="https://mystore.myshopify.com">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Shopify');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('should detect Shopify from data-shop attribute', () => {
      const html = `
        <html data-shop="mystore.myshopify.com">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Shopify');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });
  });

  // WIX 감지 테스트
  describe('WIX detection', () => {
    it('should detect WIX from meta generator tag', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="generator" content="Wix.com">
        </head>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WIX');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should detect WIX from wix-container class', () => {
      const html = `
        <div id="wix-container">Content</div>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WIX');
      expect(result.confidence).toBeGreaterThanOrEqual(50);
    });

    it('should detect WIX from /wix/ script path', () => {
      const html = `
        <script src="https://www.wix.com/crn/wix/main.js"></script>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WIX');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should detect WIX from wixFreemium class', () => {
      const html = `
        <html class="wixFreemium">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WIX');
      expect(result.confidence).toBeGreaterThanOrEqual(50);
    });
  });

  // 카페24 감지 테스트 (Korean CMS)
  describe('Cafe24 (카페24) detection', () => {
    it('should detect Cafe24 from meta generator tag', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="generator" content="Cafe24">
        </head>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Cafe24');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should detect Cafe24 from /echost/ path', () => {
      const html = `
        <script src="/echost/user/js/jquery.js"></script>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Cafe24');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should detect Cafe24 from /shop/ path', () => {
      const html = `
        <link rel="stylesheet" href="/shop/css/style.css">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Cafe24');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should detect Cafe24 from cafe24.com domain', () => {
      const html = `
        <meta property="og:url" content="https://mystore.cafe24.com">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Cafe24');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  // 고도몰 감지 테스트 (Korean CMS)
  describe('GodoMall (고도몰) detection', () => {
    it('should detect GodoMall from meta generator tag', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="generator" content="GodoMall">
        </head>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('GodoMall');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should detect GodoMall from /godo_modules/ path', () => {
      const html = `
        <script src="/godo_modules/admin/js/jquery.js"></script>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('GodoMall');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should detect GodoMall from /shop_img/ path', () => {
      const html = `
        <img src="/shop_img/product.jpg">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('GodoMall');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should detect GodoMall from godohosting.com domain', () => {
      const html = `
        <meta property="og:url" content="https://mystore.godohosting.com">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('GodoMall');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  // 아임웹 감지 테스트 (Korean CMS)
  describe('Imweb (아임웹) detection', () => {
    it('should detect Imweb from meta generator tag', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="generator" content="imweb">
        </head>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Imweb');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should detect Imweb from /imweb/ path', () => {
      const html = `
        <script src="/imweb/js/jquery.js"></script>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Imweb');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should detect Imweb from imweb.me domain', () => {
      const html = `
        <meta property="og:url" content="https://mystore.imweb.me">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Imweb');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  // Blogger 감지 테스트
  describe('Blogger detection', () => {
    it('should detect Blogger from meta generator tag', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="generator" content="Blogger">
        </head>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Blogger');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should detect Blogger from blogspot.com domain', () => {
      const html = `
        <meta property="og:url" content="https://myblog.blogspot.com">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Blogger');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('should detect Blogger from /feeds/posts path', () => {
      const html = `
        <link rel="alternate" type="application/atom+xml" href="/feeds/posts/default">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Blogger');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });
  });

  // Medium 감지 테스트
  describe('Medium detection', () => {
    it('should detect Medium from medium.com domain', () => {
      const html = `
        <meta property="og:url" content="https://medium.com/@username/article">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Medium');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('should detect Medium from meta generator tag', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="generator" content="Medium">
        </head>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Medium');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should detect Medium custom domain', () => {
      const html = `
        <meta property="og:url" content="https://custommedium.com">
        <link rel="alternate" href="https://medium.com/@username" type="application/rss+xml">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Medium');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });
  });

  // Unknown CMS 테스트
  describe('Unknown CMS detection', () => {
    it('should return Unknown for non-CMS HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>My Custom Site</title>
        </head>
        <body>Content</body>
        </html>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Unknown');
      expect(result.confidence).toBeLessThanOrEqual(40);
    });

    it('should return Unknown for empty HTML', () => {
      const result = detectCms('');
      expect(result.cms).toBe('Unknown');
      expect(result.confidence).toBeLessThanOrEqual(40);
    });
  });

  // 엣지 케이스 테스트
  describe('Edge cases', () => {
    it('should handle null input gracefully', () => {
      const result = detectCms(null as unknown as string);
      expect(result.cms).toBe('Unknown');
      expect(result.confidence).toBeLessThanOrEqual(40);
    });

    it('should handle undefined input gracefully', () => {
      const result = detectCms(undefined as unknown as string);
      expect(result.cms).toBe('Unknown');
      expect(result.confidence).toBeLessThanOrEqual(40);
    });

    it('should handle malformed HTML gracefully', () => {
      // Malformed HTML: incomplete meta tag
      // cheerio may not parse it correctly, so it should return Unknown or attempt detection
      const html = '<html><head><meta name="generator" content="WordPress 6.0"';
      const result = detectCms(html);
      expect(result.cms).toMatch(/WordPress|Unknown/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed case generator tags', () => {
      const html = '<meta name="generator" content="WORDPRESS 6.0">';
      const result = detectCms(html);
      expect(result.cms).toBe('WordPress');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should prioritize high-confidence signals', () => {
      // Meta generator tag has highest confidence
      const html = `
        <meta name="generator" content="WordPress 6.0">
        <meta name="generator" content="Shopify">
        <script src="/cdn/shop/t/1234/assets/app.js"></script>
      `;
      const result = detectCms(html);
      // Should detect first matching generator tag (WordPress)
      expect(['WordPress', 'Shopify']).toContain(result.cms);
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should handle whitespace in generator tag', () => {
      const html = `
        <meta name="generator" content="  WordPress 6.0  ">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WordPress');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });
  });

  // 다중 신호 테스트 (Multiple signals)
  describe('Multiple signal detection', () => {
    it('should combine multiple WordPress signals', () => {
      const html = `
        <meta name="generator" content="WordPress 6.0">
        <script src="/wp-content/plugins/plugin.js"></script>
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('WordPress');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should detect Shopify with multiple signals', () => {
      const html = `
        <script src="https://cdn.shopify.com/cdn/shop/t/1234/assets/app.js"></script>
        <meta property="og:url" content="https://mystore.myshopify.com">
      `;
      const result = detectCms(html);
      expect(result.cms).toBe('Shopify');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });
  });

  // 신뢰도 범위 테스트
  describe('Confidence scoring', () => {
    it('should return confidence between 0 and 100', () => {
      const htmlSamples = [
        '<meta name="generator" content="WordPress">',
        '<script src="/wp-content/plugins/test.js">',
        '<div id="wix-container">Test</div>',
        '<!DOCTYPE html><html><head></head></html>',
      ];

      htmlSamples.forEach((html) => {
        const result = detectCms(html);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('meta generator tag should have highest confidence (90-100)', () => {
      const html = '<meta name="generator" content="WordPress 6.0">';
      const result = detectCms(html);
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('domain-based detection should have medium-high confidence (75-85)', () => {
      const html = '<meta property="og:url" content="https://mystore.myshopify.com">';
      const result = detectCms(html);
      expect(result.confidence).toBeGreaterThanOrEqual(75);
    });

    it('script/class/id patterns should have medium confidence (50-70)', () => {
      const html = '<script src="/wp-content/plugins/test.js"></script>';
      const result = detectCms(html);
      expect(result.confidence).toBeGreaterThanOrEqual(50);
      expect(result.confidence).toBeLessThanOrEqual(70);
    });
  });
});
