/**
 * GEO Score Calculator Module
 * 계산 규칙: 100점 만점 기준 GEO (Generative Engine Optimization) 점수 산출
 * - 각 항목은 기준을 만족하면 만점, 미흡하면 부분점수 또는 0점
 * - 순수 함수: 부작용 없음
 */

import type { CrawlResult } from '@/types/crawl';

/**
 * GEO 점수 상세 항목
 */
export interface GeoScoreDetail {
  item: string; // 한국어 항목명
  points: number; // 각 항목의 획득 점수
  maxPoints: number; // 각 항목의 최대 점수
  status: 'pass' | 'partial' | 'fail'; // 평가 상태
}

/**
 * GEO 점수 계산 결과
 */
export interface GeoScorerResult {
  geoScore: number; // 0-100
  details: GeoScoreDetail[];
}

/**
 * 크롤 데이터로부터 GEO 점수를 계산합니다
 *
 * 점수 배분 (총 100점):
 * - Schema.org 마크업 존재 (≥1개): 30점
 * - 구조화된 데이터 (Product/Organization/LocalBusiness): 20점
 * - FAQ 페이지 Schema: 15점
 * - 콘텐츠 길이 (≥500자): 15점
 * - 이미지 최적화 (alt 텍스트): 15점
 * - E-E-A-T 신호 (저자, 발행일, 저자 소개): 5점
 *
 * @param crawl - 크롤링 결과 데이터
 * @returns GEO 점수와 상세 항목 배열
 */
export function calculateGeoScore(crawl: CrawlResult): GeoScorerResult {
  const details: GeoScoreDetail[] = [];

  // 1. Schema.org 마크업 존재 (≥1개) — 30점
  details.push(scoreSchemaMarkupPresence(crawl));

  // 2. 구조화된 데이터 (Product/Organization/LocalBusiness) — 20점
  details.push(scoreStructuredData(crawl));

  // 3. FAQ 페이지 Schema — 15점
  details.push(scoreFaqSchema(crawl));

  // 4. 콘텐츠 길이 (≥500자) — 15점
  details.push(scoreContentLength(crawl));

  // 5. 이미지 최적화 (alt 텍스트) — 15점
  details.push(scoreImageOptimization(crawl));

  // 6. E-E-A-T 신호 (저자, 발행일, 저자 소개) — 5점
  details.push(scoreEeatSignals(crawl));

  // 종합 점수 계산
  const geoScore = details.reduce((sum, detail) => sum + detail.points, 0);

  return {
    geoScore,
    details,
  };
}

/**
 * Schema.org 마크업 존재 평가 (30점)
 * - 최소 1개의 Schema 유형: 30점
 * - 없음: 0점
 */
function scoreSchemaMarkupPresence(crawl: CrawlResult): GeoScoreDetail {
  const schemas = crawl.schemaMarkup ?? [];

  if (schemas.length > 0) {
    return {
      item: 'Schema.org 마크업 존재 (≥1개)',
      points: 30,
      maxPoints: 30,
      status: 'pass',
    };
  }

  return {
    item: 'Schema.org 마크업 존재 (≥1개)',
    points: 0,
    maxPoints: 30,
    status: 'fail',
  };
}

/**
 * 구조화된 데이터 평가 (20점)
 * - Product, Organization, LocalBusiness 중 최소 1개: 20점
 * - 없음: 0점
 */
function scoreStructuredData(crawl: CrawlResult): GeoScoreDetail {
  const schemas = crawl.schemaMarkup ?? [];
  const STRUCTURED_TYPES = ['Product', 'Organization', 'LocalBusiness'];

  const hasStructuredData = schemas.some((schema) => STRUCTURED_TYPES.includes(schema.type));

  if (hasStructuredData) {
    return {
      item: '구조화된 데이터 (Product/Organization/LocalBusiness)',
      points: 20,
      maxPoints: 20,
      status: 'pass',
    };
  }

  return {
    item: '구조화된 데이터 (Product/Organization/LocalBusiness)',
    points: 0,
    maxPoints: 20,
    status: 'fail',
  };
}

/**
 * FAQ 페이지 Schema 평가 (15점)
 * - FAQPage Schema 존재: 15점
 * - 없음: 0점
 */
function scoreFaqSchema(crawl: CrawlResult): GeoScoreDetail {
  const schemas = crawl.schemaMarkup ?? [];

  const hasFaqSchema = schemas.some((schema) => schema.type === 'FAQPage');

  if (hasFaqSchema) {
    return {
      item: 'FAQ 페이지 Schema',
      points: 15,
      maxPoints: 15,
      status: 'pass',
    };
  }

  return {
    item: 'FAQ 페이지 Schema',
    points: 0,
    maxPoints: 15,
    status: 'fail',
  };
}

