import type { RuleDefinition } from '../types'
import { SEO_THRESHOLDS } from '../constants'
import { hasLayer1 } from './guards'

/** 콘텐츠 룰 (12개, 130점) */
export const contentRules: RuleDefinition[] = [
  {
    id: 'cont-01',
    category: 'content',
    name: 'title 태그 존재',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const title = data.layer1!.meta.title
      if (title && title.trim().length > 0) {
        return { passed: true, message: `title: "${title}"` }
      }
      return {
        passed: false,
        message: 'title 태그가 없습니다. 검색 결과에 제목이 표시되지 않습니다.',
      }
    },
  },
  {
    id: 'cont-02',
    category: 'content',
    name: 'title 길이 적정',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: (data) =>
      data.layer1 !== null && data.layer1.meta.title !== null,
    evaluate: (data) => {
      const len = data.layer1!.meta.title!.length
      const { TITLE_MIN_LENGTH, TITLE_MAX_LENGTH } = SEO_THRESHOLDS
      if (len >= TITLE_MIN_LENGTH && len <= TITLE_MAX_LENGTH) {
        return {
          passed: true,
          message: `title 길이 ${len}자 (권장 ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH}자)`,
        }
      }
      if (len < TITLE_MIN_LENGTH) {
        return {
          passed: false,
          message: `title이 ${len}자로 너무 짧습니다 (최소 ${TITLE_MIN_LENGTH}자 권장).`,
        }
      }
      return {
        passed: false,
        message: `title이 ${len}자로 너무 깁니다 (최대 ${TITLE_MAX_LENGTH}자 권장). 검색 결과에서 잘립니다.`,
      }
    },
  },
  {
    id: 'cont-03',
    category: 'content',
    name: 'meta description 존재',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const desc = data.layer1!.meta.description
      if (desc && desc.trim().length > 0) {
        return { passed: true, message: 'meta description 설정됨' }
      }
      return {
        passed: false,
        message: 'meta description이 없습니다. 검색 결과 클릭률이 낮아집니다.',
      }
    },
  },
  {
    id: 'cont-04',
    category: 'content',
    name: 'meta description 길이 적정',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: (data) =>
      data.layer1 !== null && data.layer1.meta.description !== null,
    evaluate: (data) => {
      const len = data.layer1!.meta.description!.length
      const { DESCRIPTION_MIN_LENGTH, DESCRIPTION_MAX_LENGTH } = SEO_THRESHOLDS
      if (len >= DESCRIPTION_MIN_LENGTH && len <= DESCRIPTION_MAX_LENGTH) {
        return {
          passed: true,
          message: `description 길이 ${len}자 (권장 ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH}자)`,
        }
      }
      if (len < DESCRIPTION_MIN_LENGTH) {
        return {
          passed: false,
          message: `description이 ${len}자로 너무 짧습니다 (최소 ${DESCRIPTION_MIN_LENGTH}자 권장).`,
        }
      }
      return {
        passed: false,
        message: `description이 ${len}자로 너무 깁니다 (최대 ${DESCRIPTION_MAX_LENGTH}자 권장).`,
      }
    },
  },
  {
    id: 'cont-05',
    category: 'content',
    name: 'H1 태그 정확히 1개',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const h1Count = data.layer1!.headings.h1.length
      if (h1Count === 1) {
        return {
          passed: true,
          message: `H1: "${data.layer1!.headings.h1[0]}"`,
        }
      }
      if (h1Count === 0) {
        return {
          passed: false,
          message: 'H1 태그가 없습니다. 페이지 주제를 알 수 없습니다.',
        }
      }
      return {
        passed: false,
        message: `H1이 ${h1Count}개입니다. 페이지당 정확히 1개를 권장합니다.`,
      }
    },
  },
  {
    id: 'cont-06',
    category: 'content',
    name: 'H2 태그 2개 이상',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const h2Count = data.layer1!.headings.h2.length
      if (h2Count >= 2) {
        return { passed: true, message: `H2 ${h2Count}개 사용 중` }
      }
      return {
        passed: false,
        message: `H2가 ${h2Count}개입니다. 콘텐츠 구조화를 위해 2개 이상 권장합니다.`,
      }
    },
  },
  {
    id: 'cont-07',
    category: 'content',
    name: '제목 계층 구조',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const { h1, h2, h3, h4, h5, h6 } = data.layer1!.headings
      const counts = [
        h1.length,
        h2.length,
        h3.length,
        h4.length,
        h5.length,
        h6.length,
      ]

      // 레벨을 건너뛰는지 확인 (예: H1 → H3, H2 없이)
      let hasSkip = false
      let lastUsed = -1
      for (let i = 0; i < counts.length; i++) {
        if (counts[i]! > 0) {
          if (lastUsed >= 0 && i - lastUsed > 1) {
            hasSkip = true
            break
          }
          lastUsed = i
        }
      }

      if (!hasSkip) {
        return { passed: true, message: '제목 계층 구조가 올바릅니다' }
      }
      return {
        passed: false,
        message:
          '제목 태그가 레벨을 건너뜁니다 (예: H1→H3). 순차적 사용을 권장합니다.',
      }
    },
  },
  {
    id: 'cont-08',
    category: 'content',
    name: '이미지 alt 속성 100%',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const { total, without_alt } = data.layer1!.images
      if (total === 0) {
        return { passed: true, message: '이미지 없음 (해당 없음)' }
      }
      if (without_alt === 0) {
        return {
          passed: true,
          message: `전체 ${total}개 이미지에 alt 속성 설정됨`,
        }
      }
      return {
        passed: false,
        message: `${total}개 이미지 중 ${without_alt}개에 alt 속성이 없습니다. 접근성과 SEO에 불리합니다.`,
      }
    },
  },
  {
    id: 'cont-09',
    category: 'content',
    name: '큰 이미지 없음',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const largeImages = data.layer1!.images.large_images
      if (largeImages.length === 0) {
        return {
          passed: true,
          message: `모든 이미지가 ${SEO_THRESHOLDS.MAX_IMAGE_SIZE_KB}KB 이하`,
        }
      }
      return {
        passed: false,
        message: `${largeImages.length}개 이미지가 ${SEO_THRESHOLDS.MAX_IMAGE_SIZE_KB}KB를 초과합니다. 페이지 속도에 영향을 줍니다.`,
      }
    },
  },
  {
    id: 'cont-10',
    category: 'content',
    name: 'Schema Markup 존재',
    maxPoints: 15,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const schemas = data.layer1!.schema_markup
      if (schemas.length > 0) {
        return {
          passed: true,
          message: `Schema Markup ${schemas.length}개 발견`,
        }
      }
      return {
        passed: false,
        message:
          'Schema Markup(JSON-LD)이 없습니다. 검색 결과 리치 스니펫 노출이 불가합니다.',
      }
    },
  },
  {
    id: 'cont-11',
    category: 'content',
    name: '내부 링크 존재',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const count = data.layer1!.links.internal
      if (count > 0) {
        return { passed: true, message: `내부 링크 ${count}개` }
      }
      return {
        passed: false,
        message:
          '내부 링크가 없습니다. 사이트 구조 연결이 약하면 크롤링 효율이 떨어집니다.',
      }
    },
  },
  {
    id: 'cont-12',
    category: 'content',
    name: '깨진 링크 없음',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const broken = data.layer1!.links.broken
      if (broken.length === 0) {
        return { passed: true, message: '깨진 링크 없음' }
      }
      return {
        passed: false,
        message: `깨진 링크 ${broken.length}개 발견. 사용자 경험과 SEO에 부정적입니다.`,
      }
    },
  },
]
