import type { RuleDefinition } from '../types'
import { SEO_THRESHOLDS } from '../constants'
import { hasLayer2SafeBrowsing, hasLayer3Ssl } from './guards'

/** 보안 룰 (6개, 60점) */
export const securityRules: RuleDefinition[] = [
  {
    id: 'sec-01',
    category: 'security',
    name: 'Safe Browsing 안전',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer2SafeBrowsing,
    evaluate: (data) => {
      if (data.layer2!.safe_browsing!.is_safe) {
        return {
          passed: true,
          message: 'Google Safe Browsing에서 안전한 사이트로 확인됨',
        }
      }
      return {
        passed: false,
        message:
          'Google Safe Browsing에서 위험 사이트로 감지됨. 즉시 조치가 필요합니다.',
      }
    },
  },
  {
    id: 'sec-02',
    category: 'security',
    name: '보안 위협 없음',
    maxPoints: 10,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer2SafeBrowsing,
    evaluate: (data) => {
      const threats = data.layer2!.safe_browsing!.threats
      if (threats.length === 0) {
        return { passed: true, message: '보안 위협 없음' }
      }
      return {
        passed: false,
        message: `보안 위협 ${threats.length}건 감지: ${threats.join(', ')}`,
      }
    },
  },
  {
    id: 'sec-03',
    category: 'security',
    name: 'SSL 인증서 유효',
    maxPoints: 15,
    severity: 'critical',
    quickWinEligible: false,
    isEvaluable: hasLayer3Ssl,
    evaluate: (data) => {
      if (data.layer3!.ssl!.valid) {
        return {
          passed: true,
          message: `SSL 유효 (발급: ${data.layer3!.ssl!.issuer})`,
        }
      }
      return {
        passed: false,
        message:
          'SSL 인증서가 유효하지 않습니다. HTTPS 연결이 안전하지 않습니다.',
      }
    },
  },
  {
    id: 'sec-04',
    category: 'security',
    name: 'SSL 등급 A 이상',
    maxPoints: 5,
    severity: 'info',
    quickWinEligible: false,
    isEvaluable: hasLayer3Ssl,
    evaluate: (data) => {
      const grade = data.layer3!.ssl!.grade
      if (grade === 'A' || grade === 'A+') {
        return { passed: true, message: `SSL 등급 ${grade}` }
      }
      return {
        passed: false,
        message: `SSL 등급 ${grade} (A 이상 권장). 보안 설정을 강화하세요.`,
      }
    },
  },
  {
    id: 'sec-05',
    category: 'security',
    name: 'SSL 만료 30일+ 여유',
    maxPoints: 5,
    severity: 'warning',
    quickWinEligible: true,
    isEvaluable: (data) =>
      data.layer3 !== null &&
      data.layer3.ssl !== null &&
      data.layer3.ssl.expires_at !== null,
    evaluate: (data) => {
      const expiresAt = new Date(data.layer3!.ssl!.expires_at!)
      const now = new Date()
      const daysLeft = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysLeft >= SEO_THRESHOLDS.SSL_EXPIRY_WARNING_DAYS) {
        return {
          passed: true,
          message: `SSL 만료까지 ${daysLeft}일 남음`,
        }
      }
      if (daysLeft <= 0) {
        return {
          passed: false,
          message: 'SSL 인증서가 만료되었습니다. 즉시 갱신이 필요합니다.',
        }
      }
      return {
        passed: false,
        message: `SSL 만료까지 ${daysLeft}일 남음 (${SEO_THRESHOLDS.SSL_EXPIRY_WARNING_DAYS}일 이상 권장). 갱신을 준비하세요.`,
      }
    },
  },
  {
    id: 'sec-06',
    category: 'security',
    name: 'Observatory 등급 B 이상',
    maxPoints: 10,
    severity: 'warning',
    quickWinEligible: false,
    isEvaluable: (data) =>
      data.layer3 !== null &&
      data.layer3.observatory !== null &&
      data.layer3.observatory.grade !== null,
    evaluate: (data) => {
      const grade = data.layer3!.observatory!.grade!
      const passingGrades = ['A+', 'A', 'A-', 'B+', 'B']
      if (passingGrades.includes(grade)) {
        return {
          passed: true,
          message: `Mozilla Observatory 등급 ${grade}`,
        }
      }
      return {
        passed: false,
        message: `Mozilla Observatory 등급 ${grade} (B 이상 권장). 보안 헤더를 점검하세요.`,
      }
    },
  },
]
