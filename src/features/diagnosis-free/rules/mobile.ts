import type { RuleDefinition } from '../types'
import { SEO_THRESHOLDS } from '../constants'
import { hasLayer2Crux } from './guards'

const hasMobile = (data: { mobile: unknown }): boolean => data.mobile !== null

/** 모바일 룰 (6개, 55점) */
export const mobileRules: RuleDefinition[] = [
  {
    id: 'mob-01',
    category: 'mobile',
    name: 'viewport 설정',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: true,
    isEvaluable: hasMobile,
    evaluate: (data) => {
      if (data.mobile!.viewport_configured) {
        return { passed: true, message: '모바일 viewport 설정됨' }
      }
      return {
        passed: false,
        message:
          '모바일 viewport가 설정되지 않았습니다. 모바일에서 올바르게 표시되지 않습니다.',
      }
    },
  },
  {
    id: 'mob-02',
    category: 'mobile',
    name: '터치 친화성',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasMobile,
    evaluate: (data) => {
      if (data.mobile!.touch_friendly) {
        return { passed: true, message: '터치 친화적 인터페이스' }
      }
      return {
        passed: false,
        message:
          '터치 친화적이지 않습니다. 버튼/링크 간격이 너무 좁을 수 있습니다.',
      }
    },
  },
  {
    id: 'mob-03',
    category: 'mobile',
    name: '모바일 이슈 없음',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasMobile,
    evaluate: (data) => {
      const issues = data.mobile!.issues
      if (issues.length === 0) {
        return { passed: true, message: '모바일 이슈 없음' }
      }
      return {
        passed: false,
        message: `모바일 이슈 ${issues.length}건: ${issues.slice(0, 3).join(', ')}`,
      }
    },
  },
  {
    id: 'mob-04',
    category: 'mobile',
    name: 'CrUX INP 200ms 이하',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: hasLayer2Crux,
    evaluate: (data) => {
      const inp = data.layer2!.crux!.inp_ms
      if (inp <= SEO_THRESHOLDS.MAX_INP_MS) {
        return {
          passed: true,
          message: `INP ${inp}ms (실제 사용자 데이터)`,
        }
      }
      return {
        passed: false,
        message: `INP ${inp}ms (${SEO_THRESHOLDS.MAX_INP_MS}ms 이하 권장). 사용자 인터랙션 반응이 느립니다.`,
      }
    },
  },
  {
    id: 'mob-05',
    category: 'mobile',
    name: 'CrUX FCP 1.8초 이하',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: hasLayer2Crux,
    evaluate: (data) => {
      const fcp = data.layer2!.crux!.fcp_ms
      if (fcp <= SEO_THRESHOLDS.MAX_FCP_MS) {
        return {
          passed: true,
          message: `FCP ${(fcp / 1000).toFixed(1)}초 (실제 사용자 데이터)`,
        }
      }
      return {
        passed: false,
        message: `FCP ${(fcp / 1000).toFixed(1)}초 (${SEO_THRESHOLDS.MAX_FCP_MS / 1000}초 이하 권장). 첫 콘텐츠 표시가 느립니다.`,
      }
    },
  },
  {
    id: 'mob-06',
    category: 'mobile',
    name: 'CrUX 모바일 데이터 존재',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: hasLayer2Crux,
    evaluate: (data) => {
      const formFactors = data.layer2!.crux!.form_factors
      if (formFactors && Object.keys(formFactors).length > 0) {
        return {
          passed: true,
          message: `CrUX 폼팩터 데이터 존재 (${Object.keys(formFactors).join(', ')})`,
        }
      }
      return {
        passed: false,
        message:
          'CrUX에 폼팩터별 데이터가 없습니다. 트래픽이 충분하지 않을 수 있습니다.',
      }
    },
  },
]
