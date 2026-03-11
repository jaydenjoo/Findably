/**
 * HTML Parser Module
 * Extracts SEO elements from raw HTML: meta tags, headings, links, images
 * Pure function with no side effects
 */

import * as cheerio from 'cheerio';
import type { MetaTags, Heading, Link, Image } from '@/types/crawl';

/**
 * Parse HTML and extract SEO elements
 * Handles character encoding, malformed HTML, and edge cases
 *
 * @param html - Raw HTML string
 * @returns Parsed object with meta tags, headings, links, images
 */
export function parseHtml(html: unknown): {
  meta: MetaTags;
  headings: Heading[];
  links: Link[];
  images: Image[];
} {
  // 안전한 입력 처리: null, undefined, 비문자열 타입
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    return {
      meta: {},
      headings: [],
      links: [],
      images: [],
    };
  }

  try {
    const $ = cheerio.load(html);

    return {
      meta: extractMetaTags($),
      headings: extractHeadings($),
      links: extractLinks($),
      images: extractImages($),
    };
  } catch {
    // HTML 파싱 실패시 기본값 반환
    return {
      meta: {},
      headings: [],
      links: [],
      images: [],
    };
  }
}

/**
 * Meta 태그 추출: title, description, og:*, twitter:*, charset, viewport 등
 */
function extractMetaTags($: cheerio.CheerioAPI): MetaTags {
  const meta: MetaTags = {};

  // <title> 태그
  const title = $('title').text();
  if (title) {
    meta.title = title.trim();
  }

  // meta[name="description"]
  const description = $('meta[name="description"]').attr('content');
  if (description) {
    meta.description = description.trim();
  }

  // meta[charset]
  const charset = $('meta[charset]').attr('charset');
  if (charset) {
    meta.charset = charset.trim();
  }

  // meta[name="viewport"]
  const viewport = $('meta[name="viewport"]').attr('content');
  if (viewport) {
    meta.viewport = viewport.trim();
  }

  // meta[name="keywords"]
  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) {
    meta.keywords = keywords.trim();
  }

  // meta[name="author"]
  const author = $('meta[name="author"]').attr('content');
  if (author) {
    meta.author = author.trim();
  }

  // meta[name="robots"]
  const robots = $('meta[name="robots"]').attr('content');
  if (robots) {
    meta.robots = robots.trim();
  }

  // Open Graph tags: meta[property="og:*"]
  const ogTitle = $('meta[property="og:title"]').attr('content');
  if (ogTitle) {
    meta.ogTitle = ogTitle.trim();
  }

  const ogDescription = $('meta[property="og:description"]').attr('content');
  if (ogDescription) {
    meta.ogDescription = ogDescription.trim();
  }

  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    meta.ogImage = ogImage.trim();
  }

  const ogType = $('meta[property="og:type"]').attr('content');
  if (ogType) {
    meta.ogType = ogType.trim();
  }

  // Twitter Card tags: meta[name="twitter:*"]
  const twitterTitle = $('meta[name="twitter:title"]').attr('content');
  if (twitterTitle) {
    meta.twitterTitle = twitterTitle.trim();
  }

  const twitterDescription = $('meta[name="twitter:description"]').attr('content');
  if (twitterDescription) {
    meta.twitterDescription = twitterDescription.trim();
  }

  const twitterImage = $('meta[name="twitter:image"]').attr('content');
  if (twitterImage) {
    meta.twitterImage = twitterImage.trim();
  }

  // Canonical link: link[rel="canonical"]
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) {
    meta.canonical = canonical.trim();
  }

  return meta;
}

/**
 * H1, H2, H3 추출 (문서 순서 보존)
 */
function extractHeadings($: cheerio.CheerioAPI): Heading[] {
  const headings: Heading[] = [];

  // 문서 순서대로 h1, h2, h3 추출
  $('h1, h2, h3').each((_, el) => {
    const tagName = el.name.toLowerCase();
    const level = parseInt(tagName[1], 10) as 1 | 2 | 3;
    const text = $(el).text().trim();

    headings.push({
      level,
      text,
    });
  });

  return headings;
}

/**
 * 링크 추출 및 내부/외부 분류
 * og:url이 있으면 해당 도메인 기준으로 내부/외부 분류
 * 없으면 기본값(내부)으로 처리
 */
function extractLinks($: cheerio.CheerioAPI): Link[] {
  const links: Link[] = [];

  // og:url에서 도메인 추출
  const ogUrl = $('meta[property="og:url"]').attr('content');
  const siteDomain = extractDomain(ogUrl);

  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();

    // href 없는 링크는 스킵
    if (!href) {
      return;
    }

    const isInternal = classifyLink(href, siteDomain);

    links.push({
      href,
      text,
      isInternal,
    });
  });

  return links;
}

/**
 * 이미지 추출
 */
function extractImages($: cheerio.CheerioAPI): Image[] {
  const images: Image[] = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src');

    // src 없는 이미지는 스킵
    if (!src) {
      return;
    }

    const image: Image = {
      src,
      alt: $(el).attr('alt'),
      hasWidth: !!$(el).attr('width'),
      hasHeight: !!$(el).attr('height'),
    };

    // undefined 제거 (깨끗한 객체 반환)
    if (image.alt === undefined) {
      delete image.alt;
    }
    if (!image.hasWidth) {
      delete image.hasWidth;
    }
    if (!image.hasHeight) {
      delete image.hasHeight;
    }

    images.push(image);
  });

  return images;
}

/**
 * URL에서 도메인 추출
 * https://example.com/path → example.com
 */
function extractDomain(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * 링크를 내부/외부로 분류
 * - 상대 경로 (/, /path, ../path, ./path): 내부
 * - 앵커 (#section): 내부
 * - 절대 URL (https://...): siteDomain과 비교해서 분류
 */
function classifyLink(href: string, siteDomain: string | null): boolean {
  // 빈 문자열, 상대 경로, 앵커는 내부 링크
  if (!href || href.startsWith('/') || href.startsWith('#') || href.startsWith('.')) {
    return true;
  }

  // 절대 URL인 경우
  if (href.startsWith('http://') || href.startsWith('https://')) {
    if (!siteDomain) {
      // siteDomain이 없으면 외부로 분류
      return false;
    }

    try {
      const linkDomain = new URL(href).hostname;
      return linkDomain === siteDomain;
    } catch {
      // URL 파싱 실패시 외부로 분류
      return false;
    }
  }

  // 기타 프로토콜 (mailto:, tel: 등): 내부로 분류
  return true;
}
