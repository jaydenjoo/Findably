/**
 * Quick Win Identification Engine
 * 즉시 실행 가능한 개선 항목(Quick Win)을 자동으로 식별합니다.
 * 순수 함수: 부작용 없음, 입력 크롤 데이터로부터 Quick Win 배열 반환
 */

import type { CrawlResult } from "@/types/crawl";

/**
 * Quick Win 항목
 */
export interface QuickWin {
  title: string; // 한국어 제목 (예: "Title 태그 추가")
  description: string; // 상세 설명 및 구현 가이드
  priority: "high" | "medium"; // 우선순위
  effort: string; // 구현 난이도 한국어 표현 (예: "1시간 이내")
  effortLevel: "<1h" | "1-8h" | ">8h"; // 정규화된 난이도 레벨
  expectedImpact: string; // 예상 효과 (예: "+10-15점")
}

/**
 * 크롤 결과에서 Quick Win을 식별합니다.
 *
 * Quick Win 감지 조건:
 * - Title 태그 누락 → "Title 태그 추가" (high priority, +10-15점)
 * - Meta Description 누락 → "Meta Description 추가" (high priority, +10-15점)
 * - H1 태그 누락 또는 중복 → "H1 태그 추가" (high priority, +10-15점)
 * - Schema.org 마크업 없음 → "Schema.org 마크업 추가" (high priority, +10-15점)
 * - 이미지 Alt 텍스트 누락 → "이미지 Alt 텍스트 추가" (medium priority, +5-10점)
 *
 * 반환된 배열은 우선순위순(high > medium)으로 정렬되며,
 * 같은 우선순위 내에서는 expectedImpact 큰 것이 먼저 옵니다.
 *
 * @param crawl - 크롤링 결과 데이터
 * @returns 정렬된 Quick Win 배열
 */
export function identifyQuickWins(crawl: CrawlResult): QuickWin[] {
  const quickWins: QuickWin[] = [];

  // 1. Title 태그 누락 확인
  if (isTitleMissing(crawl)) {
    quickWins.push({
      title: "Title 태그 추가",
      description:
        '웹사이트의 제목 태그를 추가하세요. 50-60자 사이로 키워드를 포함하는 명확한 제목을 작성합니다. 예: "전자상거래 솔루션 | 스타트업용 쇼핑몰 플랫폼"',
      priority: "high",
      effort: "1시간 이내",
      effortLevel: "<1h",
      expectedImpact: "+10-15점",
    });
  }

  // 2. Meta Description 누락 확인
  if (isMetaDescriptionMissing(crawl)) {
    quickWins.push({
      title: "Meta Description 추가",
      description:
        '웹사이트의 메타 설명을 추가하세요. 120-160자 사이로 서비스의 가치를 명확히 설명합니다. 예: "우리는 스타트업을 위한 초저가 전자상거래 솔루션을 제공합니다. 3분 가입, 즉시 판매 시작."',
      priority: "high",
      effort: "1시간 이내",
      effortLevel: "<1h",
      expectedImpact: "+10-15점",
    });
  }

  // 3. H1 태그 확인
  if (isH1Missing(crawl)) {
    quickWins.push({
      title: "H1 태그 추가",
      description:
        "웹사이트의 메인 제목을 H1 태그로 추가하세요. 한 페이지에 정확히 하나의 H1만 사용합니다. 예: <h1>스타트업을 위한 최고의 전자상거래 솔루션</h1>",
      priority: "high",
      effort: "1시간 이내",
      effortLevel: "<1h",
      expectedImpact: "+10-15점",
    });
  }

  // 4. Schema.org 마크업 확인
  if (isSchemaMarkupMissing(crawl)) {
    quickWins.push({
      title: "Schema.org 마크업 추가",
      description:
        '웹사이트에 Organization 또는 업종 관련 Schema.org 마크업을 추가하세요. JSON-LD 형식으로 회사명, 로고, 설명을 구조화된 데이터로 제공합니다. 예: {\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "회사명",\n  "url": "https://example.com",\n  "logo": "https://example.com/logo.png"\n}',
      priority: "high",
      effort: "1시간 이내",
      effortLevel: "<1h",
      expectedImpact: "+10-15점",
    });
  }

  // 5. 이미지 Alt 텍스트 확인
  const imagesWithoutAlt = getImagesWithoutAlt(crawl);
  if (imagesWithoutAlt.length > 0) {
    quickWins.push({
      title: "이미지 Alt 텍스트 추가",
      description: `웹사이트의 ${imagesWithoutAlt.length}개 이미지에 Alt 텍스트를 추가하세요. 각 이미지가 무엇을 보여주는지 간단히 설명하는 텍스트를 <img> 태그의 alt 속성에 넣습니다. 예: <img src="product.png" alt="우리 제품의 주요 기능">`,
      priority: "medium",
      effort: "1시간 이내",
      effortLevel: "<1h",
      expectedImpact: "+5-10점",
    });
  }

  // 우선순위와 expectedImpact에 따라 정렬
  quickWins.sort((a, b) => {
    // 우선순위 정렬 (high > medium)
    const priorityOrder = { high: 0, medium: 1 };
    const priorityCompare =
      priorityOrder[a.priority] - priorityOrder[b.priority];

    if (priorityCompare !== 0) {
      return priorityCompare;
    }

    // 같은 우선순위 내에서 expectedImpact 큰 것이 먼저 (예: "+10-15점" > "+5-10점")
    const extractMinImpact = (impact: string): number => {
      const match = impact.match(/\+(\d+)-/);
      return match ? parseInt(match[1], 10) : 0;
    };

    return (
      extractMinImpact(b.expectedImpact) - extractMinImpact(a.expectedImpact)
    );
  });

  return quickWins;
}

/**
 * Title 태그가 누락되었는지 확인합니다
 */
function isTitleMissing(crawl: CrawlResult): boolean {
  const title = crawl.metaTags?.title;
  return !title || title.trim().length === 0;
}

/**
 * Meta Description이 누락되었는지 확인합니다
 */
function isMetaDescriptionMissing(crawl: CrawlResult): boolean {
  const description = crawl.metaTags?.description;
  return !description || description.trim().length === 0;
}

/**
 * H1 태그가 누락되었는지 또는 중복되었는지 확인합니다
 * - H1이 없으면: true (누락)
 * - H1이 정확히 1개: false (정상)
 * - H1이 2개 이상: true (중복)
 */
function isH1Missing(crawl: CrawlResult): boolean {
  const headings = crawl.headings ?? [];
  const h1Count = headings.filter((h) => h.level === 1).length;
  return h1Count !== 1;
}

/**
 * Schema.org 마크업이 누락되었는지 확인합니다
 */
function isSchemaMarkupMissing(crawl: CrawlResult): boolean {
  const schemaMarkup = crawl.schemaMarkup;
  return !schemaMarkup || schemaMarkup.length === 0;
}

/**
 * Alt 텍스트가 없는 이미지를 반환합니다
 */
function getImagesWithoutAlt(crawl: CrawlResult): string[] {
  const images = crawl.images ?? [];
  return images
    .filter((img) => !img.alt || img.alt.trim().length === 0)
    .map((img) => img.src);
}
