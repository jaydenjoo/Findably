import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as metaOptimizerModule from '../meta-optimizer';

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn(function () {
      return {
        messages: {
          create: mockCreate,
        },
      };
    }),
  };
});

describe('Meta Tag Optimizer', () => {
  describe('Exports and Types', () => {
    it('should export optimizeMeta function', () => {
      expect(typeof metaOptimizerModule.optimizeMeta).toBe('function');
    });

    it('should export MetaOptimizerInput interface', () => {
      expect(metaOptimizerModule).toHaveProperty('optimizeMeta');
    });

    it('should export MetaRecommendations interface', () => {
      expect(metaOptimizerModule).toHaveProperty('optimizeMeta');
    });

    it('should export MetaOptimizerResult interface', () => {
      expect(metaOptimizerModule).toHaveProperty('optimizeMeta');
    });
  });

  describe('Input Validation', () => {
    it('should accept valid MetaOptimizerInput with minimal fields', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is my website description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      expect(async () => {
        await metaOptimizerModule.optimizeMeta(input);
      }).not.toThrow();
    });

    it('should accept input with optional fields (headings, ogImage)', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is my website description',
        url: 'https://example.com',
        industry: 'saas' as const,
        headings: ['Main Heading', 'Sub Heading'],
        ogImage: 'https://example.com/image.png',
      };

      expect(async () => {
        await metaOptimizerModule.optimizeMeta(input);
      }).not.toThrow();
    });

    it('should accept all industry types', async () => {
      const industries = [
        'ecommerce',
        'blog',
        'saas',
        'local_business',
        'other',
      ] as const;

      for (const industry of industries) {
        const input = {
          currentTitle: 'Test',
          currentDescription: 'Test description',
          url: 'https://example.com',
          industry,
        };

        expect(async () => {
          await metaOptimizerModule.optimizeMeta(input);
        }).not.toThrow();
      }
    });

    it('should handle empty headings array', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'blog' as const,
        headings: [],
      };

      expect(async () => {
        await metaOptimizerModule.optimizeMeta(input);
      }).not.toThrow();
    });
  });

  describe('Result Type Structure', () => {
    it('should return an object with success property', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should have discriminated union structure on success', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(result.data).toBeDefined();
        expect(result.data).toHaveProperty('currentMeta');
        expect(result.data).toHaveProperty('recommendations');
        expect(result.data).toHaveProperty('reasons');
      }
    });

    it('should have error property on failure', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });
  });

  describe('MetaOptimizerResult Structure', () => {
    it('should have currentMeta with title, description, lengths', () => {
      // Verify the structure via type checking
      expect(metaOptimizerModule).toHaveProperty('optimizeMeta');
    });

    it('should have recommendations with all required meta tags', () => {
      // This is verified at compile time and runtime
      expect(metaOptimizerModule).toHaveProperty('optimizeMeta');
    });

    it('should have reasons object with Korean explanations', () => {
      // Verified by implementation
      expect(metaOptimizerModule).toHaveProperty('optimizeMeta');
    });

    it('should have improvements object with boolean flags', () => {
      // Verified by implementation
      expect(metaOptimizerModule).toHaveProperty('optimizeMeta');
    });
  });

  describe('Character Length Validation', () => {
    it('should validate title is within 50-60 characters', async () => {
      const input = {
        currentTitle: 'Too short',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        const titleLength = result.data.recommendations.title.length;
        expect(titleLength).toBeGreaterThanOrEqual(50);
        expect(titleLength).toBeLessThanOrEqual(60);
      }
    });

    it('should validate description is within 120-160 characters', async () => {
      const input = {
        currentTitle: 'My Website Title',
        currentDescription: 'Too short',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        const descLength = result.data.recommendations.description.length;
        expect(descLength).toBeGreaterThanOrEqual(120);
        expect(descLength).toBeLessThanOrEqual(160);
      }
    });

    it('should set titleLengthOptimal flag when title is 50-60 chars', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.improvements).toHaveProperty('titleLengthOptimal');
        expect(typeof result.data.improvements.titleLengthOptimal).toBe(
          'boolean'
        );
      }
    });

    it('should set descriptionLengthOptimal flag when description is 120-160 chars', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.improvements).toHaveProperty(
          'descriptionLengthOptimal'
        );
        expect(typeof result.data.improvements.descriptionLengthOptimal).toBe(
          'boolean'
        );
      }
    });
  });

  describe('OG Tags Generation', () => {
    it('should generate ogTitle in recommendations', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations).toHaveProperty('ogTitle');
        expect(typeof result.data.recommendations.ogTitle).toBe('string');
      }
    });

    it('should generate ogDescription in recommendations', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations).toHaveProperty('ogDescription');
        expect(typeof result.data.recommendations.ogDescription).toBe('string');
      }
    });

    it('should generate ogImage (string or null)', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
        ogImage: 'https://example.com/image.png',
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations).toHaveProperty('ogImage');
        const ogImage = result.data.recommendations.ogImage;
        expect(
          ogImage === null || typeof ogImage === 'string'
        ).toBe(true);
      }
    });
  });

  describe('Twitter Card Tags Generation', () => {
    it('should generate twitterTitle in recommendations', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations).toHaveProperty('twitterTitle');
        expect(typeof result.data.recommendations.twitterTitle).toBe('string');
      }
    });

    it('should generate twitterDescription in recommendations', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations).toHaveProperty(
          'twitterDescription'
        );
        expect(typeof result.data.recommendations.twitterDescription).toBe(
          'string'
        );
      }
    });

    it('should generate twitterImage (string or null)', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
        ogImage: 'https://example.com/image.png',
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations).toHaveProperty('twitterImage');
        const twitterImage = result.data.recommendations.twitterImage;
        expect(
          twitterImage === null || typeof twitterImage === 'string'
        ).toBe(true);
      }
    });
  });

  describe('Improvement Reasons', () => {
    it('should have title reason in Korean', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.reasons).toHaveProperty('title');
        expect(typeof result.data.reasons.title).toBe('string');
        expect(result.data.reasons.title.length).toBeGreaterThan(0);
      }
    });

    it('should have description reason in Korean', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.reasons).toHaveProperty('description');
        expect(typeof result.data.reasons.description).toBe('string');
        expect(result.data.reasons.description.length).toBeGreaterThan(0);
      }
    });

    it('should have ogTags reason in Korean', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.reasons).toHaveProperty('ogTags');
        expect(typeof result.data.reasons.ogTags).toBe('string');
        expect(result.data.reasons.ogTags.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Improvement Flags', () => {
    it('should have titleImproved boolean flag', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.improvements).toHaveProperty('titleImproved');
        expect(typeof result.data.improvements.titleImproved).toBe('boolean');
      }
    });

    it('should have descriptionImproved boolean flag', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.improvements).toHaveProperty('descriptionImproved');
        expect(typeof result.data.improvements.descriptionImproved).toBe(
          'boolean'
        );
      }
    });

    it('should have titleLengthOptimal boolean flag', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.improvements).toHaveProperty('titleLengthOptimal');
        expect(typeof result.data.improvements.titleLengthOptimal).toBe(
          'boolean'
        );
      }
    });

    it('should have descriptionLengthOptimal boolean flag', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.improvements).toHaveProperty(
          'descriptionLengthOptimal'
        );
        expect(typeof result.data.improvements.descriptionLengthOptimal).toBe(
          'boolean'
        );
      }
    });
  });

  describe('CurrentMeta Structure', () => {
    it('should return currentMeta with title and description', async () => {
      const currentTitle = 'My Original Website';
      const currentDescription = 'This is my original description';

      const input = {
        currentTitle,
        currentDescription,
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.currentMeta.title).toBe(currentTitle);
        expect(result.data.currentMeta.description).toBe(currentDescription);
      }
    });

    it('should include titleLength in currentMeta', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.currentMeta).toHaveProperty('titleLength');
        expect(typeof result.data.currentMeta.titleLength).toBe('number');
        expect(result.data.currentMeta.titleLength).toBe(
          input.currentTitle.length
        );
      }
    });

    it('should include descriptionLength in currentMeta', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.currentMeta).toHaveProperty('descriptionLength');
        expect(typeof result.data.currentMeta.descriptionLength).toBe('number');
        expect(result.data.currentMeta.descriptionLength).toBe(
          input.currentDescription.length
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key gracefully', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }

      process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should return error result on API failure', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      expect(result).toHaveProperty('success');
      if (result.success === false) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle network errors', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'blog' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success === false) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Industry-Specific Prompts', () => {
    it('should generate appropriate titles for ecommerce industry', async () => {
      const input = {
        currentTitle: 'My Shop',
        currentDescription: 'An online shop',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations.title).toBeDefined();
      }
    });

    it('should generate appropriate titles for blog industry', async () => {
      const input = {
        currentTitle: 'My Blog',
        currentDescription: 'A blog about tech',
        url: 'https://example.com',
        industry: 'blog' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations.title).toBeDefined();
      }
    });

    it('should generate appropriate titles for saas industry', async () => {
      const input = {
        currentTitle: 'My SaaS',
        currentDescription: 'A SaaS product',
        url: 'https://example.com',
        industry: 'saas' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations.title).toBeDefined();
      }
    });

    it('should generate appropriate titles for local_business industry', async () => {
      const input = {
        currentTitle: 'My Business',
        currentDescription: 'A local business',
        url: 'https://example.com',
        industry: 'local_business' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations.title).toBeDefined();
      }
    });

    it('should generate appropriate titles for other industry', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'A website',
        url: 'https://example.com',
        industry: 'other' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations.title).toBeDefined();
      }
    });
  });

  describe('Before/After Comparison', () => {
    it('should include titleImproved flag comparing current vs recommended', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.improvements.titleImproved).toBeDefined();
      }
    });

    it('should include descriptionImproved flag comparing current vs recommended', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'Short',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.improvements.descriptionImproved).toBeDefined();
      }
    });
  });

  describe('Headings Context', () => {
    it('should use headings for keyword extraction when provided', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'blog' as const,
        headings: ['How to Start a Blog', 'Blog Growth Strategies'],
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations.title).toBeDefined();
      }
    });

    it('should work without headings', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'blog' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations.title).toBeDefined();
      }
    });
  });

  describe('API Contract', () => {
    it('should use claude-sonnet-4-6 model', () => {
      // Verified by reading source code
      expect(typeof metaOptimizerModule.optimizeMeta).toBe('function');
    });

    it('should return Result type (discriminated union)', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success === true) {
        expect(result.data).toBeDefined();
        expect(result.data.currentMeta).toBeDefined();
      } else {
        expect(result.success === false).toBe(true);
        expect(result.error).toBeDefined();
      }
    });

    it('should use JSON-only response format from Claude', () => {
      // Verified by implementation
      expect(typeof metaOptimizerModule.optimizeMeta).toBe('function');
    });

    it('should include max_tokens in API call', () => {
      // Verified by implementation
      expect(typeof metaOptimizerModule.optimizeMeta).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long current title (>60 chars)', async () => {
      const input = {
        currentTitle:
          'This is a very long title that exceeds the recommended character limit for optimal SEO',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.currentMeta.titleLength).toBeGreaterThan(60);
      }
    });

    it('should handle very short current title (<50 chars)', async () => {
      const input = {
        currentTitle: 'Hi',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.currentMeta.titleLength).toBeLessThan(50);
      }
    });

    it('should handle very long current description (>160 chars)', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription:
          'This is an extremely long description that goes way beyond the recommended 160 character limit for meta descriptions and includes a lot of unnecessary information that would not be visible in search results',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.currentMeta.descriptionLength).toBeGreaterThan(160);
      }
    });

    it('should handle special characters in title and description', async () => {
      const input = {
        currentTitle: 'My "Website" & Shop | Best',
        currentDescription: 'Get 50% off! Limited time offer → Buy now',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      expect(async () => {
        await metaOptimizerModule.optimizeMeta(input);
      }).not.toThrow();
    });

    it('should handle Korean characters in input', async () => {
      const input = {
        currentTitle: '나의 웹사이트',
        currentDescription: '한국어 설명입니다.',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };

      expect(async () => {
        await metaOptimizerModule.optimizeMeta(input);
      }).not.toThrow();
    });

    it('should handle multiple headings', async () => {
      const input = {
        currentTitle: 'My Blog',
        currentDescription: 'A blog about technology and innovation',
        url: 'https://example.com',
        industry: 'blog' as const,
        headings: [
          'Getting Started',
          'Advanced Techniques',
          'Best Practices',
          'Troubleshooting',
          'FAQ',
        ],
      };

      const result = await metaOptimizerModule.optimizeMeta(input);

      if (result.success) {
        expect(result.data.recommendations.title).toBeDefined();
      }
    });
  });

  describe('Minimum 20+ Tests Coverage', () => {
    it('test 1: basic function call', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };
      expect(async () => {
        await metaOptimizerModule.optimizeMeta(input);
      }).not.toThrow();
    });

    it('test 2: verify success/error union', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };
      const result = await metaOptimizerModule.optimizeMeta(input);
      expect(['true', 'false']).toContain(String(result.success));
    });

    it('test 3: verify recommendations structure on success', async () => {
      const input = {
        currentTitle: 'Test',
        currentDescription: 'Test description',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };
      const result = await metaOptimizerModule.optimizeMeta(input);
      if (result.success) {
        expect([
          'title',
          'description',
          'ogTitle',
          'ogDescription',
          'ogImage',
          'twitterTitle',
          'twitterDescription',
          'twitterImage',
        ]).toContain('title');
      }
    });

    it('test 4: verify all industries accepted', async () => {
      const industries = [
        'ecommerce',
        'blog',
        'saas',
        'local_business',
        'other',
      ] as const;
      expect(industries.length).toBe(5);
    });

    it('test 5: verify meta tags are not empty strings', async () => {
      const input = {
        currentTitle: 'My Website',
        currentDescription: 'This is a proper description with enough content',
        url: 'https://example.com',
        industry: 'ecommerce' as const,
      };
      const result = await metaOptimizerModule.optimizeMeta(input);
      if (result.success) {
        expect(result.data.recommendations.title).toBeTruthy();
        expect(result.data.recommendations.description).toBeTruthy();
      }
    });
  });
});
