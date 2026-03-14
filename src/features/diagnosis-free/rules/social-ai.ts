import type { RuleDefinition } from '../types'
import { hasLayer1, hasRobotsTxt } from './guards'

/** 소셜 & AI 접근성 룰 (8개, 80점) */
export const socialAiRules: RuleDefinition[] = [
  {
    id: 'soc-01',
    category: 'social-ai',
    name: 'OG title 존재',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const ogTitle = data.layer1!.meta.og['og:title']
      if (ogTitle) {
        return { passed: true, message: 'og:title 설정됨' }
      }
      return {
        passed: false,
        message: 'og:title이 없습니다. SNS 공유 시 제목이 표시되지 않습니다.',
      }
    },
  },
  {
    id: 'soc-02',
    category: 'social-ai',
    name: 'OG description 존재',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const ogDesc = data.layer1!.meta.og['og:description']
      if (ogDesc) {
        return { passed: true, message: 'og:description 설정됨' }
      }
      return {
        passed: false,
        message:
          'og:description이 없습니다. SNS 공유 시 설명이 표시되지 않습니다.',
      }
    },
  },
  {
    id: 'soc-03',
    category: 'social-ai',
    name: 'OG image 존재',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const ogImage = data.layer1!.meta.og['og:image']
      if (ogImage) {
        return { passed: true, message: 'og:image 설정됨' }
      }
      return {
        passed: false,
        message: 'og:image가 없습니다. SNS 공유 시 이미지가 표시되지 않습니다.',
      }
    },
  },
  {
    id: 'soc-04',
    category: 'social-ai',
    name: 'llms.txt 존재',
    maxPoints: 10,
    severity: 'info',
    quickWinEligible: true,
    isEvaluable: (data) => data.llms_txt !== null,
    evaluate: (data) => {
      if (data.llms_txt!.exists) {
        return {
          passed: true,
          message: 'llms.txt가 존재합니다. AI가 사이트를 이해하기 쉽습니다.',
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
    id: 'soc-05',
    category: 'social-ai',
    name: 'GPTBot 접근 허용',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['GPTBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return { passed: true, message: 'GPTBot 접근 허용됨' }
      }
      return {
        passed: false,
        message:
          'GPTBot이 차단되어 있습니다. ChatGPT가 사이트 콘텐츠를 학습/인용할 수 없습니다.',
      }
    },
  },
  {
    id: 'soc-06',
    category: 'social-ai',
    name: 'ClaudeBot 접근 허용',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['ClaudeBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return { passed: true, message: 'ClaudeBot 접근 허용됨' }
      }
      return {
        passed: false,
        message:
          'ClaudeBot이 차단되어 있습니다. Claude가 사이트 콘텐츠를 인용할 수 없습니다.',
      }
    },
  },
  {
    id: 'soc-07',
    category: 'social-ai',
    name: 'PerplexityBot 접근 허용',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['PerplexityBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return { passed: true, message: 'PerplexityBot 접근 허용됨' }
      }
      return {
        passed: false,
        message:
          'PerplexityBot이 차단되어 있습니다. Perplexity AI 검색에서 노출되지 않습니다.',
      }
    },
  },
  {
    id: 'soc-08',
    category: 'social-ai',
    name: 'Googlebot 접근 허용',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      if (data.robots_txt!.allows_googlebot) {
        return { passed: true, message: 'Googlebot 접근 허용됨' }
      }
      return {
        passed: false,
        message:
          'Googlebot이 차단되어 있습니다. Google 검색에 사이트가 노출되지 않습니다.',
      }
    },
  },
]
