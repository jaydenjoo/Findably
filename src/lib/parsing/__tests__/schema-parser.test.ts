/**
 * Schema.org Markup Parser Tests
 * Test extraction of JSON-LD and Microdata schema markup
 */

import { describe, it, expect } from 'vitest';
import { parseSchema } from '../schema-parser';

describe('Schema.org Markup Parser', () => {
  describe('parseSchema basic functionality', () => {
    it('should return empty schemas for empty HTML', () => {
      const result = parseSchema('');
      expect(result).toEqual({
        schemas: [],
        schemaFound: false,
        schemaTypes: [],
      });
    });

    it('should return valid structure for null input', () => {
      const result = parseSchema(null as unknown as string);
      expect(result).toEqual({
        schemas: [],
        schemaFound: false,
        schemaTypes: [],
      });
    });

    it('should return valid structure for undefined input', () => {
      const result = parseSchema(undefined as unknown as string);
      expect(result).toEqual({
        schemas: [],
        schemaFound: false,
        schemaTypes: [],
      });
    });

    it('should return valid structure for whitespace-only HTML', () => {
      const result = parseSchema('   \n\t  ');
      expect(result).toEqual({
        schemas: [],
        schemaFound: false,
        schemaTypes: [],
      });
    });
  });

  describe('JSON-LD parsing', () => {
    it('should parse single JSON-LD Organization schema', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Findably",
                "url": "https://findably.com",
                "logo": "https://findably.com/logo.png",
                "description": "Marketing automation platform"
              }
            </script>
          </head>
        </html>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas.length).toBe(1);
      expect(result.schemas[0].type).toBe('Organization');
      expect(result.schemas[0].properties.name).toBe('Findably');
      expect(result.schemas[0].properties.url).toBe('https://findably.com');
      expect(result.schemaTypes).toContain('Organization');
    });

    it('should parse Product schema with aggregateRating', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "iPhone 15",
            "image": "https://example.com/iphone.jpg",
            "description": "Latest smartphone",
            "brand": { "@type": "Brand", "name": "Apple" },
            "offers": {
              "@type": "Offer",
              "url": "https://example.com/iphone",
              "priceCurrency": "USD",
              "price": "799"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.5",
              "ratingCount": "1000"
            }
          }
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas.length).toBe(1);
      expect(result.schemas[0].type).toBe('Product');
      expect(result.schemas[0].properties.name).toBe('iPhone 15');
      expect(result.schemas[0].properties.aggregateRating).toBeDefined();
      expect(result.schemaTypes).toContain('Product');
    });

    it('should parse multiple JSON-LD scripts', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Company A"
          }
        </script>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "My Blog Post"
          }
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas.length).toBe(2);
      expect(result.schemaTypes).toContain('Organization');
      expect(result.schemaTypes).toContain('BlogPosting');
    });

    it('should handle JSON-LD @graph arrays', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "name": "Company 1"
              },
              {
                "@type": "LocalBusiness",
                "name": "Business 1"
              }
            ]
          }
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas.length).toBe(2);
      expect(result.schemaTypes).toContain('Organization');
      expect(result.schemaTypes).toContain('LocalBusiness');
    });

    it('should recognize all supported schema types', () => {
      const types = ['Product', 'LocalBusiness', 'Organization', 'BlogPosting', 'FAQPage', 'BreadcrumbList'];

      for (const type of types) {
        const html = `
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "${type}",
              "name": "Test ${type}"
            }
          </script>
        `;
        const result = parseSchema(html);
        expect(result.schemaTypes).toContain(type);
      }
    });

    it('should handle malformed JSON-LD gracefully', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Test" // invalid comment
          }
        </script>
      `;
      const result = parseSchema(html);
      // Should not throw, but return empty schemas
      expect(result.schemaFound).toBe(false);
      expect(result.schemas.length).toBe(0);
    });

    it('should ignore non-JSON-LD scripts', () => {
      const html = `
        <script type="text/javascript">
          console.log('not a schema');
        </script>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Real Schema"
          }
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemas.length).toBe(1);
      expect(result.schemas[0].type).toBe('Organization');
    });
  });

  describe('Microdata parsing', () => {
    it('should parse Microdata with itemscope/itemtype/itemprop', () => {
      const html = `
        <div itemscope itemtype="https://schema.org/Organization">
          <span itemprop="name">Findably</span>
          <span itemprop="url">https://findably.com</span>
          <img itemprop="logo" src="https://findably.com/logo.png">
        </div>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas.length).toBeGreaterThan(0);
      expect(result.schemaTypes).toContain('Organization');
    });

    it('should extract Microdata properties correctly', () => {
      const html = `
        <div itemscope itemtype="https://schema.org/Product">
          <h1 itemprop="name">Product Name</h1>
          <p itemprop="description">Product description</p>
          <span itemprop="price">99.99</span>
        </div>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      const schema = result.schemas[0];
      expect(schema.type).toBe('Product');
      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).toHaveProperty('description');
    });

    it('should parse LocalBusiness Microdata', () => {
      const html = `
        <div itemscope itemtype="https://schema.org/LocalBusiness">
          <span itemprop="name">My Restaurant</span>
          <span itemprop="address">123 Main St</span>
          <span itemprop="telephone">555-1234</span>
        </div>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemaTypes).toContain('LocalBusiness');
    });

    it('should handle nested Microdata structures', () => {
      const html = `
        <div itemscope itemtype="https://schema.org/BlogPosting">
          <h1 itemprop="headline">Article Title</h1>
          <div itemprop="author" itemscope itemtype="https://schema.org/Person">
            <span itemprop="name">John Doe</span>
          </div>
          <span itemprop="datePublished">2026-03-11</span>
        </div>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemaTypes).toContain('BlogPosting');
    });
  });

  describe('Mixed JSON-LD and Microdata', () => {
    it('should parse both JSON-LD and Microdata in same HTML', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Company"
          }
        </script>
        <div itemscope itemtype="https://schema.org/Product">
          <span itemprop="name">Product</span>
        </div>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas.length).toBeGreaterThanOrEqual(1);
      expect(result.schemaTypes).toContain('Organization');
      expect(result.schemaTypes).toContain('Product');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty schema properties', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization"
          }
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas[0].type).toBe('Organization');
      expect(result.schemas[0].properties).toEqual({});
    });

    it('should normalize @type strings correctly', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Business"
          }
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemas[0].type).toBe('LocalBusiness');
    });

    it('should handle very large JSON-LD objects', () => {
      const largeObject = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': 'Large Product',
        'properties': Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`prop${i}`, `value${i}`])
        ),
      };
      const html = `
        <script type="application/ld+json">
          ${JSON.stringify(largeObject)}
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas[0].type).toBe('Product');
    });

    it('should deduplicate schema types in schemaTypes array', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Org 1"
          }
        </script>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Org 2"
          }
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemaTypes.filter(t => t === 'Organization').length).toBe(1);
    });

    it('should handle unrecognized schema types', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "CustomType",
            "name": "Custom"
          }
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas[0].type).toBe('CustomType');
      expect(result.schemaTypes).toContain('CustomType');
    });

    it('should handle schema with no @type property', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "name": "No type"
          }
        </script>
      `;
      const result = parseSchema(html);
      // Should skip schema without @type
      expect(result.schemas.length).toBe(0);
      expect(result.schemaFound).toBe(false);
    });

    it('should handle non-string @type values', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": ["Organization", "LocalBusiness"],
            "name": "Multiple Types"
          }
        </script>
      `;
      const result = parseSchema(html);
      // Should handle array types
      expect(result.schemaFound).toBe(true);
    });

    it('should handle scripts with extra whitespace and newlines', () => {
      const html = `
        <script type="application/ld+json">

          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Test"
          }

        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas.length).toBe(1);
    });

    it('should return schemaFound=false when no schema present', () => {
      const html = '<html><body><p>No schema here</p></body></html>';
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(false);
      expect(result.schemas.length).toBe(0);
      expect(result.schemaTypes.length).toBe(0);
    });
  });

  describe('Real-world HTML examples', () => {
    it('should parse actual e-commerce product page schema', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>iPhone 15 Pro</title>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "iPhone 15 Pro",
              "image": "https://example.com/iphone15.jpg",
              "description": "Latest Apple smartphone",
              "brand": {
                "@type": "Brand",
                "name": "Apple"
              },
              "offers": {
                "@type": "Offer",
                "url": "https://example.com/iphone15",
                "priceCurrency": "USD",
                "price": "999",
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.7",
                "ratingCount": "2500",
                "bestRating": "5",
                "worstRating": "1"
              }
            }
          </script>
        </head>
        </html>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemas[0].type).toBe('Product');
      expect(result.schemas[0].properties.name).toBe('iPhone 15 Pro');
      expect(result.schemaTypes).toContain('Product');
    });

    it('should parse blog post with author schema', () => {
      const html = `
        <article itemscope itemtype="https://schema.org/BlogPosting">
          <h1 itemprop="headline">Understanding AI Marketing</h1>
          <div itemprop="author" itemscope itemtype="https://schema.org/Person">
            <span itemprop="name">Jane Smith</span>
          </div>
          <span itemprop="datePublished">2026-03-11</span>
          <div itemprop="articleBody">
            <p>This is the article content...</p>
          </div>
        </article>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemaTypes).toContain('BlogPosting');
    });

    it('should parse FAQ page with QA schema', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does Findably work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Findably automatically analyzes your website..."
                }
              }
            ]
          }
        </script>
      `;
      const result = parseSchema(html);
      expect(result.schemaFound).toBe(true);
      expect(result.schemaTypes).toContain('FAQPage');
    });
  });

  describe('Return value contract', () => {
    it('should always return object with required fields', () => {
      const result = parseSchema('<html></html>');
      expect(result).toHaveProperty('schemas');
      expect(result).toHaveProperty('schemaFound');
      expect(result).toHaveProperty('schemaTypes');
      expect(Array.isArray(result.schemas)).toBe(true);
      expect(typeof result.schemaFound).toBe('boolean');
      expect(Array.isArray(result.schemaTypes)).toBe(true);
    });

    it('should return consistent schema structure', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Test"
          }
        </script>
      `;
      const result = parseSchema(html);
      const schema = result.schemas[0];
      expect(schema).toHaveProperty('type');
      expect(schema).toHaveProperty('properties');
      expect(typeof schema.type).toBe('string');
      expect(typeof schema.properties).toBe('object');
    });
  });
});
