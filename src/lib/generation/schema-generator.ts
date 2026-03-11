/**
 * Schema Markup (JSON-LD) Generator
 * Generates structured data (Schema.org) based on industry type and crawled website data.
 * Auto-maps crawled fields to schema properties and identifies missing required fields.
 */

import { type CrawlResult } from '../../types/crawl';

/**
 * Input parameters for schema generation
 */
export interface SchemaGeneratorInput {
  /** Website industry type */
  industry: 'ecommerce' | 'blog' | 'saas' | 'local_business' | 'other';
  /** Website URL */
  url: string;
  /** Crawled website data */
  crawlResult: CrawlResult;
  /** Optional field overrides for missing data */
  overrides?: {
    companyName?: string;
    phone?: string;
    address?: string;
    openingHours?: string[];
    price?: string;
    authorName?: string;
  };
}

/**
 * Single schema item in result
 */
export interface SchemaItem {
  type: string; // e.g., 'Organization', 'Product', 'BlogPosting'
  jsonLd: Record<string, unknown>; // JSON-LD object with @context and @type
}

/**
 * Schema generation result
 */
export interface SchemaGeneratorResult {
  /** Array of generated schema items */
  schemas: SchemaItem[];
  /** Complete <script> tag ready to embed in HTML */
  jsonLdScript: string;
  /** List of fields that could improve the schema (not blocking) */
  missingFields: string[];
}

/**
 * Validates that JSON-LD object has required @context and @type
 */
export function isValidJsonLd(jsonLd: unknown): boolean {
  if (typeof jsonLd !== 'object' || jsonLd === null) {
    return false;
  }

  const obj = jsonLd as Record<string, unknown>;
  return (
    typeof obj['@context'] === 'string' && typeof obj['@type'] === 'string'
  );
}

/**
 * Sanitize string for JSON encoding - remove problematic characters
 */
function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') {
    return '';
  }
  // Keep string as-is; JSON.stringify will handle escaping
  return str;
}

/**
 * Generate JSON-LD schemas based on industry and crawled data
 *
 * Industry mapping:
 * - ecommerce: Organization + Product
 * - blog: Organization + BlogPosting
 * - saas: Organization + WebApplication
 * - local_business: LocalBusiness
 * - other: Organization only
 *
 * Auto-maps:
 * - metaTags.title / metaTags.ogTitle → name/headline
 * - metaTags.description / metaTags.ogDescription → description
 * - metaTags.ogImage → logo/image
 * - url parameter → url
 */
