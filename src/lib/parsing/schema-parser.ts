/**
 * Schema.org Markup Parser Module
 * Extracts JSON-LD and Microdata schema markup from HTML
 * Pure function with no side effects
 */

import * as cheerio from 'cheerio';
import type { SchemaMarkupItem } from '@/types/crawl';

/**
 * Parse schema markup from HTML (JSON-LD + Microdata)
 *
 * @param html - Raw HTML string
 * @returns Object with parsed schemas and metadata
 */
export function parseSchema(html: unknown): {
  schemas: SchemaMarkupItem[];
  schemaFound: boolean;
  schemaTypes: string[];
} {
  // 안전한 입력 처리: null, undefined, 비문자열 타입
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    return {
      schemas: [],
      schemaFound: false,
      schemaTypes: [],
    };
  }

  try {
    const $ = cheerio.load(html);
    const schemas: SchemaMarkupItem[] = [];
    const schemaTypes = new Set<string>();

    // Parse JSON-LD schemas
    const jsonLdSchemas = parseJsonLD($);
    jsonLdSchemas.forEach(schema => {
      schemas.push(schema);
      if (schema.type) {
        schemaTypes.add(schema.type);
      }
    });

    // Parse Microdata schemas
    const microdataSchemas = parseMicrodata($);
    microdataSchemas.forEach(schema => {
      schemas.push(schema);
      if (schema.type) {
        schemaTypes.add(schema.type);
      }
    });

    return {
      schemas,
      schemaFound: schemas.length > 0,
      schemaTypes: Array.from(schemaTypes),
    };
  } catch {
    // HTML 파싱 실패시 기본값 반환
    return {
      schemas: [],
      schemaFound: false,
      schemaTypes: [],
    };
  }
}

/**
 * Parse JSON-LD scripts from HTML
 */
function parseJsonLD($: cheerio.CheerioAPI): SchemaMarkupItem[] {
  const schemas: SchemaMarkupItem[] = [];

  // Find all script[type="application/ld+json"] elements
  $('script[type="application/ld+json"]').each((_, el) => {
    const scriptContent = $(el).html();

    if (!scriptContent || typeof scriptContent !== 'string') {
      return;
    }

    try {
      // Parse JSON content
      const parsed: unknown = JSON.parse(scriptContent);

      // Handle @graph arrays
      if (isObject(parsed) && '@graph' in parsed && Array.isArray(parsed['@graph'])) {
        const graphArray = parsed['@graph'];
        for (const item of graphArray) {
          const schema = extractSchemaFromObject(item);
          if (schema) {
            schemas.push(schema);
          }
        }
      } else {
        // Single schema object
        const schema = extractSchemaFromObject(parsed);
        if (schema) {
          schemas.push(schema);
        }
      }
    } catch {
      // Skip malformed JSON-LD
    }
  });

  return schemas;
}

/**
 * Extract schema markup from a JSON object
 */
function extractSchemaFromObject(obj: unknown): SchemaMarkupItem | null {
  if (!isObject(obj)) {
    return null;
  }

  const typeValue = obj['@type'];

  // @type is required
  if (!typeValue) {
    return null;
  }

  // Handle @type as string or array
  let type: string;
  if (typeof typeValue === 'string') {
    type = typeValue;
  } else if (Array.isArray(typeValue) && typeValue.length > 0 && typeof typeValue[0] === 'string') {
    // Take first type if it's an array
    type = typeValue[0];
  } else {
    return null;
  }

  // Extract all properties except @context and @type
  const properties: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key !== '@context' && key !== '@type' && key !== '@graph') {
      properties[key] = value;
    }
  }

  return {
    type,
    properties,
  };
}

/**
 * Parse Microdata (itemscope, itemtype, itemprop) from HTML
 */
function parseMicrodata($: cheerio.CheerioAPI): SchemaMarkupItem[] {
  const schemas: SchemaMarkupItem[] = [];

  // Find all elements with itemscope attribute
  $('[itemscope]').each((_, el) => {
    const $el = $(el);
    const itemtype = $el.attr('itemtype');

    if (!itemtype) {
      return;
    }

    // Extract type from itemtype URL (e.g., "https://schema.org/Product" -> "Product")
    const type = extractTypeFromUrl(itemtype);

    if (!type) {
      return;
    }

    const properties: Record<string, unknown> = {};

    // Find all itemprop elements within this scope
    $el.find('[itemprop]').each((_, propEl) => {
      const $propEl = $(propEl);
      const propName = $propEl.attr('itemprop');

      if (!propName) {
        return;
      }

      // Get property value based on element type
      let propValue: unknown;

      const tagName = propEl.name.toLowerCase();
      if (tagName === 'img' || tagName === 'source') {
        propValue = $propEl.attr('src');
      } else if (tagName === 'a') {
        propValue = $propEl.attr('href');
      } else if (tagName === 'meta') {
        propValue = $propEl.attr('content');
      } else if (tagName === 'time') {
        propValue = $propEl.attr('datetime') || $propEl.text();
      } else {
        propValue = $propEl.text().trim();
      }

      // Only add if value exists
      if (propValue) {
        properties[propName] = propValue;
      }
    });

    schemas.push({
      type,
      properties,
    });
  });

  return schemas;
}

/**
 * Extract schema type from URL
 * https://schema.org/Product -> Product
 * https://schema.org/LocalBusiness -> LocalBusiness
 */
function extractTypeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const segments = path.split('/').filter(s => s.length > 0);

    if (segments.length > 0) {
      return segments[segments.length - 1];
    }

    return null;
  } catch {
    // If not a valid URL, try to extract from string
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart || null;
  }
}

/**
 * Type guard for object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
