import type { RuleDefinition } from '../types'
import { hasLayer1, hasRobotsTxt } from './guards'

/** 소셜 & AI 접근성 룰 (8개, 80점) */
export const socialAiRules: RuleDefinition[] = [
  {
    id: 'soc-01',
    category: 'social-ai',
    name: '링크 공유 시 제목 표시',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const ogTitle = data.layer1!.meta.og['og:title']
      if (ogTitle) {
        return {
          passed: true,
          message:
            '카카오톡·페이스북에 링크를 보낼 때 제목이 정상적으로 표시됩니다.',
        }
      }
      return {
        passed: false,
        message:
          '카카오톡이나 페이스북에 링크를 보내면 제목이 비어 있어 아무도 클릭하지 않게 됩니다. 공유 미리보기 제목 설정이 필요합니다.',
      }
    },
  },
  {
    id: 'soc-02',
    category: 'social-ai',
    name: '링크 공유 시 설명 표시',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const ogDesc = data.layer1!.meta.og['og:description']
      if (ogDesc) {
        return {
          passed: true,
          message:
            '카카오톡·페이스북에 링크를 보낼 때 설명이 정상적으로 표시됩니다.',
        }
      }
      return {
        passed: false,
        message:
          '카카오톡이나 페이스북에 링크를 보내면 설명 없이 URL만 덩그러니 보입니다. 공유 미리보기 설명 설정이 필요합니다.',
      }
    },
  },
  {
    id: 'soc-03',
    category: 'social-ai',
    name: '링크 공유 시 이미지 표시',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const ogImage = data.layer1!.meta.og['og:image']
      if (ogImage) {
        return {
          passed: true,
          message:
            '카카오톡·페이스북에 링크를 보낼 때 이미지가 정상적으로 표시됩니다.',
        }
      }
      return {
        passed: false,
        message:
          '카카오톡이나 페이스북에 링크를 보내면 이미지 없이 밋밋하게 보입니다. 대표 이미지를 설정하면 클릭률이 크게 올라갑니다.',
      }
    },
  },
  {
    id: 'soc-04',
    category: 'social-ai',
    name: 'AI 소개 파일 존재',
    maxPoints: 10,
    severity: 'info',
    quickWinEligible: true,
    isEvaluable: (data) => data.llms_txt !== null,
    evaluate: (data) => {
      if (data.llms_txt!.exists) {
        return {
          passed: true,
          message:
            'AI 소개 파일(llms.txt)이 있어서 ChatGPT, Claude 같은 AI가 사이트를 잘 이해할 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'AI 소개 파일(llms.txt)이 없습니다. 이 파일은 "우리 사이트는 이런 곳이에요"라고 AI에게 알려주는 자기소개서 같은 역할을 합니다. 추가하면 AI 검색에서 추천될 가능성이 높아집니다.',
      }
    },
  },
  {
    id: 'soc-05',
    category: 'social-ai',
    name: 'ChatGPT 접근 허용',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['GPTBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return {
          passed: true,
          message:
            'ChatGPT가 사이트를 방문할 수 있어 AI 검색에서 추천될 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          'ChatGPT가 사이트에 접근하지 못하도록 막혀 있습니다. 이렇게 되면 누군가 ChatGPT에 관련 질문을 해도 우리 사이트가 추천되지 않습니다.',
      }
    },
  },
  {
    id: 'soc-06',
    category: 'social-ai',
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
            'Claude AI가 사이트를 방문할 수 있어 AI 검색에서 추천될 수 있습니다.',
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
    id: 'soc-07',
    category: 'social-ai',
    name: 'Perplexity AI 접근 허용',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const status = data.robots_txt!.ai_bots['PerplexityBot']
      if (status === 'allowed' || status === 'not_mentioned') {
        return {
          passed: true,
          message: 'Perplexity AI 검색에서 사이트가 노출될 수 있습니다.',
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
    id: 'soc-08',
    category: 'social-ai',
    name: 'Google 검색 접근 허용',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      if (data.robots_txt!.allows_googlebot) {
        return {
          passed: true,
          message: 'Google 검색에 사이트가 정상적으로 노출됩니다.',
        }
      }
      return {
        passed: false,
        message:
          'Google이 사이트에 접근하지 못하도록 막혀 있습니다. 이렇게 되면 Google에서 검색해도 우리 사이트가 전혀 나오지 않습니다. 즉시 수정이 필요합니다.',
      }
    },
  },
]
