import type { RuleDefinition } from '../types'
import { AI_CITATION_THRESHOLDS, GEO_THRESHOLDS } from '../constants'
import { calculateAICitationPossibility } from './ai-citation-helpers'
import {
  hasLayer1,
  hasLayer2SafeBrowsing,
  hasLayer3Ssl,
  hasLlmsTxt,
  hasRobotsTxt,
} from './guards'

/** GEO 룰 (17개, 165점) — AI 검색 최적화 */
export const geoRules: RuleDefinition[] = [
  // ─── AI 인용 가능성 (25점) ───
  {
    id: 'geo-01',
    category: 'geo',
    name: 'AI 소개 파일 존재',
    maxPoints: 15,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLlmsTxt,
    evaluate: (data) => {
      if (data.llms_txt!.exists) {
        return {
          passed: true,
          message:
            'AI 소개 파일(llms.txt)이 있어서 ChatGPT, Claude 같은 AI가 사이트를 구조적으로 이해할 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'AI 소개 파일(llms.txt)이 없습니다. 이 파일은 "우리 사이트는 이런 서비스를 제공해요"라고 AI에게 알려주는 자기소개서 같은 역할을 합니다. 추가하면 AI 검색에서 추천될 가능성이 높아집니다.',
      }
    },
  },
  {
    id: 'geo-02',
    category: 'geo',
    name: 'AI 소개 파일 충실도',
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
          message: `AI 소개 파일이 ${length}자, ${sections}개 섹션으로 충분히 상세합니다.`,
        }
      }

      const issues: string[] = []
      if (length < GEO_THRESHOLDS.MIN_LLMS_TXT_LENGTH) {
        issues.push(
          `내용이 ${length}자로 짧습니다(${GEO_THRESHOLDS.MIN_LLMS_TXT_LENGTH}자 이상 권장)`
        )
      }
      if (sections < GEO_THRESHOLDS.MIN_LLMS_TXT_SECTIONS) {
        issues.push(
          `섹션이 ${sections}개뿐입니다(${GEO_THRESHOLDS.MIN_LLMS_TXT_SECTIONS}개 이상 권장)`
        )
      }
      return {
        passed: false,
        message: `AI 소개 파일의 내용이 부족합니다: ${issues.join(', ')}. 사이트 소개, 주요 서비스, 연락처 등을 추가하면 AI가 더 정확히 이해합니다.`,
      }
    },
  },

  // ─── 플랫폼 최적화 (40점) ───
  {
    id: 'geo-03',
    category: 'geo',
    name: 'ChatGPT 접근 허용',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['GPTBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return {
          passed: true,
          message:
            'ChatGPT가 사이트를 방문할 수 있어서, 누군가 ChatGPT에 관련 질문을 하면 우리 사이트가 추천될 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'ChatGPT가 사이트에 접근하지 못하도록 막혀 있습니다. 이러면 누군가 ChatGPT에 관련 질문을 해도 우리 사이트는 절대 추천되지 않습니다.',
      }
    },
  },
  {
    id: 'geo-04',
    category: 'geo',
    name: 'Claude AI 접근 허용',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['ClaudeBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return {
          passed: true,
          message:
            'Claude AI가 사이트를 방문할 수 있어서 AI 검색에서 추천될 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'Claude AI가 사이트에 접근하지 못하도록 막혀 있습니다. Claude를 사용하는 사람들에게 우리 사이트가 추천되지 않습니다.',
      }
    },
  },
  {
    id: 'geo-05',
    category: 'geo',
    name: 'Perplexity AI 접근 허용',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['PerplexityBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return {
          passed: true,
          message: 'Perplexity AI에서 사이트가 검색·추천될 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'Perplexity AI가 사이트에 접근하지 못하도록 막혀 있습니다. Perplexity에서 검색해도 우리 사이트가 나오지 않습니다.',
      }
    },
  },
  {
    id: 'geo-06',
    category: 'geo',
    name: 'Google AI 검색 접근 허용',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      if (data.robots_txt!.allows_googlebot) {
        return {
          passed: true,
          message:
            'Google AI 요약(AI Overview)에서 사이트 내용이 인용될 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'Google이 사이트에 접근하지 못하도록 막혀 있습니다. Google 검색의 AI 요약에서도 우리 사이트가 인용되지 않습니다.',
      }
    },
  },

  // ─── 구조화 데이터 (25점) ───
  {
    id: 'geo-07',
    category: 'geo',
    name: '사이트 정보 구조화 코드',
    maxPoints: 15,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const schemas = data.layer1!.schema_markup
      if (schemas.length > 0) {
        return {
          passed: true,
          message: `Google과 AI에게 사이트 정보를 알려주는 구조화 코드가 ${schemas.length}개 설정되어 있어, AI가 사이트의 종류와 내용을 정확히 파악할 수 있습니다.`,
        }
      }
      return {
        passed: false,
        message:
          'Google과 AI에게 사이트 정보를 알려주는 구조화 코드가 없습니다. 마치 명함 없이 자기소개하는 것과 같아서, AI가 이 사이트가 어떤 종류의 서비스인지 파악하기 어렵습니다.',
      }
    },
  },
  {
    id: 'geo-08',
    category: 'geo',
    name: '구조화 코드 다양성',
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
          message: `구조화 코드가 ${types.size}종류(${[...types].join(', ')})로 다양하여 AI가 사이트를 여러 관점에서 이해할 수 있습니다.`,
        }
      }
      return {
        passed: false,
        message: `구조화 코드가 ${types.size}종류뿐입니다. 회사 정보, FAQ, 서비스 소개 등 다양한 정보를 추가하면 AI가 사이트를 더 잘 이해합니다(${GEO_THRESHOLDS.MIN_SCHEMA_TYPES}종 이상 권장).`,
      }
    },
  },

  // ─── 콘텐츠 품질 (20점) ───
  {
    id: 'geo-09',
    category: 'geo',
    name: '대표 제목으로 주제 전달',
    maxPoints: 5,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const h1Count = data.layer1!.headings.h1.length
      if (h1Count === 1) {
        return {
          passed: true,
          message:
            '대표 제목(H1)이 1개로 명확하여 AI가 이 페이지의 핵심 주제를 바로 파악할 수 있습니다.',
        }
      }
      if (h1Count === 0) {
        return {
          passed: false,
          message:
            '페이지의 대표 제목이 없습니다. AI가 이 페이지의 핵심 주제를 파악할 수 없어 AI 검색에서 추천되기 어렵습니다.',
        }
      }
      return {
        passed: false,
        message: `대표 제목이 ${h1Count}개입니다. 하나만 있어야 AI가 주제를 정확히 파악합니다.`,
      }
    },
  },
  {
    id: 'geo-10',
    category: 'geo',
    name: '검색 결과 설명문 (AI용)',
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
            '검색 결과 설명문이 있어서 AI가 페이지를 요약할 때 참고할 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          '검색 결과 설명문이 없습니다. AI가 페이지를 요약할 때 참고할 정보가 부족하여 부정확하게 설명할 수 있습니다.',
      }
    },
  },
  {
    id: 'geo-11',
    category: 'geo',
    name: '제목 계층 구조 (AI 이해도)',
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
            '제목이 대제목→소제목→세부제목 순서로 잘 정리되어 있어 AI가 콘텐츠 구조를 정확히 이해합니다.',
        }
      }
      return {
        passed: false,
        message:
          '제목 순서가 뒤섞여 있습니다. 마치 책 목차가 1장→3장으로 건너뛰는 것처럼, AI가 콘텐츠 구조를 잘못 해석할 수 있습니다.',
      }
    },
  },
  {
    id: 'geo-15',
    category: 'geo',
    name: '이미지 설명 텍스트 (AI 이해용)',
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
          message: `전체 ${total}개 이미지에 설명 텍스트가 있어서 AI가 이미지 내용까지 이해할 수 있습니다.`,
        }
      }
      return {
        passed: false,
        message: `${without_alt}개 이미지에 설명 텍스트가 없습니다. 설명이 없으면 AI가 이미지의 내용을 전혀 알 수 없어 해당 정보를 활용하지 못합니다.`,
      }
    },
  },

  // ─── 기술 기초 (15점) ───
  {
    id: 'geo-12',
    category: 'geo',
    name: '대표 URL 설정 (AI 혼동 방지)',
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
            '대표 URL이 설정되어 있어 AI가 어떤 페이지가 원본인지 정확히 알 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          '대표 URL이 설정되지 않았습니다. 같은 내용이 여러 주소로 접근되면, AI가 중복 페이지를 별개로 인식하여 혼란이 생깁니다.',
      }
    },
  },
  {
    id: 'geo-13',
    category: 'geo',
    name: '보안 인증서 (AI 신뢰 판단)',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer3Ssl,
    evaluate: (data) => {
      if (data.layer3!.ssl!.valid) {
        return {
          passed: true,
          message:
            '보안 인증서(SSL)가 유효하여 주소창에 자물쇠가 표시됩니다. AI가 안전한 사이트로 판단하는 기본 조건을 충족합니다.',
        }
      }
      return {
        passed: false,
        message:
          '보안 인증서가 유효하지 않아 주소창에 "안전하지 않음"이 표시됩니다. AI가 신뢰도 낮은 사이트로 판단하여 추천을 꺼릴 수 있습니다.',
      }
    },
  },

  // ─── 브랜드 신뢰 (10점) ───
  {
    id: 'geo-14',
    category: 'geo',
    name: 'Google 안전성 검사',
    maxPoints: 10,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer2SafeBrowsing,
    evaluate: (data) => {
      if (data.layer2!.safe_browsing!.is_safe) {
        return {
          passed: true,
          message:
            'Google 안전성 검사를 통과했습니다. 위험 사이트로 분류되지 않아 AI가 안심하고 추천할 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'Google에 의해 위험 사이트로 감지되었습니다. 이 상태에서는 AI가 절대 이 사이트를 추천하지 않습니다. 즉시 보안 점검이 필요합니다.',
      }
    },
  },

  // ─── AI 인용 가능성 종합 (30점) ───
  {
    id: 'geo-16',
    category: 'geo',
    name: 'AI 인용 가능성 종합',
    maxPoints: 30,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const result = calculateAICitationPossibility(data)

      if (result.passed) {
        return {
          passed: true,
          message: `AI 인용 가능성 ${result.overallScore}점 — ${result.recommendation}`,
        }
      }
      return {
        passed: false,
        message: `AI 인용 가능성 ${result.overallScore}점 (${AI_CITATION_THRESHOLDS.PASS_SCORE}점 이상 권장). ${result.recommendation}`,
      }
    },
  },
  {
    id: 'geo-17',
    category: 'geo',
    name: 'AI 플랫폼별 인용 분석',
    maxPoints: 0,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const result = calculateAICitationPossibility(data)
      const breakdown = result.platforms
        .map(
          (p) =>
            `${p.platformLabel}: ${p.score}점${p.blocked ? ' (차단됨)' : ''}`
        )
        .join(' / ')

      return {
        passed: result.passed,
        message: `플랫폼별 AI 추천 가능성 — ${breakdown}. 이 점수는 사이트 구조 기반 예상값입니다. 실제 AI가 추천하는지는 유료 진단에서 확인할 수 있습니다.`,
      }
    },
  },
]
