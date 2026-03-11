/**
 * SEO Score Calculator Module
 * 계산 규칙: 100점 만점 기준 SEO 점수 산출
 * - 각 항목은 기준을 만족하면 만점, 미흡하면 부분점수 또는 0점
 * - 순수 함수: 부작용 없음
 */

import type { CrawlResult } from '@/types/crawl';

/**
 * SEO 점수 상세 항목
 */
export interface SeoScoreDetail {
  item: string; // 한국어 항목명
  points: number; // 0-20 (항목별 배점)
  status: 'pass' | 'partial' | 'fail'; // 평가 상태
}

/**
 * SEO 점수 계산 결과
 */
export interface SeoScorerResult {
  seoScore: number; // 0-100
  details: SeoScoreDetail[];
}

/**
 * 크롤 데이터로부터 SEO 점수를 계산합니다
 *
 * 점수 배분 (총 100점):
 * - 제목 태그 (Title): 20점 (최적 50-60자)
 * - 메타 설명: 20점 (최적 120-160자)
 * - H1 태그: 15점 (정확히 1개)
 * - 모바일 반응형 (Viewport): 15점
 * - 내부 링크 구조 (깊이 ≤3): 15점
 * - 사이트맵: 10점
 * - robots.txt: 5점
 *
 * @param crawl - 크롤링 결과 데이터
 * @returns SEO 점수와 상세 항목 배열
 */
export function calculateSeoScore(crawl: CrawlResult): SeoScorerResult {
  const details: SeoScoreDetail[] = [];

  // 1. 제목 태그 (Title) — 20점
  details.push(scoreTitleTag(crawl));

  // 2. 메타 설명 (Meta Description) — 20점
  details.push(scoreMetaDescription(crawl));

  // 3. H1 태그 — 15점
  details.push(scoreH1Tag(crawl));

  // 4. 모바일 반응형 (Viewport) — 15점
  details.push(scoreViewport(crawl));

  // 5. 내부 링크 구조 (깊이 ≤3) — 15점
  details.push(scoreInternalLinkStructure(crawl));

  // 6. 사이트맵 — 10점
  details.push(scoreSitemap(crawl));

  // 7. robots.txt — 5점
  details.push(scoreRobotsTxt(crawl));

  // 종합 점수 계산
  const seoScore = details.reduce((sum, detail) => sum + detail.points, 0);

  return {
    seoScore,
    details,
  };
}

/**
 * 제목 태그 평가 (20점)
 * - 50-60자: 20점
 * - 20-49자 또는 61-100자: 10점
 * - 없음 또는 100자 초과: 0점
 */
function scoreTitleTag(crawl: CrawlResult): SeoScoreDetail {
  const title = crawl.metaTags?.title;

  if (!title || title.trim().length === 0) {
    return {
      item: '제목 태그 (Title)',
      points: 0,
      status: 'fail',
    };
  }

  const length = title.length;
  const OPTIMAL_MIN = 50;
  const OPTIMAL_MAX = 60;

  if (length >= OPTIMAL_MIN && length <= OPTIMAL_MAX) {
    return {
      item: '제목 태그 (Title)',
      points: 20,
      status: 'pass',
    };
  }

  // 너무 짧거나 길면 부분점수
  if (length >= 20 && length <= 100) {
    return {
      item: '제목 태그 (Title)',
      points: 10,
      status: 'partial',
    };
  }

  return {
    item: '제목 태그 (Title)',
    points: 0,
    status: 'fail',
  };
}

/**
 * 메타 설명 평가 (20점)
 * - 120-160자: 20점
 * - 60-119자 또는 161-250자: 10점
 * - 없음 또는 250자 초과: 0점
 */
function scoreMetaDescription(crawl: CrawlResult): SeoScoreDetail {
  const description = crawl.metaTags?.description;

  if (!description || description.trim().length === 0) {
    return {
      item: '메타 설명 (Meta description)',
      points: 0,
      status: 'fail',
    };
  }

  const length = description.length;
  const OPTIMAL_MIN = 120;
  const OPTIMAL_MAX = 160;

  if (length >= OPTIMAL_MIN && length <= OPTIMAL_MAX) {
    return {
      item: '메타 설명 (Meta description)',
      points: 20,
      status: 'pass',
    };
  }

  // 너무 짧거나 길면 부분점수
  if (length >= 60 && length <= 250) {
    return {
      item: '메타 설명 (Meta description)',
      points: 10,
      status: 'partial',
    };
  }

  return {
    item: '메타 설명 (Meta description)',
    points: 0,
    status: 'fail',
  };
}

