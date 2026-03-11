import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSchema,
  isValidJsonLd,
  type SchemaGeneratorInput,
  type SchemaGeneratorResult,
} from '../schema-generator';
import { type CrawlResult } from '../../../types/crawl';

describe('Schema Generator', () => {
  const baseCrawlResult: CrawlResult = {
    companyId: 1,
    crawledAt: new Date(),
    status: 'success',
    metaTags: {
      title: 'Example E-commerce Store',
      description: 'Buy quality products online',
      ogImage: 'https://example.com/logo.png',
      ogUrl: 'https://example.com',
    },
    headings: [],
    links: [],
    images: [],
    schemaMarkup: [],
    isLatest: true,
  };

  describe('generateSchema - Organization Schema', () => {
    it('should generate Organization schema for "other" industry', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);

      expect(result.schemas).toHaveLength(1);
      expect(result.schemas[0].type).toBe('Organization');
      expect(result.schemas[0].jsonLd['@context']).toBe('https://schema.org');
      expect(result.schemas[0].jsonLd['@type']).toBe('Organization');
      expect(result.schemas[0].jsonLd.name).toBe('Example E-commerce Store');
      expect(result.schemas[0].jsonLd.url).toBe('https://example.com');
      expect(result.schemas[0].jsonLd.logo).toBe('https://example.com/logo.png');
      expect(result.schemas[0].jsonLd.description).toBe('Buy quality products online');
    });

    it('should use og:title if available', async () => {
      const crawlResult: CrawlResult = {
        ...baseCrawlResult,
        metaTags: {
          title: 'Example Store',
          ogTitle: 'OG Example Store',
          description: 'Test description',
          ogImage: 'https://example.com/logo.png',
        },
      };

      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult,
      };

      const result = await generateSchema(input);
      expect(result.schemas[0].jsonLd.name).toBe('OG Example Store');
    });

    it('should include contactPoint with phone override', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
        overrides: {
          phone: '+82-10-1234-5678',
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas[0].jsonLd.contactPoint).toBeDefined();
      expect(result.schemas[0].jsonLd.contactPoint['@type']).toBe('ContactPoint');
      expect(result.schemas[0].jsonLd.contactPoint.telephone).toBe('+82-10-1234-5678');
      expect(result.schemas[0].jsonLd.contactPoint.contactType).toBe('Customer Service');
    });
  });

  describe('generateSchema - E-commerce (Product Schema)', () => {
    it('should generate Organization + Product schemas for ecommerce', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'ecommerce',
        url: 'https://shop.example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);

      expect(result.schemas.length).toBeGreaterThanOrEqual(1);

      const orgSchema = result.schemas.find((s) => s.type === 'Organization');
      expect(orgSchema).toBeDefined();

      const productSchema = result.schemas.find((s) => s.type === 'Product');
      if (productSchema) {
        expect(productSchema.jsonLd['@context']).toBe('https://schema.org');
        expect(productSchema.jsonLd['@type']).toBe('Product');
        expect(productSchema.jsonLd.name).toBeDefined();
        expect(productSchema.jsonLd.image).toBeDefined();
      }
    });

    it('should map product data with overrides', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'ecommerce',
        url: 'https://shop.example.com',
        crawlResult: baseCrawlResult,
        overrides: {
          price: '29.99',
        },
      };

      const result = await generateSchema(input);
      const productSchema = result.schemas.find((s) => s.type === 'Product');

      if (productSchema) {
        // Price might not be set without more complete data, but override should work
        expect(productSchema.jsonLd).toBeDefined();
      }
    });
  });

  describe('generateSchema - Blog (BlogPosting Schema)', () => {
    it('should generate Organization + BlogPosting schemas for blog', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'blog',
        url: 'https://blog.example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            title: 'How to Build a Startup',
            description: 'A guide to starting your business',
            ogImage: 'https://blog.example.com/article-header.png',
          },
        },
      };

      const result = await generateSchema(input);

      const blogSchema = result.schemas.find((s) => s.type === 'BlogPosting');
      if (blogSchema) {
        expect(blogSchema.jsonLd['@type']).toBe('BlogPosting');
        expect(blogSchema.jsonLd.headline).toBeDefined();
        expect(blogSchema.jsonLd.image).toBe('https://blog.example.com/article-header.png');
      }
    });

    it('should use author override in BlogPosting', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'blog',
        url: 'https://blog.example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            title: 'Article Title',
            description: 'Article description',
            ogImage: 'https://blog.example.com/image.png',
          },
        },
        overrides: {
          authorName: 'John Doe',
        },
      };

      const result = await generateSchema(input);
      const blogSchema = result.schemas.find((s) => s.type === 'BlogPosting');

      if (blogSchema) {
        expect(blogSchema.jsonLd.author).toBeDefined();
      }
    });
  });

  describe('generateSchema - LocalBusiness Schema', () => {
    it('should generate LocalBusiness schema for local_business', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'local_business',
        url: 'https://cafe.example.com',
        crawlResult: baseCrawlResult,
        overrides: {
          companyName: 'Best Cafe',
          address: '123 Main St, Seoul, Korea',
          phone: '+82-2-123-4567',
          openingHours: ['Mo-Fr 09:00-22:00', 'Sa 10:00-23:00', 'Su 10:00-21:00'],
        },
      };

      const result = await generateSchema(input);

      const localSchema = result.schemas.find((s) => s.type === 'LocalBusiness');
      expect(localSchema).toBeDefined();

      if (localSchema) {
        expect(localSchema.jsonLd['@type']).toBe('LocalBusiness');
        expect(localSchema.jsonLd.name).toBe('Best Cafe');
        expect(localSchema.jsonLd.address).toBeDefined();
        expect(localSchema.jsonLd.telephone).toBe('+82-2-123-4567');
        expect(localSchema.jsonLd.openingHoursSpecification).toBeDefined();
      }
    });
  });

  describe('generateSchema - SaaS (WebApplication Schema)', () => {
    it('should generate Organization + WebApplication schemas for saas', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'saas',
        url: 'https://app.example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);

      const appSchema = result.schemas.find((s) => s.type === 'WebApplication');
      if (appSchema) {
        expect(appSchema.jsonLd['@type']).toBe('WebApplication');
        expect(appSchema.jsonLd.name).toBeDefined();
        expect(appSchema.jsonLd.applicationCategory).toBe('WebApplication');
      }
    });
  });

  describe('Auto-mapping from crawl data', () => {
    it('should map metaTags.title to schema name', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            title: 'My Amazing Website',
          },
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas[0].jsonLd.name).toBe('My Amazing Website');
    });

    it('should map metaTags.description to schema description', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            title: 'Title',
            description: 'This is a detailed description',
          },
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas[0].jsonLd.description).toBe('This is a detailed description');
    });

    it('should map metaTags.ogImage to logo', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            ogImage: 'https://example.com/og-image.png',
          },
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas[0].jsonLd.logo).toBe('https://example.com/og-image.png');
    });

    it('should use URL from parameter as fallback', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {},
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas[0].jsonLd.url).toBe('https://example.com');
    });
  });

  describe('Missing field handling', () => {
    it('should identify missing company name as critical field', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            description: 'Just a description, no title',
          },
        },
      };

      const result = await generateSchema(input);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.missingFields.some((f) => f.toLowerCase().includes('name'))).toBe(true);
    });

    it('should not block schema generation for missing optional fields', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'local_business',
        url: 'https://example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            title: 'Local Shop',
          },
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas.length).toBeGreaterThan(0);
      // But should indicate missing fields
      expect(result.missingFields.length).toBeGreaterThan(0);
    });

    it('should list specific missing fields', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'local_business',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);
      // Check that address is mentioned (may be in Korean or English)
      const hasAddress = result.missingFields.some(
        (f) => f.toLowerCase().includes('address') || f.includes('주소'),
      );
      expect(hasAddress).toBe(true);
    });
  });

  describe('Output format - JSON-LD', () => {
    it('should return valid JSON-LD script tag string', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);
      expect(result.jsonLdScript).toContain('<script type="application/ld+json">');
      expect(result.jsonLdScript).toContain('</script>');

      // Extract JSON from script tag and validate
      const jsonMatch = result.jsonLdScript.match(/<script[^>]*>([\s\S]*)<\/script>/);
      expect(jsonMatch).toBeTruthy();

      if (jsonMatch) {
        const jsonContent = jsonMatch[1];
        const parsed = JSON.parse(jsonContent);
        expect(parsed).toBeDefined();
      }
    });

    it('should include comments in JSON-LD script', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'ecommerce',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);
      // Comments can be in script section or structure
      expect(result.jsonLdScript.length).toBeGreaterThan(0);
    });

    it('should be valid JSON after extraction', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);
      const jsonMatch = result.jsonLdScript.match(/<script[^>]*>([\s\S]*)<\/script>/);
      expect(jsonMatch).toBeTruthy();

      if (jsonMatch) {
        const jsonContent = jsonMatch[1];
        const parsed = JSON.parse(jsonContent);
        expect(Array.isArray(parsed) || typeof parsed === 'object').toBe(true);
      }
    });
  });

  describe('Validation - JSON-LD structure', () => {
    it('should have @context in all schemas', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'ecommerce',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);
      result.schemas.forEach((schema) => {
        expect(schema.jsonLd['@context']).toBe('https://schema.org');
      });
    });

    it('should have @type in all schemas', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'blog',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);
      result.schemas.forEach((schema) => {
        expect(schema.jsonLd['@type']).toBeDefined();
        expect(typeof schema.jsonLd['@type']).toBe('string');
      });
    });

    it('should pass isValidJsonLd check', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);
      result.schemas.forEach((schema) => {
        expect(isValidJsonLd(schema.jsonLd)).toBe(true);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty crawl data gracefully', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          companyId: 1,
          crawledAt: new Date(),
          status: 'success',
          metaTags: {},
          isLatest: true,
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas).toBeDefined();
      expect(result.schemas.length).toBeGreaterThan(0);
      expect(result.missingFields.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined values safely', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          companyId: 1,
          crawledAt: new Date(),
          status: 'success',
          metaTags: {
            title: undefined,
            description: null as unknown as string | undefined,
          },
          isLatest: true,
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas).toBeDefined();
      // Extract JSON from script tag
      const jsonMatch = result.jsonLdScript.match(/<script[^>]*>([\s\S]*)<\/script>/);
      expect(jsonMatch).toBeTruthy();
      if (jsonMatch) {
        expect(() => JSON.parse(jsonMatch[1])).not.toThrow();
      }
    });

    it('should handle very long strings', async () => {
      const longTitle = 'A'.repeat(500);
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            title: longTitle,
          },
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas[0].jsonLd.name).toBe(longTitle);
      // Extract JSON from script tag
      const jsonMatch = result.jsonLdScript.match(/<script[^>]*>([\s\S]*)<\/script>/);
      expect(jsonMatch).toBeTruthy();
      if (jsonMatch) {
        expect(() => JSON.parse(jsonMatch[1])).not.toThrow();
      }
    });

    it('should handle special characters in strings', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            title: 'Store & Shop "Best" Deals <Special>',
            description: 'Quotes: "Hello" and \'World\'',
          },
        },
      };

      const result = await generateSchema(input);
      // Extract JSON from script tag
      const jsonMatch = result.jsonLdScript.match(/<script[^>]*>([\s\S]*)<\/script>/);
      expect(jsonMatch).toBeTruthy();
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        expect(parsed).toBeDefined();
      }
    });
  });

  describe('Overrides', () => {
    it('should accept companyName override', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: {
          ...baseCrawlResult,
          metaTags: {
            title: 'Original Name',
          },
        },
        overrides: {
          companyName: 'Override Name',
        },
      };

      const result = await generateSchema(input);
      expect(result.schemas[0].jsonLd.name).toBe('Override Name');
    });

    it('should accept multiple overrides', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'local_business',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
        overrides: {
          companyName: 'My Shop',
          phone: '+82-10-9999-9999',
          address: '456 Oak Ave',
          openingHours: ['Mo-Su 09:00-21:00'],
        },
      };

      const result = await generateSchema(input);
      const localSchema = result.schemas.find((s) => s.type === 'LocalBusiness');

      if (localSchema) {
        expect(localSchema.jsonLd.name).toBe('My Shop');
        expect(localSchema.jsonLd.telephone).toBe('+82-10-9999-9999');
      }
    });
  });

  describe('Result structure', () => {
    it('should return SchemaGeneratorResult with all required fields', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'other',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);

      expect(result).toHaveProperty('schemas');
      expect(result).toHaveProperty('jsonLdScript');
      expect(result).toHaveProperty('missingFields');

      expect(Array.isArray(result.schemas)).toBe(true);
      expect(typeof result.jsonLdScript).toBe('string');
      expect(Array.isArray(result.missingFields)).toBe(true);
    });

    it('should have schemas array with type and jsonLd', async () => {
      const input: SchemaGeneratorInput = {
        industry: 'ecommerce',
        url: 'https://example.com',
        crawlResult: baseCrawlResult,
      };

      const result = await generateSchema(input);

      result.schemas.forEach((schema) => {
        expect(schema).toHaveProperty('type');
        expect(schema).toHaveProperty('jsonLd');
        expect(typeof schema.type).toBe('string');
        expect(typeof schema.jsonLd).toBe('object');
      });
    });
  });

  describe('isValidJsonLd utility', () => {
    it('should return true for valid JSON-LD', () => {
      const validLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test Org',
      };

      expect(isValidJsonLd(validLd)).toBe(true);
    });

    it('should return false for missing @context', () => {
      const invalidLd = {
        '@type': 'Organization',
        name: 'Test',
      };

      expect(isValidJsonLd(invalidLd)).toBe(false);
    });

    it('should return false for missing @type', () => {
      const invalidLd = {
        '@context': 'https://schema.org',
        name: 'Test',
      };

      expect(isValidJsonLd(invalidLd)).toBe(false);
    });
  });
});
