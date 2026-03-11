/**
 * Sitemap and Robots.txt Parser Module
 * Extracts SEO elements from robots.txt and sitemap.xml files
 * Pure functions with no side effects
 */

import * as cheerio from 'cheerio';

/**
 * robots.txt 파싱 결과 타입
 */
export interface RobotsRule {
  userAgent: string;
  disallow: string[];
  allow?: string[];
  crawlDelay?: number;
}

/**
 * robots.txt 파싱 함수의 반환 타입
 */
export interface RobotsParseResult {
  robotsTxtFound: boolean;
  robotsRules: RobotsRule[];
  sitemapUrls: string[];
}

/**
 * Sitemap XML 파싱 함수의 반환 타입
 */
export interface SitemapParseResult {
  sitemapUrls: string[];
  sitemapCount: number;
  lastModified: string | null;
}

/**
 * robots.txt 콘텐츠를 파싱하여 규칙 추출
 *
 * @param content - robots.txt 파일의 raw 텍스트 콘텐츠
 * @returns 파싱된 robots 규칙 및 sitemap URL
 */
export function parseRobotsTxt(content: unknown): RobotsParseResult {
  // 안전한 입력 처리
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return {
      robotsTxtFound: false,
      robotsRules: [],
      sitemapUrls: [],
    };
  }

  try {
    const lines = content.split('\n');
    const robotsRules: RobotsRule[] = [];
    const sitemapUrls: string[] = [];

    let currentRule: Partial<RobotsRule> | null = null;
    let hasBlankLineAfterUserAgent = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // 주석 스킵 (라인 시작이 #)
      if (trimmed.startsWith('#')) {
        continue;
      }

      // 빈 줄: user-agent 이후 첫 빈 줄이면 rule 종료 신호
      if (!trimmed) {
        if (currentRule && currentRule.userAgent && hasBlankLineAfterUserAgent) {
          robotsRules.push(finalizeRule(currentRule as RobotsRule));
          currentRule = null;
          hasBlankLineAfterUserAgent = false;
        }
        continue;
      }

      // ":" 기준으로 분할
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) {
        continue;
      }

      const directive = trimmed.substring(0, colonIndex).trim().toLowerCase();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (directive === 'user-agent') {
        // 이전 rule 저장 (새로운 User-agent 발견)
        if (currentRule && currentRule.userAgent) {
          robotsRules.push(finalizeRule(currentRule as RobotsRule));
        }
        // 새 rule 시작
        currentRule = {
          userAgent: value,
          disallow: [],
        };
        hasBlankLineAfterUserAgent = false;
      } else if (directive === 'disallow' && currentRule) {
        if (!currentRule.disallow) {
          currentRule.disallow = [];
        }
        currentRule.disallow.push(value);
        hasBlankLineAfterUserAgent = true;
      } else if (directive === 'allow' && currentRule) {
        if (!currentRule.allow) {
          currentRule.allow = [];
        }
        currentRule.allow.push(value);
        hasBlankLineAfterUserAgent = true;
      } else if (directive === 'crawl-delay' && currentRule) {
        const delayValue = parseFloat(value);
        if (!Number.isNaN(delayValue)) {
          currentRule.crawlDelay = delayValue;
        }
        hasBlankLineAfterUserAgent = true;
      } else if (directive === 'sitemap') {
        sitemapUrls.push(value);
      }
    }

    // 마지막 rule 저장
    if (currentRule && currentRule.userAgent) {
      robotsRules.push(finalizeRule(currentRule as RobotsRule));
    }

    return {
      robotsTxtFound: robotsRules.length > 0 || sitemapUrls.length > 0,
      robotsRules,
      sitemapUrls,
    };
  } catch {
    return {
      robotsTxtFound: false,
      robotsRules: [],
      sitemapUrls: [],
    };
  }
}

/**
 * robots.txt 파싱을 위한 내부 헬퍼: rule 최종화
 */
function finalizeRule(rule: Partial<RobotsRule>): RobotsRule {
  const finalized: RobotsRule = {
    userAgent: rule.userAgent || '',
    disallow: rule.disallow || [],
  };

  if (rule.allow && rule.allow.length > 0) {
    finalized.allow = rule.allow;
  }

  if (rule.crawlDelay !== undefined) {
    finalized.crawlDelay = rule.crawlDelay;
  }

  return finalized;
}

/**
 * sitemap.xml 콘텐츠를 파싱하여 URL과 메타데이터 추출
 * sitemap index 파일도 처리 가능
 *
 * @param content - sitemap.xml 파일의 raw XML 콘텐츠
 * @returns 파싱된 URL, 개수, 최근 수정 날짜
 */
export function parseSitemapXml(content: unknown): SitemapParseResult {
  // 안전한 입력 처리
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return {
      sitemapUrls: [],
      sitemapCount: 0,
      lastModified: null,
    };
  }

  try {
    const $ = cheerio.load(content);
    const sitemapUrls: string[] = [];
    let lastModified: string | undefined;

    // URL 요소 추출 (일반 sitemap)
    const urlElements = $('url');
    if (urlElements.length > 0) {
      urlElements.each((_, el) => {
        const locElement = $(el).find('loc').first();
        let loc = locElement.text();

        // text()가 비어있거나 없으면 html() 시도 (CDATA, entities 처리)
        if (!loc) {
          let htmlContent = locElement.html();
          if (htmlContent) {
            // CDATA 마크업 제거: <!--[CDATA[...]]-->가 Cheerio에서 생성될 수 있음
            htmlContent = htmlContent
              .replace(/<!--\[CDATA\[/g, '')
              .replace(/\]\]-->/g, '');

            // HTML 디코딩: &amp; → &, &lt; → <, &gt; → >, &quot; → ", &#39; → '
            loc = htmlContent
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
          }
        }

        if (loc) {
          sitemapUrls.push(loc.trim());
        }

        // lastmod 추출 (최신 날짜 유지)
        const lastmod = $(el).find('lastmod').first().text();
        if (lastmod) {
          const trimmedLastmod = lastmod.trim();
          // ISO 8601 형식인 경우 날짜 부분만 추출 (YYYY-MM-DD)
          const dateMatch = trimmedLastmod.match(/^\d{4}-\d{2}-\d{2}/);
          const dateOnly = dateMatch ? dateMatch[0] : trimmedLastmod;

          if (!lastModified || dateOnly > lastModified) {
            lastModified = dateOnly;
          }
        }
      });
    }

    // Sitemap index 요소 추출 (sitemap_index.xml)
    const sitemapElements = $('sitemap');
    if (sitemapElements.length > 0) {
      sitemapElements.each((_, el) => {
        const loc = $(el).find('loc').first().text();
        if (loc) {
          sitemapUrls.push(loc.trim());
        }
      });
    }

    return {
      sitemapUrls,
      sitemapCount: sitemapUrls.length,
      lastModified: lastModified || null,
    };
  } catch {
    // 파싱 실패 시 빈 결과 반환
    return {
      sitemapUrls: [],
      sitemapCount: 0,
      lastModified: null,
    };
  }
}
