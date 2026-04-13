import { SEO } from '@/config/seo'
import { LANDING } from '@/config/landing'

/**
 * llms.txt — AI 크롤러용 사이트 요약
 * 정적 파일 대신 동적 라우트로 제공하여 config 변경 시 자동 반영
 */
export function GET(): Response {
  const faqSection = LANDING.faq.items
    .map((item) => `Q: ${item.q}\nA: ${item.a}`)
    .join('\n\n')

  const content = `# ${SEO.siteName} - AI 마케팅 진단 서비스

## 서비스 개요
${SEO.siteName}는 URL 하나만 입력하면 AI가 SEO + GEO 통합 진단을 제공하는 마케팅 진단 플랫폼입니다.
웹사이트에서 새고 있는 마케팅 비용의 구멍을 찾아, 가장 돈이 많이 새는 곳부터 고치는 순서를 알려드립니다.

## 주요 기능
- 60개+ 항목 자동 분석 (SEO, GEO, 콘텐츠, 기술 인프라)
- 비즈니스 영향도 기반 우선순위 실행 계획
- AI 검색(GEO) 최적화 가이드 — ChatGPT, Perplexity, Gemini 인용 추적
- 경쟁사 비교 분석 (3개사 병렬)
- 90일 실행 로드맵 자동 생성
- Schema Markup 자동 생성 + CMS별 적용 가이드

## 사용 방법
1. ${LANDING.howItWorks.steps[0].title}: ${LANDING.howItWorks.steps[0].description}
2. ${LANDING.howItWorks.steps[1].title}: ${LANDING.howItWorks.steps[1].description}
3. ${LANDING.howItWorks.steps[2].title}: ${LANDING.howItWorks.steps[2].description}

## 타겟 고객
- 마케팅에 투자하지만 효과를 모르는 중소기업
- 마케팅 비전문가 (스타트업 CEO, 주니어 마케터)
- SEO 대행사 효과를 직접 판단하고 싶은 사업주
- B2B SaaS, 쇼핑몰, 전문서비스(병원, 학원, 컨설팅), 교육, 스타트업

## 가격
- 무료 진단: 0원 (카드 정보 불필요) — 종합 점수 + 주요 문제 3개 + Quick Win 1개
- 상세 분석: 건당 9.9만원 — 60개+ 항목 상세 + 경쟁사 비교 + 90일 로드맵 + PDF

## 차별점
- 기존 대행업체 월 수백만원 → 건당 9.9만원으로 방향성 확보
- 전문용어 대신 비유 기반 3줄 요약
- 점수가 아닌 매출 영향도(원화)로 우선순위 제시
- SEO + GEO(AI 검색) 통합 진단 — 국내 유일

## GEO(Generative Engine Optimization)란?
ChatGPT, Perplexity, Google AI Overviews 같은 AI 검색에서 서비스가 추천되도록 최적화하는 것입니다.
기존 SEO가 "검색 결과 상위 노출"이라면, GEO는 "AI가 직접 추천"하는 것을 목표로 합니다.

## 자주 묻는 질문

${faqSection}

## 연락처
${SEO.siteUrl}
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
