import type { RuleDefinition } from '../types'
import { SEO_THRESHOLDS } from '../constants'
import { hasLayer1 } from './guards'

/** 콘텐츠 룰 (12개, 130점) */
export const contentRules: RuleDefinition[] = [
  {
    id: 'cont-01',
    category: 'content',
    name: '페이지 제목 설정',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: true,
    difficulty: 'easy',
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const title = data.layer1!.meta.title
      if (title && title.trim().length > 0) {
        return { passed: true, message: `페이지 제목: "${title}"` }
      }
      return {
        passed: false,
        message:
          '페이지 제목이 설정되지 않았습니다. Google 검색 결과에 제목이 표시되지 않아 아무도 클릭하지 않게 됩니다.',
      }
    },
  },
  {
    id: 'cont-02',
    category: 'content',
    name: '페이지 제목 길이',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    difficulty: 'easy',
    isEvaluable: (data) =>
      data.layer1 !== null && data.layer1.meta.title !== null,
    evaluate: (data) => {
      const len = data.layer1!.meta.title!.length
      const { TITLE_MIN_LENGTH, TITLE_MAX_LENGTH } = SEO_THRESHOLDS
      if (len >= TITLE_MIN_LENGTH && len <= TITLE_MAX_LENGTH) {
        return {
          passed: true,
          message: `페이지 제목 ${len}자 (적정 범위: ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH}자)`,
        }
      }
      if (len < TITLE_MIN_LENGTH) {
        return {
          passed: false,
          message: `페이지 제목이 ${len}자로 너무 짧습니다. ${TITLE_MIN_LENGTH}자 이상으로 늘려야 Google 검색에서 눈에 띕니다.`,
        }
      }
      return {
        passed: false,
        message: `페이지 제목이 ${len}자로 너무 깁니다. ${TITLE_MAX_LENGTH}자 이내로 줄여야 검색 결과에서 잘리지 않습니다.`,
      }
    },
  },
  {
    id: 'cont-03',
    category: 'content',
    name: '검색 결과 설명문',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: true,
    difficulty: 'easy',
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const desc = data.layer1!.meta.description
      if (desc && desc.trim().length > 0) {
        return {
          passed: true,
          message: 'Google 검색 결과에 표시될 설명문이 설정되어 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'Google 검색 결과에 표시될 설명문이 없습니다. 설명이 없으면 검색에서 사이트가 보여도 클릭하지 않게 됩니다.',
      }
    },
  },
  {
    id: 'cont-04',
    category: 'content',
    name: '검색 결과 설명문 길이',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    difficulty: 'easy',
    isEvaluable: (data) =>
      data.layer1 !== null && data.layer1.meta.description !== null,
    evaluate: (data) => {
      const len = data.layer1!.meta.description!.length
      const { DESCRIPTION_MIN_LENGTH, DESCRIPTION_MAX_LENGTH } = SEO_THRESHOLDS
      if (len >= DESCRIPTION_MIN_LENGTH && len <= DESCRIPTION_MAX_LENGTH) {
        return {
          passed: true,
          message: `설명문 ${len}자 (적정 범위: ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH}자)`,
        }
      }
      if (len < DESCRIPTION_MIN_LENGTH) {
        return {
          passed: false,
          message: `설명문이 ${len}자로 너무 짧습니다. ${DESCRIPTION_MIN_LENGTH}자 이상이어야 검색 사용자에게 충분한 정보를 전달할 수 있습니다.`,
        }
      }
      return {
        passed: false,
        message: `설명문이 ${len}자로 너무 깁니다. ${DESCRIPTION_MAX_LENGTH}자 이내로 줄여야 검색 결과에서 잘리지 않습니다.`,
      }
    },
  },
  {
    id: 'cont-05',
    category: 'content',
    name: '대표 제목(H1) 설정',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const h1Count = data.layer1!.headings.h1.length
      if (h1Count === 1) {
        return {
          passed: true,
          message: `대표 제목: "${data.layer1!.headings.h1[0]}"`,
        }
      }
      if (h1Count === 0) {
        return {
          passed: false,
          message:
            '페이지의 대표 제목(H1)이 없습니다. 마치 책에 표지 제목이 없는 것과 같아서, Google이 이 페이지가 무슨 내용인지 파악할 수 없습니다.',
        }
      }
      return {
        passed: false,
        message: `대표 제목(H1)이 ${h1Count}개입니다. 책 표지 제목이 여러 개이면 혼란스럽듯이, 페이지당 1개만 사용해야 합니다.`,
      }
    },
  },
  {
    id: 'cont-06',
    category: 'content',
    name: '소제목(H2) 활용',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const h2Count = data.layer1!.headings.h2.length
      if (h2Count >= 2) {
        return {
          passed: true,
          message: `소제목 ${h2Count}개로 콘텐츠가 잘 구분되어 있습니다.`,
        }
      }
      return {
        passed: false,
        message: `소제목(H2)이 ${h2Count}개입니다. 글이 단락 구분 없이 이어져 있으면 읽기 어렵고, Google도 내용을 파악하기 힘듭니다. 2개 이상 사용을 권장합니다.`,
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
        return {
          passed: true,
          message: '제목이 대제목→소제목→세부제목 순서로 잘 정리되어 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          '제목 순서가 뒤섞여 있습니다. 마치 책의 목차가 1장→3장으로 건너뛰는 것처럼, 대제목→소제목→세부제목 순서를 지켜야 Google이 내용을 잘 이해합니다.',
      }
    },
  },
  {
    id: 'cont-08',
    category: 'content',
    name: '이미지 설명 텍스트',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    difficulty: 'medium',
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const { total, without_alt } = data.layer1!.images
      if (total === 0) {
        return { passed: true, message: '이미지 없음 (해당 없음)' }
      }
      if (without_alt === 0) {
        return {
          passed: true,
          message: `전체 ${total}개 이미지에 설명 텍스트가 잘 설정되어 있습니다.`,
        }
      }
      return {
        passed: false,
        message: `${total}개 이미지 중 ${without_alt}개에 설명 텍스트가 없습니다. 이미지 설명이 없으면 Google 이미지 검색에 나오지 않고, 시각장애인도 내용을 알 수 없습니다.`,
      }
    },
  },
  {
    id: 'cont-09',
    category: 'content',
    name: '이미지 용량 최적화',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    difficulty: 'medium',
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const largeImages = data.layer1!.images.large_images
      if (largeImages.length === 0) {
        return {
          passed: true,
          message: `모든 이미지가 ${SEO_THRESHOLDS.MAX_IMAGE_SIZE_KB}KB 이하로 가볍습니다.`,
        }
      }
      return {
        passed: false,
        message: `${largeImages.length}개 이미지가 너무 큽니다(${SEO_THRESHOLDS.MAX_IMAGE_SIZE_KB}KB 초과). 이미지가 크면 페이지가 느리게 열려 방문자가 이탈합니다.`,
      }
    },
  },
  {
    id: 'cont-10',
    category: 'content',
    name: '검색 결과 꾸미기 코드',
    maxPoints: 15,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const schemas = data.layer1!.schema_markup
      if (schemas.length > 0) {
        return {
          passed: true,
          message: `Google에 사이트 정보를 알려주는 구조화 코드가 ${schemas.length}개 설정되어 있습니다.`,
        }
      }
      return {
        passed: false,
        message:
          'Google에 사이트 정보를 알려주는 구조화 코드가 없습니다. 이 코드가 있으면 검색 결과에 별점, 가격, FAQ 등이 예쁘게 표시되어 클릭률이 크게 올라갑니다.',
      }
    },
  },
  {
    id: 'cont-11',
    category: 'content',
    name: '사이트 내 페이지 연결',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const count = data.layer1!.links.internal
      if (count > 0) {
        return {
          passed: true,
          message: `사이트 내 다른 페이지로 연결하는 링크가 ${count}개 있습니다.`,
        }
      }
      return {
        passed: false,
        message:
          '사이트 내 다른 페이지로 연결하는 링크가 없습니다. 페이지끼리 연결되어 있지 않으면 Google이 사이트 전체를 탐색하기 어렵습니다.',
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
    difficulty: 'medium',
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const broken = data.layer1!.links.broken
      if (broken.length === 0) {
        return { passed: true, message: '모든 링크가 정상 작동합니다.' }
      }
      return {
        passed: false,
        message: `클릭해도 열리지 않는 깨진 링크가 ${broken.length}개 있습니다. 방문자가 "페이지를 찾을 수 없습니다" 오류를 보면 사이트 신뢰도가 떨어집니다.`,
      }
    },
  },
]
