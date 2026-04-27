import type { RuleDefinition } from '../types'
import { SEO_THRESHOLDS } from '../constants'
import { hasLayer2Crux, hasValidPageSize, hasValidLoadTime } from './guards'

const hasLayer2Pagespeed = (data: {
  layer2: { pagespeed: unknown } | null
}): boolean => data.layer2 !== null && data.layer2.pagespeed !== null

/** 성능 룰 (8개, 80점) */
export const performanceRules: RuleDefinition[] = [
  {
    id: 'perf-01',
    category: 'performance',
    name: 'PageSpeed 점수 50+',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer2Pagespeed,
    evaluate: (data) => {
      const score = data.layer2!.pagespeed!.performance_score
      if (score >= SEO_THRESHOLDS.MIN_PSI_SCORE) {
        return {
          passed: true,
          message: `PageSpeed 점수 ${score}점 (Google 시뮬레이션 기준)`,
        }
      }
      return {
        passed: false,
        message: `PageSpeed 점수 ${score}점 (${SEO_THRESHOLDS.MIN_PSI_SCORE}점 이상 권장, Google 시뮬레이션 기준). 페이지 속도를 개선하세요.`,
      }
    },
  },
  {
    id: 'perf-02',
    category: 'performance',
    name: 'LCP 2.5초 이하',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer2Pagespeed,
    evaluate: (data) => {
      const lcp = data.layer2!.pagespeed!.lcp_ms
      const lcpSec = (lcp / 1000).toFixed(1)
      if (lcp <= SEO_THRESHOLDS.MAX_LCP_MS) {
        return {
          passed: true,
          message: `LCP ${lcpSec}초`,
        }
      }
      // LCP > 20초는 STALE 캐시 응답 등 비현실 값일 가능성 → 가드 메시지로 환각 차단
      const unreliable = lcp > 20000
      return {
        passed: false,
        message: unreliable
          ? `LCP ${lcpSec}초 (⚠️ 20초 초과 — 캐시 STALE 응답 또는 일시적 장애 가능성. 정확한 측정을 위해 재진단 권고)`
          : `LCP ${lcpSec}초 (${SEO_THRESHOLDS.MAX_LCP_MS / 1000}초 이하 권장). 메인 콘텐츠 로딩이 느립니다.`,
      }
    },
  },
  {
    id: 'perf-03',
    category: 'performance',
    name: 'INP 200ms 이하 (CrUX 실측)',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    // Fix 6C: FID는 2024-03부터 Google Core Web Vitals에서 폐기 → INP로 대체.
    // CrUX(실제 사용자 데이터) inp_ms 있을 때만 평가. 없으면 skip (FID 평가 안 함).
    isEvaluable: hasLayer2Crux,
    evaluate: (data) => {
      const inp = data.layer2!.crux!.inp_ms
      const INP_GOOD_MS = 200
      if (inp <= INP_GOOD_MS) {
        return {
          passed: true,
          message: `INP ${inp}ms (실제 사용자 데이터, ${INP_GOOD_MS}ms 이하 권장 충족)`,
        }
      }
      return {
        passed: false,
        message: `INP ${inp}ms (${INP_GOOD_MS}ms 이하 권장). 사용자 인터랙션 반응이 느립니다.`,
      }
    },
  },
  {
    id: 'perf-04',
    category: 'performance',
    name: 'CLS 0.1 이하',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer2Pagespeed,
    evaluate: (data) => {
      const cls = data.layer2!.pagespeed!.cls
      if (cls <= SEO_THRESHOLDS.MAX_CLS) {
        return { passed: true, message: `CLS ${cls.toFixed(3)}` }
      }
      return {
        passed: false,
        message: `CLS ${cls.toFixed(3)} (${SEO_THRESHOLDS.MAX_CLS} 이하 권장). 레이아웃이 불안정합니다.`,
      }
    },
  },
  {
    id: 'perf-05',
    category: 'performance',
    name: 'TTFB 800ms 이하',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer2Pagespeed,
    evaluate: (data) => {
      const ttfb = data.layer2!.pagespeed!.ttfb_ms
      if (ttfb <= SEO_THRESHOLDS.MAX_TTFB_MS) {
        return { passed: true, message: `TTFB ${ttfb}ms` }
      }
      return {
        passed: false,
        message: `TTFB ${ttfb}ms (${SEO_THRESHOLDS.MAX_TTFB_MS}ms 이하 권장). 서버 응답이 느립니다.`,
      }
    },
  },
  {
    id: 'perf-06',
    category: 'performance',
    name: '페이지 크기 3MB 이하',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: true,
    difficulty: 'hard',
    isEvaluable: hasValidPageSize,
    evaluate: (data) => {
      const bytes = data.layer1!.page_size_bytes
      const maxMB = SEO_THRESHOLDS.MAX_PAGE_SIZE_BYTES / (1024 * 1024)
      if (bytes <= SEO_THRESHOLDS.MAX_PAGE_SIZE_BYTES) {
        return {
          passed: true,
          message: `페이지 크기 ${(bytes / (1024 * 1024)).toFixed(1)}MB`,
        }
      }
      return {
        passed: false,
        message: `페이지 크기 ${(bytes / (1024 * 1024)).toFixed(1)}MB (${maxMB}MB 이하 권장). 로딩 시간이 길어집니다.`,
      }
    },
  },
  {
    id: 'perf-07',
    category: 'performance',
    name: '로딩 시간 3초 이하',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasValidLoadTime,
    evaluate: (data) => {
      const ms = data.layer1!.load_time_ms
      if (ms <= SEO_THRESHOLDS.MAX_LOAD_TIME_MS) {
        return {
          passed: true,
          message: `로딩 시간 ${(ms / 1000).toFixed(1)}초`,
        }
      }
      return {
        passed: false,
        message: `로딩 시간 ${(ms / 1000).toFixed(1)}초 (${SEO_THRESHOLDS.MAX_LOAD_TIME_MS / 1000}초 이하 권장).`,
      }
    },
  },
  {
    id: 'perf-08',
    category: 'performance',
    name: 'CrUX LCP 양호',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: hasLayer2Crux,
    evaluate: (data) => {
      const lcp = data.layer2!.crux!.lcp_ms
      if (lcp <= SEO_THRESHOLDS.MAX_LCP_MS) {
        return {
          passed: true,
          message: `CrUX LCP ${(lcp / 1000).toFixed(1)}초 (실제 사용자 데이터)`,
        }
      }
      return {
        passed: false,
        message: `CrUX LCP ${(lcp / 1000).toFixed(1)}초. 실제 사용자 경험이 느립니다.`,
      }
    },
  },
]