/**
 * 콘텐츠 길이 평가 (15점)
 * - ≥500자: 15점 (pass)
 * - 200-499자: 5점 (partial)
 * - <200자: 0점 (fail)
 *
 * 콘텐츠는 headings의 text를 모두 연결하여 계산
 */
function scoreContentLength(crawl: CrawlResult): GeoScoreDetail {
  const headings = crawl.headings ?? [];

  // 모든 heading의 텍스트를 연결하여 총 길이 계산
  const totalLength = headings.reduce((sum, heading) => sum + (heading.text?.length ?? 0), 0);

  if (totalLength >= 500) {
    return {
      item: '콘텐츠 길이 (≥500자)',
      points: 15,
      maxPoints: 15,
      status: 'pass',
    };
  }

  if (totalLength >= 200) {
    return {
      item: '콘텐츠 길이 (≥500자)',
      points: 5,
      maxPoints: 15,
      status: 'partial',
    };
  }

  return {
    item: '콘텐츠 길이 (≥500자)',
    points: 0,
    maxPoints: 15,
    status: 'fail',
  };
}

/**
 * 이미지 최적화 평가 (15점)
 * - >80% 이미지에 alt 텍스트: 15점 (pass)
 * - 50-80% 이미지에 alt 텍스트: 8점 (partial)
 * - <50% 또는 이미지 없음: 0점 (fail)
 *
 * alt 텍스트: 존재하고 빈 문자열이 아닌 경우 카운트
 */
function scoreImageOptimization(crawl: CrawlResult): GeoScoreDetail {
  const images = crawl.images ?? [];

  if (images.length === 0) {
    return {
      item: '이미지 최적화 (alt 텍스트)',
      points: 0,
      maxPoints: 15,
      status: 'fail',
    };
  }

  // alt 텍스트가 있는 이미지 개수
  const imagesWithAlt = images.filter((img) => img.alt && img.alt.trim().length > 0).length;
  const altRatio = imagesWithAlt / images.length;

  if (altRatio >= 0.8) {
    return {
      item: '이미지 최적화 (alt 텍스트)',
      points: 15,
      maxPoints: 15,
      status: 'pass',
    };
  }

  if (altRatio >= 0.5) {
    return {
      item: '이미지 최적화 (alt 텍스트)',
      points: 8,
      maxPoints: 15,
      status: 'partial',
    };
  }

  return {
    item: '이미지 최적화 (alt 텍스트)',
    points: 0,
    maxPoints: 15,
    status: 'fail',
  };
}

/**
 * E-E-A-T 신호 평가 (5점)
 * - 3가지 신호 모두 있음 (저자, 발행일, 저자 소개): 5점 (pass)
 * - 1-2개 신호 있음: 2점 (partial)
 * - 없음: 0점 (fail)
 *
 * 신호 감지 기준:
 * - author: metaTags.author가 존재하고 비어있지 않음
 * - publish date: metaTags.title에서 ISO 날짜 형식(YYYY-MM-DD) 감지
 * - author bio: metaTags.description이 존재하고 비어있지 않음
 */
function scoreEeatSignals(crawl: CrawlResult): GeoScoreDetail {
  const metaTags = crawl.metaTags ?? {};

  let signalCount = 0;

  // Signal 1: Author
  if (metaTags.author && metaTags.author.trim().length > 0) {
    signalCount++;
  }

  // Signal 2: Publish date (ISO format: YYYY-MM-DD in title)
  if (metaTags.title) {
    const isoDatePattern = /\d{4}-\d{2}-\d{2}/;
    if (isoDatePattern.test(metaTags.title)) {
      signalCount++;
    }
  }

  // Signal 3: Author bio (description)
  if (metaTags.description && metaTags.description.trim().length > 0) {
    signalCount++;
  }

  if (signalCount >= 3) {
    return {
      item: 'E-E-A-T 신호 (저자, 발행일, 저자 소개)',
      points: 5,
      maxPoints: 5,
      status: 'pass',
    };
  }

  if (signalCount >= 1) {
    return {
      item: 'E-E-A-T 신호 (저자, 발행일, 저자 소개)',
      points: 2,
      maxPoints: 5,
      status: 'partial',
    };
  }

  return {
    item: 'E-E-A-T 신호 (저자, 발행일, 저자 소개)',
    points: 0,
    maxPoints: 5,
    status: 'fail',
  };
}
