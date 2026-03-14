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
    name: 'HTML lang 속성',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const lang = data.layer1!.html_lang
      if (lang) {
        return { passed: true, message: `lang="${lang}" 설정됨` }
      }
      return {
        passed: false,
        message:
          'HTML lang 속성이 없습니다. 검색엔진이 언어를 파악하기 어렵습니다.',
      }
    },
  },
  {
    id: 'tech-02',
    category: 'technical',
    name: 'charset 설정',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const charset = data.layer1!.meta.charset
      if (charset) {
        return { passed: true, message: `charset="${charset}" 설정됨` }
      }
      return {
        passed: false,
        message: 'charset 메타태그가 없습니다. UTF-8 설정을 권장합니다.',
      }
    },
  },
  {
    id: 'tech-03',
    category: 'technical',
    name: 'viewport 메타태그',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const viewport = data.layer1!.meta.viewport
      if (viewport) {
        return { passed: true, message: 'viewport 메타태그 설정됨' }
      }
      return {
        passed: false,
        message: 'viewport 메타태그가 없습니다. 모바일 표시에 문제가 생깁니다.',
      }
    },
  },
  {
    id: 'tech-04',
    category: 'technical',
    name: 'canonical URL',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const canonical = data.layer1!.meta.canonical
      if (canonical) {
        return { passed: true, message: 'canonical URL 설정됨' }
      }
      return {
        passed: false,
        message:
          'canonical URL이 없습니다. 중복 콘텐츠 문제가 발생할 수 있습니다.',
      }
    },
  },
  {
    id: 'tech-05',
    category: 'technical',
    name: 'robots.txt 존재',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      if (data.robots_txt!.exists) {
        return { passed: true, message: 'robots.txt 파일이 존재합니다' }
      }
      return {
        passed: false,
        message: 'robots.txt가 없습니다. 크롤러 접근 제어가 불가능합니다.',
      }
    },
  },
  {
    id: 'tech-06',
    category: 'technical',
    name: 'sitemap.xml 존재',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: hasSitemap,
    evaluate: (data) => {
      if (data.sitemap!.exists) {
        return { passed: true, message: 'sitemap.xml이 존재합니다' }
      }
      return {
        passed: false,
        message:
          'sitemap.xml이 없습니다. 검색엔진이 페이지를 발견하기 어렵습니다.',
      }
    },
  },
  {
    id: 'tech-07',
    category: 'technical',
    name: 'sitemap URL 수',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: (data) => data.sitemap !== null && data.sitemap.exists,
    evaluate: (data) => {
      const count = data.sitemap!.url_count
      if (count > 0) {
        return { passed: true, message: `sitemap에 ${count}개 URL 포함` }
      }
      return {
        passed: false,
        message: 'sitemap에 URL이 없습니다.',
      }
    },
  },
  {
    id: 'tech-08',
    category: 'technical',
    name: 'sitemap 최근 갱신',
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
          message: `최근 ${diffDays}일 전 갱신됨`,
        }
      }
      return {
        passed: false,
        message: `${diffDays}일 전 갱신. ${SEO_THRESHOLDS.SITEMAP_STALE_DAYS}일 이내 갱신을 권장합니다.`,
      }
    },
  },
  {
    id: 'tech-09',
    category: 'technical',
    name: 'sitemap robots.txt에 선언',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    isEvaluable: hasRobotsTxt,
    evaluate: (data) => {
      const urls = data.robots_txt!.sitemap_urls
      if (urls.length > 0) {
        return {
          passed: true,
          message: `robots.txt에 sitemap ${urls.length}개 선언됨`,
        }
      }
      return {
        passed: false,
        message:
          'robots.txt에 sitemap 경로가 선언되지 않았습니다. 크롤러가 sitemap을 찾기 어렵습니다.',
      }
    },
  },
  {
    id: 'tech-10',
    category: 'technical',
    name: 'robots meta 제한 없음',
    maxPoints: 10,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer1,
    evaluate: (data) => {
      const robotsMeta = data.layer1!.meta.robots_meta
      if (!robotsMeta) {
        return { passed: true, message: 'robots 메타태그 제한 없음' }
      }
      const lower = robotsMeta.toLowerCase()
      if (lower.includes('noindex') || lower.includes('nofollow')) {
        return {
          passed: false,
          message: `robots 메타태그에 "${robotsMeta}" 설정됨. 검색 노출이 차단됩니다.`,
        }
      }
      return {
        passed: true,
        message: `robots 메타태그: "${robotsMeta}" (검색 차단 없음)`,
      }
    },
  },
]
