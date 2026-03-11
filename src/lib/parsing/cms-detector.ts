/**
 * CMS Detector Module
 * Detects CMS platforms from raw HTML content
 * Pure function with no side effects
 *
 * Supported CMS:
 * - WordPress, Shopify, WIX
 * - Cafe24 (카페24), GodoMall (고도몰), Imweb (아임웹)
 * - Blogger, Medium, Unknown
 */

import * as cheerio from 'cheerio';

/**
 * CMS detection result
 */
export interface CmsDetectionResult {
  cms:
    | 'WordPress'
    | 'Shopify'
    | 'WIX'
    | 'Cafe24'
    | 'GodoMall'
    | 'Imweb'
    | 'Blogger'
    | 'Medium'
    | 'Unknown';
  confidence: number; // 0-100
}

/**
 * Detect CMS platform from HTML content
 * Uses multiple signals: meta generator, script/link paths, class/id patterns, domain
 * Meta generator tag has highest priority and confidence (90-100)
 * Domain-based detection has medium-high confidence (75-85)
 * Script/class/id patterns have medium confidence (50-70)
 *
 * @param html - Raw HTML string
 * @returns CMS detection result with platform name and confidence score
 */
export function detectCms(html: unknown): CmsDetectionResult {
  // 안전한 입력 처리: null, undefined, 비문자열 타입
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    return {
      cms: 'Unknown',
      confidence: 0,
    };
  }

  try {
    const $ = cheerio.load(html);

    // 1. Meta generator tag (highest confidence: 90-100)
    const generatorResult = detectFromMetaGenerator($);
    if (generatorResult) {
      return generatorResult;
    }

    // 2. Domain-based detection (medium-high confidence: 75-85)
    const domainResult = detectFromDomain($);
    if (domainResult) {
      return domainResult;
    }

    // 3. Script/Link path patterns (medium confidence: 50-70)
    const pathResult = detectFromPaths($);
    if (pathResult) {
      return pathResult;
    }

    // 4. Class/ID patterns (lower confidence: 40-60)
    const classIdResult = detectFromClassesIds($);
    if (classIdResult) {
      return classIdResult;
    }

    // 5. Default: Unknown
    return {
      cms: 'Unknown',
      confidence: 0,
    };
  } catch {
    // HTML 파싱 실패 시 Unknown 반환
    return {
      cms: 'Unknown',
      confidence: 0,
    };
  }
}

/**
 * Detect CMS from meta[name="generator"] tag (highest confidence: 90-100)
 */
function detectFromMetaGenerator(
  $: cheerio.CheerioAPI
): CmsDetectionResult | null {
  const generator = $('meta[name="generator"]').attr('content');

  if (!generator) {
    return null;
  }

  const generatorLower = generator.toLowerCase().trim();

  // WordPress detection
  if (generatorLower.includes('wordpress')) {
    return {
      cms: 'WordPress',
      confidence: 95,
    };
  }

  // Shopify detection
  if (generatorLower.includes('shopify')) {
    return {
      cms: 'Shopify',
      confidence: 95,
    };
  }

  // WIX detection
  if (generatorLower.includes('wix')) {
    return {
      cms: 'WIX',
      confidence: 95,
    };
  }

  // Cafe24 detection
  if (generatorLower.includes('cafe24')) {
    return {
      cms: 'Cafe24',
      confidence: 95,
    };
  }

  // GodoMall detection
  if (generatorLower.includes('godo')) {
    return {
      cms: 'GodoMall',
      confidence: 95,
    };
  }

  // Imweb detection
  if (generatorLower.includes('imweb')) {
    return {
      cms: 'Imweb',
      confidence: 95,
    };
  }

  // Blogger detection
  if (generatorLower.includes('blogger')) {
    return {
      cms: 'Blogger',
      confidence: 95,
    };
  }

  // Medium detection
  if (generatorLower.includes('medium')) {
    return {
      cms: 'Medium',
      confidence: 95,
    };
  }

  return null;
}

/**
 * Detect CMS from URL/domain patterns (medium-high confidence: 75-85)
 */
