import type { RuleDefinition } from '../types'
import { GEO_THRESHOLDS } from '../constants'
import {
  hasLayer1,
  hasLayer2SafeBrowsing,
  hasLayer3Ssl,
  hasLlmsTxt,
  hasRobotsTxt,
} from './guards'

/** GEO 룰 (15개, 135점) — AI 검색 최적화 */
export const geoRules: RuleDefinition[] = [
  // ─── AI 인용 가능성 (25점) ───
  {
    id: 'geo-01',
    category: 'geo',
    name: 'llms.txt 존재',
    maxPoints: 15,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLlmsTxt,
    evaluate: (data) => {
      if (data.llms_txt!.exists) {
        return {
          passed: true,
          message:
            'llms.txt가 존재합니다. AI가 사이트를 구조적으로 이해할 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'llms.txt가 없습니다. AI 크롤러에게 사이트 요약을 제공하면 인용 가능성이 높아집니다.',
      }
    },
  },
  {
    id: 'geo-02',
    category: 'geo',
    name: 'llms.txt 충실도',
    maxPoints: 10,
    severity: 'info',
    quickWinEligible: true,
    isEvaluable: (data) =>
      data.llms_txt !== null &&
      data.llms_txt.exists &&
      data.llms_txt.content !== null,
    evaluate: (data) => {
      const content = data.llms_txt!.content!
      const length = content.length
      const sections = content
        .split('\n')
        .filter((line) => line.startsWith('#')).length

      if (
        length >= GEO_THRESHOLDS.MIN_LLMS_TXT_LENGTH &&
        sections >= GEO_THRESHOLDS.MIN_LLMS_TXT_SECTIONS
      ) {
        return {
          passed: true,
          message: `llms.txt ${length}자, ${sections}개 섹션 — 충분한 구조 정보 제공`,
        }
      }

      const issues: string[] = []
      if (length < GEO_THRESHOLDS.MIN_LLMS_TXT_LENGTH) {
        issues.push(
          `내용이 ${length}자로 짧음 (${GEO_THRESHOLDS.MIN_LLMS_TXT_LENGTH}자 이상 권장)`
        )
      }
      if (sections < GEO_THRESHOLDS.MIN_LLMS_TXT_SECTIONS) {
        issues.push(
          `섹션이 ${sections}개 (${GEO_THRESHOLDS.MIN_LLMS_TXT_SECTIONS}개 이상 권장)`
        )
      }
      return {
        passed: false,
        message: `llms.txt 충실도 부족: ${issues.join(', ')}`,
      }
    },
  },

  // ─── 플랫폼 최적화 (40점) ───
  {
    id: 'geo-03',
    category: 'geo',
    name: 'GPTBot 접근 허용',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['GPTBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return {
          passed: true,
          message: 'GPTBot 접근 허용 — ChatGPT가 사이트를 학습/인용 가능',
        }
      }
      return {
        passed: false,
        message:
          'GPTBot이 차단되어 있습니다. ChatGPT 검색에서 사이트가 인용되지 않습니다.',
      }
    },
  },
  {
    id: 'geo-04',
    category: 'geo',
    name: 'ClaudeBot 접근 허용',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['ClaudeBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return {
          passed: true,
          message: 'ClaudeBot 접근 허용 — Claude가 사이트를 인용 가능',
        }
      }
      return {
        passed: false,
        message:
          'ClaudeBot이 차단되어 있습니다. Claude 검색에서 사이트가 인용되지 않습니다.',
      }
    },
  },
  {
    id: 'geo-05',
    category: 'geo',
    name: 'PerplexityBot 접근 허용',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['PerplexityBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return {
          passed: true,
          message: 'PerplexityBot 접근 허용 — Perplexity 검색에서 노출 가능',
        }
      }
      return {
        passed: false,
        message:
          'PerplexityBot이 차단되어 있습니다. Perplexity AI 검색에서 노출되지 않습니다.',
      }
    },
  },
  {
    id: 'geo-06',
    category: 'geo',
    name: 'Googlebot 허용 (AI Overview)',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      if (data.robots_txt!.allows_googlebot) {
        return {
          passed: true,
          message:
            'Googlebot 접근 허용 — Google AI Overview에서 인용될 수 있습니다',
        }
      }
      return {
        passed: false,
        message:
          'Googlebot이 차단되어 있습니다. Google AI Overview에서도 인용되지 않습니다.',
      }
    },
  },

  // ─── 구조화 데이터 (25점) ───
  {
    id: 'geo-07',
    category: 'geo',
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
          message: `Schema Markup ${schemas.length}개 — AI가 콘텐츠 의미를 구조적으로 파악 가능`,
        }
      }
      return {
        passed: false,
        message:
          'Schema Markup(JSON-LD)이 없습니다. AI가 콘텐츠 유형과 의미를 파악하기 어렵습니다.',
      }
    },
  },
  {
    id: 'geo-08',
    category: 'geo',
    name: 'Schema 다양성',
    maxPoints: 10,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: (data) =>
      data.layer1 !== null && data.layer1.schema_markup.length > 0,
    evaluate: (data) => {
      const schemas = data.layer1!.schema_markup
      const types = new Set<string>()
      for (const s of schemas) {
        if (typeof s === 'object' && s !== null && '@type' in s) {
          const t = (s as Record<string, unknown>)['@type']
          if (typeof t === 'string') types.add(t)
        }
      }
      if (types.size >= GEO_THRESHOLDS.MIN_SCHEMA_TYPES) {
        return {
          passed: true,
          message: `Schema ${types.size}종 사용 (${[...types].join(', ')}) — AI가 다양한 맥락 인식 가능`,
        }
      }
      return {
        passed: false,
        message: `Schema가 ${types.size}종뿐입니다 (${GEO_THRESHOLDS.MIN_SCHEMA_TYPES}종 이상 권장). Organization, WebPage, FAQ 등을 추가하세요.`,
      }
    },
  },

  // ─── 콘텐츠 품질 (20점) ───
  {
    id: 'geo-09',
    category: 'geo',
    name: 'H1 명확한 주제 전달',
    maxPoints: 5,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const h1Count = data.layer1!.headings.h1.length
      if (h1Count === 1) {
        return {
          passed: true,
          message: `H1이 명확하게 1개 — AI가 페이지 핵심 주제를 파악할 수 있습니다`,
        }
      }
      if (h1Count === 0) {
        return {
          passed: false,
          message:
            'H1이 없습니다. AI가 페이지의 핵심 주제를 파악할 수 없습니다.',
        }
      }
      return {
        passed: false,
        message: `H1이 ${h1Count}개입니다. AI가 페이지 주제를 혼동할 수 있습니다.`,
      }
    },
  },
  {
    id: 'geo-10',
    category: 'geo',
    name: 'meta description 존재',
    maxPoints: 5,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const desc = data.layer1!.meta.description
      if (desc && desc.trim().length > 0) {
        return {
          passed: true,
          message:
            'meta description 설정됨 — AI가 페이지 요약으로 활용할 수 있습니다',
        }
      }
      return {
        passed: false,
        message:
          'meta description이 없습니다. AI가 페이지를 요약할 참고 정보가 부족합니다.',
      }
    },
  },
  {
    id: 'geo-11',
    category: 'geo',
    name: '제목 계층 구조',
    maxPoints: 5,
    severity: 'info',
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
          message:
            '제목 계층이 순차적 — AI가 콘텐츠 구조를 정확히 이해할 수 있습니다',
        }
      }
      return {
        passed: false,
        message:
          '제목 레벨이 건너뛰어져 있습니다. AI가 콘텐츠 구조를 잘못 해석할 수 있습니다.',
      }
    },
  },
  {
    id: 'geo-15',
    category: 'geo',
    name: '이미지 alt 속성',
    maxPoints: 5,
    severity: 'info',
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
          message: `전체 ${total}개 이미지에 alt 설정 — AI가 이미지 맥락을 이해할 수 있습니다`,
        }
      }
      return {
        passed: false,
        message: `${without_alt}개 이미지에 alt가 없습니다. AI가 이미지의 맥락을 파악할 수 없습니다.`,
      }
    },
  },

  // ─── 기술 기초 (15점) ───
  {
    id: 'geo-12',
    category: 'geo',
    name: 'canonical URL 설정',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const canonical = data.layer1!.meta.canonical
      if (canonical) {
        return {
          passed: true,
          message:
            'canonical URL 설정됨 — AI가 대표 페이지를 올바르게 인식합니다',
        }
      }
      return {
        passed: false,
        message:
          'canonical URL이 없습니다. AI가 중복 페이지를 별개로 인식할 수 있습니다.',
      }
    },
  },
  {
    id: 'geo-13',
    category: 'geo',
    name: 'SSL 유효 (신뢰 신호)',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer3Ssl,
    evaluate: (data) => {
      if (data.layer3!.ssl!.valid) {
        return {
          passed: true,
          message:
            'SSL 유효 — AI가 신뢰할 수 있는 출처로 판단하는 기본 조건 충족',
        }
      }
      return {
        passed: false,
        message:
          'SSL이 유효하지 않습니다. AI가 신뢰도 낮은 출처로 판단할 수 있습니다.',
      }
    },
  },

  // ─── 브랜드 신뢰 (10점) ───
  {
    id: 'geo-14',
    category: 'geo',
    name: 'Safe Browsing 안전',
    maxPoints: 10,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer2SafeBrowsing,
    evaluate: (data) => {
      if (data.layer2!.safe_browsing!.is_safe) {
        return {
          passed: true,
          message: 'Safe Browsing 안전 — AI가 위험 사이트로 분류하지 않습니다',
        }
      }
      return {
        passed: false,
        message:
          '위험 사이트로 감지되었습니다. AI가 이 사이트를 인용하지 않을 가능성이 높습니다.',
      }
    },
  },
]
