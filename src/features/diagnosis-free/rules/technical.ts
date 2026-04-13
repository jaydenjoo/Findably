import type { RuleDefinition } from '../types'
import { SEO_THRESHOLDS } from '../constants'
import { hasLayer1, hasRobotsTxt } from './guards'

const hasSitemap = (data: { sitemap: unknown }): boolean =>
  data.sitemap !== null

/** 기술 SEO 룰 (10개, 80점) */
export const technicalRules: RuleDefinition[] = [
  {
    id: 'tech-01',
    category: 'technical',
    name: '사이트 언어 설정',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    difficulty: 'easy',
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const lang = data.layer1!.html_lang
      if (lang) {
        return {
          passed: true,
          message: `사이트 언어가 "${lang}"으로 설정되어 있어 Google이 어떤 언어의 사이트인지 알 수 있습니다.`,
        }
      }
      return {
        passed: false,
        message:
          '사이트 언어가 설정되지 않았습니다. Google이 이 사이트가 한국어인지 영어인지 판단하기 어려워 검색 노출이 줄어들 수 있습니다.',
      }
    },
  },
  {
    id: 'tech-02',
    category: 'technical',
    name: '문자 인코딩 설정',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    difficulty: 'easy',
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const charset = data.layer1!.meta.charset
      if (charset) {
        return {
          passed: true,
          message: `문자 인코딩이 "${charset}"으로 설정되어 한글이 깨지지 않습니다.`,
        }
      }
      return {
        passed: false,
        message:
          '문자 인코딩이 설정되지 않았습니다. 설정하지 않으면 한글이 깨져서 보일 수 있습니다.',
      }
    },
  },
  {
    id: 'tech-03',
    category: 'technical',
    name: '모바일 화면 설정',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    difficulty: 'easy',
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const viewport = data.layer1!.meta.viewport
      if (viewport) {
        return {
          passed: true,
          message: '모바일 화면 크기에 맞게 조정되도록 설정되어 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          '모바일 화면 설정이 없습니다. 스마트폰에서 사이트가 너무 작게 보이거나 좌우로 스크롤해야 할 수 있습니다.',
      }
    },
  },
  {
    id: 'tech-04',
    category: 'technical',
    name: '대표 URL 설정',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    difficulty: 'easy',
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const canonical = data.layer1!.meta.canonical
      if (canonical) {
        return {
          passed: true,
          message:
            '대표 URL이 설정되어 있어 Google이 어떤 페이지가 원본인지 알 수 있습니다.',
          evidence: canonical,
        }
      }
      return {
        passed: false,
        message:
          '대표 URL이 설정되지 않았습니다. 같은 내용이 여러 주소로 접근될 경우, Google이 어떤 것이 진짜인지 혼동하여 검색 순위가 분산될 수 있습니다.',
      }
    },
  },
  {
    id: 'tech-05',
    category: 'technical',
    name: '검색엔진 안내 파일',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    difficulty: 'medium',
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      if (data.robots_txt!.exists) {
        return {
          passed: true,
          message:
            '검색엔진 안내 파일(robots.txt)이 있어서 Google에게 "여기는 탐색해도 돼"라고 알려주고 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          '검색엔진 안내 파일(robots.txt)이 없습니다. 이 파일은 Google에게 사이트 탐색 규칙을 알려주는 안내문 같은 역할을 합니다.',
      }
    },
  },
  {
    id: 'tech-06',
    category: 'technical',
    name: '사이트 지도 파일',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    difficulty: 'medium',
    isEvaluable: hasSitemap,
    evaluate: (data) => {
      if (data.sitemap!.exists) {
        return {
          passed: true,
          message:
            '사이트 지도(sitemap.xml)가 있어서 Google이 모든 페이지를 쉽게 찾을 수 있습니다.',
        }
      }
      return {
        passed: false,
        message:
          '사이트 지도(sitemap.xml)가 없습니다. 사이트 지도는 마치 건물의 층별 안내도처럼, Google이 사이트의 모든 페이지를 빠르게 찾도록 도와줍니다.',
      }
    },
  },
  {
    id: 'tech-07',
    category: 'technical',
    name: '사이트 지도 페이지 수',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: (data) => data.sitemap !== null && data.sitemap.exists,
    evaluate: (data) => {
      const count = data.sitemap!.url_count
      if (count > 0) {
        return {
          passed: true,
          message: `사이트 지도에 ${count}개 페이지가 등록되어 있습니다.`,
        }
      }
      return {
        passed: false,
        message: '사이트 지도에 등록된 페이지가 없습니다.',
      }
    },
  },
  {
    id: 'tech-08',
    category: 'technical',
    name: '사이트 지도 최신 여부',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: (data) =>
      data.sitemap !== null &&
      data.sitemap.exists &&
      data.sitemap.last_modified !== null,
    evaluate: (data) => {
      const lastMod = new Date(data.sitemap!.last_modified!)
      const now = new Date()
      const diffDays = Math.floor(
        (now.getTime() - lastMod.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays <= SEO_THRESHOLDS.SITEMAP_STALE_DAYS) {
        return {
          passed: true,
          message: `최근 ${diffDays}일 전에 업데이트되어 최신 상태입니다.`,
        }
      }
      return {
        passed: false,
        message: `${diffDays}일 전에 마지막으로 업데이트되었습니다. ${SEO_THRESHOLDS.SITEMAP_STALE_DAYS}일 이내로 갱신하면 Google이 새 콘텐츠를 더 빨리 반영합니다.`,
      }
    },
  },
  {
    id: 'tech-09',
    category: 'technical',
    name: '사이트 지도 연결',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    difficulty: 'easy',
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const urls = data.robots_txt!.sitemap_urls
      if (urls.length > 0) {
        return {
          passed: true,
          message: `검색엔진 안내 파일에 사이트 지도가 ${urls.length}개 연결되어 있습니다.`,
        }
      }
      return {
        passed: false,
        message:
          '검색엔진 안내 파일에 사이트 지도가 연결되지 않았습니다. Google이 사이트 지도를 자동으로 찾기 어려워집니다.',
      }
    },
  },
  {
    id: 'tech-10',
    category: 'technical',
    name: '검색 노출 차단 여부',
    maxPoints: 10,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const robotsMeta = data.layer1!.meta.robots_meta
      if (!robotsMeta) {
        return {
          passed: true,
          message: '검색 노출을 막는 설정이 없어 정상적으로 검색에 나옵니다.',
        }
      }
      const lower = robotsMeta.toLowerCase()
      if (lower.includes('noindex') || lower.includes('nofollow')) {
        return {
          passed: false,
          message: `검색 차단 설정이 켜져 있습니다("${robotsMeta}"). 이 상태로는 Google에서 사이트가 전혀 검색되지 않습니다. 즉시 수정이 필요합니다.`,
        }
      }
      return {
        passed: true,
        message: '검색 노출을 막는 설정이 없어 정상적으로 검색에 나옵니다.',
      }
    },
  },
]