/**
 * H1 태그 평가 (15점)
 * - 정확히 1개: 15점
 * - 0개 또는 2개 이상: 0점
 */
function scoreH1Tag(crawl: CrawlResult): SeoScoreDetail {
  const headings = crawl.headings ?? [];
  const h1Count = headings.filter((h) => h.level === 1).length;

  if (h1Count === 1) {
    return {
      item: 'H1 태그',
      points: 15,
      status: 'pass',
    };
  }

  return {
    item: 'H1 태그',
    points: 0,
    status: 'fail',
  };
}

/**
 * 모바일 반응형 (Viewport meta tag) 평가 (15점)
 * - viewport 메타 태그 존재: 15점
 * - 없음: 0점
 */
function scoreViewport(crawl: CrawlResult): SeoScoreDetail {
  const viewport = crawl.metaTags?.viewport;

  if (viewport && viewport.trim().length > 0) {
    return {
      item: '모바일 반응형 (Viewport)',
      points: 15,
      status: 'pass',
    };
  }

  return {
    item: '모바일 반응형 (Viewport)',
    points: 0,
    status: 'fail',
  };
}

/**
 * 내부 링크 구조 깊이 평가 (15점)
 * - 모든 내부 링크의 깊이가 ≤3: 15점
 * - 일부 링크 깊이가 >3: 0점
 * - 내부 링크 없음: 0점
 *
 * 깊이 계산: /a/b/c = 3 (슬래시 개수)
 */
function scoreInternalLinkStructure(crawl: CrawlResult): SeoScoreDetail {
  const links = crawl.links ?? [];
  const internalLinks = links.filter((link) => link.isInternal);

  if (internalLinks.length === 0) {
    return {
      item: '내부 링크 구조 (깊이 ≤3)',
      points: 0,
      status: 'fail',
    };
  }

  const allLinksValid = internalLinks.every((link) => {
    const depth = calculatePathDepth(link.href);
    return depth <= 3;
  });

  if (allLinksValid) {
    return {
      item: '내부 링크 구조 (깊이 ≤3)',
      points: 15,
      status: 'pass',
    };
  }

  return {
    item: '내부 링크 구조 (깊이 ≤3)',
    points: 0,
    status: 'fail',
  };
}

/**
 * 경로의 깊이 계산 헬퍼
 * /a/b/c = 3
 * /a = 1
 * / = 1 (루트도 깊이 1로 간주)
 */
function calculatePathDepth(href: string): number {
  // 쿼리 문자열 제거
  const pathOnly = href.split('?')[0];

  // 프래그먼트 제거
  const cleanPath = pathOnly.split('#')[0];

  // 경로 길이 0이거나 빈 문자열이면 깊이 1 (루트)
  if (!cleanPath || cleanPath === '/' || cleanPath.trim() === '') {
    return 1;
  }

  // 양쪽 슬래시 제거 후 슬래시로 분할
  const segments = cleanPath
    .replace(/^\/+/, '') // 시작 슬래시 제거
    .replace(/\/+$/, '') // 끝 슬래시 제거
    .split('/')
    .filter((seg) => seg.length > 0);

  // 세그먼트가 없으면 루트 (깊이 1)
  return segments.length === 0 ? 1 : segments.length;
}

/**
 * 사이트맵 평가 (10점)
 * - 사이트맵 존재 및 URL 개수 > 0: 10점
 * - 없음 또는 URL 개수 = 0: 0점
 */
function scoreSitemap(crawl: CrawlResult): SeoScoreDetail {
  const sitemapInfo = crawl.sitemapInfo;

  if (sitemapInfo && sitemapInfo.urlCount > 0) {
    return {
      item: '사이트맵',
      points: 10,
      status: 'pass',
    };
  }

  return {
    item: '사이트맵',
    points: 0,
    status: 'fail',
  };
}

/**
 * robots.txt 평가 (5점)
 * - robots.txt 존재: 5점
 * - 없음: 0점
 */
function scoreRobotsTxt(crawl: CrawlResult): SeoScoreDetail {
  const robotsTxt = crawl.robotsTxt;

  if (robotsTxt && robotsTxt.trim().length > 0) {
    return {
      item: 'robots.txt',
      points: 5,
      status: 'pass',
    };
  }

  return {
    item: 'robots.txt',
    points: 0,
    status: 'fail',
  };
}