export async function generateSchema(
  input: SchemaGeneratorInput,
): Promise<SchemaGeneratorResult> {
  const {
    industry,
    url,
    crawlResult,
    overrides = {},
  } = input;

  const schemas: SchemaItem[] = [];
  const missingFields: string[] = [];

  // Extract mapped values from crawl result
  const name =
    overrides.companyName ||
    sanitizeString(crawlResult.metaTags?.ogTitle) ||
    sanitizeString(crawlResult.metaTags?.title) ||
    '';

  const description =
    sanitizeString(crawlResult.metaTags?.ogDescription) ||
    sanitizeString(crawlResult.metaTags?.description) ||
    '';

  const logo =
    sanitizeString(crawlResult.metaTags?.ogImage) ||
    '';

  const phone = overrides.phone || '';
  const address = overrides.address || '';
  const authorName = overrides.authorName || '';
  const companySize = overrides.price || '';
  const openingHours = overrides.openingHours || [];

  // Track missing critical fields
  if (!name) {
    missingFields.push('회사명 (Company name)');
  }

  // --- Generate Organization schema (base for all non-LocalBusiness) ---
  if (industry !== 'local_business') {
    const orgSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: name || 'Organization',
      url: url,
    };

    // Add logo if available
    if (logo) {
      orgSchema.logo = logo;
    }

    // Add description if available
    if (description) {
      orgSchema.description = description;
    }

    // Add contact point if phone available
    if (phone) {
      orgSchema.contactPoint = {
        '@type': 'ContactPoint',
        telephone: phone,
        contactType: 'Customer Service',
      };
    }

    schemas.push({
      type: 'Organization',
      jsonLd: orgSchema,
    });
  }

  // --- Industry-specific schema generation ---

  if (industry === 'ecommerce') {
    // Product schema for e-commerce
    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name || 'Product',
      url: url,
    };

    if (logo) {
      productSchema.image = logo;
    }

    if (description) {
      productSchema.description = description;
    }

    if (companySize) {
      productSchema.offers = {
        '@type': 'Offer',
        url: url,
        priceCurrency: 'KRW',
        price: companySize,
      };
    }

    schemas.push({
      type: 'Product',
      jsonLd: productSchema,
    });

    if (!companySize) {
      missingFields.push('상품 가격 (Product price)');
    }
  } else if (industry === 'blog') {
    // BlogPosting schema for blogs
    const blogSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: name || 'Article',
      url: url,
    };

    if (description) {
      blogSchema.description = description;
    }

    if (logo) {
      blogSchema.image = logo;
    }

    if (authorName) {
      blogSchema.author = {
        '@type': 'Person',
        name: authorName,
      };
    }

    // Add datePublished if crawledAt exists
    blogSchema.datePublished = crawlResult.crawledAt?.toISOString() || new Date().toISOString();

    schemas.push({
      type: 'BlogPosting',
      jsonLd: blogSchema,
    });

    if (!authorName) {
      missingFields.push('저자명 (Author name)');
    }
  } else if (industry === 'saas') {
    // WebApplication schema for SaaS
    const appSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: name || 'Web Application',
      url: url,
      applicationCategory: 'WebApplication',
    };

    if (description) {
      appSchema.description = description;
    }

    if (logo) {
      appSchema.image = logo;
    }

    schemas.push({
      type: 'WebApplication',
      jsonLd: appSchema,
    });
  } else if (industry === 'local_business') {
    // LocalBusiness schema
    const businessSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: name || 'Business',
      url: url,
    };

    if (address) {
      businessSchema.address = {
        '@type': 'PostalAddress',
        streetAddress: address,
      };
    } else {
      missingFields.push('주소 (Address)');
    }

    if (phone) {
      businessSchema.telephone = phone;
    } else {
      missingFields.push('전화번호 (Phone)');
    }

    if (description) {
      businessSchema.description = description;
    }

    if (logo) {
      businessSchema.image = logo;
    }

    // Add opening hours if provided
    if (openingHours.length > 0) {
      businessSchema.openingHoursSpecification = openingHours.map(
        (hours) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: parseDayOfWeek(hours),
          opens: parseOpenTime(hours),
          closes: parseCloseTime(hours),
        }),
      ).filter(spec => spec.dayOfWeek && spec.opens && spec.closes);
    } else {
      missingFields.push('영업시간 (Opening hours)');
    }

    schemas.push({
      type: 'LocalBusiness',
      jsonLd: businessSchema,
    });
  }

  // --- other industry: Organization only (already added above) ---

  // Generate JSON-LD script tag
  const jsonLdArray = schemas.map((s) => s.jsonLd);
  const jsonLdContent = jsonLdArray.length === 1
    ? JSON.stringify(jsonLdArray[0], null, 2)
    : JSON.stringify(jsonLdArray, null, 2);

  const jsonLdScript = `<script type="application/ld+json">
${jsonLdContent}
</script>`;

  return {
    schemas,
    jsonLdScript,
    missingFields,
  };
}

/**
 * Helper: Parse day of week from opening hours string (e.g., "Mo-Fr 09:00-22:00")
 */
function parseDayOfWeek(hoursStr: string): string[] | null {
  // Simple parser for format like "Mo-Fr", "Sa", "Su", "Mo-Su", etc.
  const dayMap: Record<string, string> = {
    Mo: 'Monday',
    Tu: 'Tuesday',
    We: 'Wednesday',
    Th: 'Thursday',
    Fr: 'Friday',
    Sa: 'Saturday',
    Su: 'Sunday',
  };

  const match = hoursStr.match(/^([A-Za-z]+)(?:-([A-Za-z]+))?/);
  if (!match) return null;

  const startDay = dayMap[match[1]];
  if (!startDay) return null;

  if (match[2]) {
    // Range like "Mo-Fr"
    const endDay = dayMap[match[2]];
    if (!endDay) return [startDay];
    return [startDay, endDay];
  }

  return [startDay];
}

/**
 * Helper: Parse opening time from hours string (e.g., "09:00")
 */
function parseOpenTime(hoursStr: string): string | null {
  const match = hoursStr.match(/(\d{2}:\d{2})-/);
  return match ? match[1] : null;
}

/**
 * Helper: Parse closing time from hours string (e.g., "22:00")
 */
function parseCloseTime(hoursStr: string): string | null {
  const match = hoursStr.match(/-(\d{2}:\d{2})$/);
  return match ? match[1] : null;
}