function detectFromDomain($: cheerio.CheerioAPI): CmsDetectionResult | null {
  // og:url이나 canonical link에서 도메인 추출
  const ogUrl =
    $('meta[property="og:url"]').attr('content') ||
    $('link[rel="canonical"]').attr('href') ||
    '';

  if (!ogUrl) {
    return null;
  }

  const urlLower = ogUrl.toLowerCase();

  // Shopify: myshopify.com domain
  if (urlLower.includes('myshopify.com')) {
    return {
      cms: 'Shopify',
      confidence: 82,
    };
  }

  // Cafe24: cafe24.com domain
  if (urlLower.includes('cafe24.com')) {
    return {
      cms: 'Cafe24',
      confidence: 82,
    };
  }

  // GodoMall: godohosting.com domain
  if (urlLower.includes('godohosting.com')) {
    return {
      cms: 'GodoMall',
      confidence: 82,
    };
  }

  // Imweb: imweb.me domain
  if (urlLower.includes('imweb.me')) {
    return {
      cms: 'Imweb',
      confidence: 82,
    };
  }

  // Blogger: blogspot.com domain
  if (urlLower.includes('blogspot.com')) {
    return {
      cms: 'Blogger',
      confidence: 80,
    };
  }

  // Medium: medium.com domain
  if (urlLower.includes('medium.com')) {
    return {
      cms: 'Medium',
      confidence: 80,
    };
  }

  return null;
}

/**
 * Detect CMS from script/link paths and data attributes (medium confidence: 50-70)
 */
function detectFromPaths($: cheerio.CheerioAPI): CmsDetectionResult | null {
  // 모든 script src와 link href 수집
  const urls: string[] = [];

  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      urls.push(src.toLowerCase());
    }
  });

  $('link[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      urls.push(href.toLowerCase());
    }
  });

  // img src도 포함
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      urls.push(src.toLowerCase());
    }
  });

  // WordPress patterns
  if (urls.some((url) => url.includes('/wp-content/') ||
    url.includes('/wp-includes/') ||
    url.includes('/wp-json/'))) {
    return {
      cms: 'WordPress',
      confidence: 65,
    };
  }

  // Shopify patterns
  if (urls.some((url) => url.includes('/cdn/shop/'))) {
    return {
      cms: 'Shopify',
      confidence: 65,
    };
  }

  // WIX patterns
  if (urls.some((url) => url.includes('/wix/') || url.includes('wix.com'))) {
    return {
      cms: 'WIX',
      confidence: 65,
    };
  }

  // Cafe24 patterns
  if (urls.some((url) => url.includes('/echost/') || url.includes('/shop/'))) {
    return {
      cms: 'Cafe24',
      confidence: 65,
    };
  }

  // GodoMall patterns
  if (urls.some((url) => url.includes('/godo_modules/') || url.includes('/shop_img/'))) {
    return {
      cms: 'GodoMall',
      confidence: 65,
    };
  }

  // Imweb patterns
  if (urls.some((url) => url.includes('/imweb/'))) {
    return {
      cms: 'Imweb',
      confidence: 65,
    };
  }

  // Blogger patterns
  if (urls.some((url) => url.includes('/feeds/posts/'))) {
    return {
      cms: 'Blogger',
      confidence: 65,
    };
  }

  // Check data-shop attribute for Shopify
  const dataShop = $('html').attr('data-shop');
  if (dataShop && dataShop.toLowerCase().includes('myshopify.com')) {
    return {
      cms: 'Shopify',
      confidence: 65,
    };
  }

  return null;
}

/**
 * Detect CMS from class and ID patterns (lower confidence: 40-60)
 */
function detectFromClassesIds(
  $: cheerio.CheerioAPI
): CmsDetectionResult | null {
  // WIX patterns
  if (
    $('#wix-container').length > 0 ||
    $('html.wixFreemium').length > 0 ||
    $('[data-wix]').length > 0
  ) {
    return {
      cms: 'WIX',
      confidence: 62,
    };
  }

  // WordPress class patterns
  if ($('.wp-content').length > 0 || $('[class*="wordpress"]').length > 0) {
    return {
      cms: 'WordPress',
      confidence: 62,
    };
  }

  return null;
}
