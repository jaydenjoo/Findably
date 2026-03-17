import type { Layer3Data } from '@/features/crawling/types'
import { SCORING } from '@/config/scoring'
import type { SecurityScore, SecurityCategoryScore } from './types'

// ─── config/scoring에서 상수 참조 (OST) ───

const SSL_GRADES = SCORING.SSL_GRADE_SCORES
const PROTOCOL_SCORES = SCORING.SSL_PROTOCOL_SCORES
const EXPIRY_THRESHOLDS = SCORING.CERT_EXPIRY_THRESHOLDS
const MAX_SCORES = SCORING.SECURITY_MAX_SCORES

// ─── SSL 등급 점수 (40점 만점) ───

function scoreSslGrade(
  grade: string | null
): SecurityCategoryScore & { grade: string | null } {
  const maxScore = MAX_SCORES.sslGrade
  if (!grade) return { score: 0, maxScore, grade }

  const score = SSL_GRADES[grade] ?? 0
  return { score, maxScore, grade }
}

// ─── TLS 프로토콜 점수 (15점 만점, 최고 버전 기준) ───

function scoreSslProtocol(
  protocols: string[]
): SecurityCategoryScore & { bestProtocol: string | null } {
  const maxScore = MAX_SCORES.sslProtocol

  if (protocols.length === 0) {
    return { score: 0, maxScore, bestProtocol: null }
  }

  let bestScore = 0
  // length > 0이 위에서 보장됨
  let bestProtocol: string = protocols[0]!

  for (const protocol of protocols) {
    const s = PROTOCOL_SCORES[protocol] ?? 0
    if (s > bestScore) {
      bestScore = s
      bestProtocol = protocol
    }
  }

  return { score: bestScore, maxScore, bestProtocol }
}

// ─── 인증서 만료 점수 (15점 만점) ───

function scoreCertExpiry(
  expiresAt: string | null
): SecurityCategoryScore & { daysRemaining: number | null } {
  const maxScore = MAX_SCORES.certExpiry

  if (!expiresAt) {
    return { score: 0, maxScore, daysRemaining: null }
  }

  const expiryDate = new Date(expiresAt)
  if (Number.isNaN(expiryDate.getTime())) {
    return { score: 0, maxScore, daysRemaining: null }
  }

  const now = new Date()
  const diffMs = expiryDate.getTime() - now.getTime()
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) {
    return { score: 0, maxScore, daysRemaining }
  }

  const found = EXPIRY_THRESHOLDS.find((t) => daysRemaining >= t.minDays)
  const score = found?.score ?? 0

  return { score, maxScore, daysRemaining }
}

// ─── 보안 헤더 점수 (30점 만점, Observatory 기반) ───

function scoreSecurityHeaders(
  observatory: Layer3Data['observatory']
): SecurityCategoryScore & { grade: string | null; issues: string[] } {
  const maxScore = MAX_SCORES.securityHeaders

  if (!observatory || observatory.score === null) {
    return { score: 0, maxScore, grade: null, issues: [] }
  }

  // Observatory score: 0-135+ → 0-30 정규화
  // 100+ = 만점, 0 이하 = 0점
  const rawScore = Math.max(0, observatory.score)
  const normalized = Math.min(maxScore, Math.round((rawScore / 100) * maxScore))

  return {
    score: normalized,
    maxScore,
    grade: observatory.grade,
    issues: observatory.issues,
  }
}

// ─── 데이터 소스 판별 ───

function determineDataSource(
  layer3: Layer3Data | null
): SecurityScore['dataSource'] {
  if (!layer3) return 'none'

  const hasSsl = layer3.ssl !== null
  const hasObservatory = layer3.observatory !== null

  if (hasSsl && hasObservatory) return 'full'
  if (hasSsl || hasObservatory) return 'partial'
  return 'none'
}

// ─── 메인 함수 ───

/**
 * Layer3Data에서 보안 종합 점수를 산출한다.
 *
 * SSL 등급(40점) + TLS 프로토콜(15점) + 인증서 만료(15점) + 보안 헤더(30점) = 100점
 * 양쪽 다 없으면 overall=0, dataSource='none'.
 *
 * @param layer3 - 크롤링 단계에서 수집된 Layer3Data
 * @returns SecurityScore
 */
export function calculateSecurityScore(
  layer3: Layer3Data | null
): SecurityScore {
  const dataSource = determineDataSource(layer3)

  if (dataSource === 'none' || !layer3) {
    return {
      overall: 0,
      breakdown: {
        sslGrade: { score: 0, maxScore: MAX_SCORES.sslGrade, grade: null },
        sslProtocol: {
          score: 0,
          maxScore: MAX_SCORES.sslProtocol,
          bestProtocol: null,
        },
        certExpiry: {
          score: 0,
          maxScore: MAX_SCORES.certExpiry,
          daysRemaining: null,
        },
        securityHeaders: {
          score: 0,
          maxScore: MAX_SCORES.securityHeaders,
          grade: null,
          issues: [],
        },
      },
      dataSource: 'none',
    }
  }

  const sslGrade = scoreSslGrade(layer3.ssl?.grade ?? null)
  const sslProtocol = scoreSslProtocol(layer3.ssl?.protocols ?? [])
  const certExpiry = scoreCertExpiry(layer3.ssl?.expires_at ?? null)
  const securityHeaders = scoreSecurityHeaders(layer3.observatory)

  const overall =
    sslGrade.score +
    sslProtocol.score +
    certExpiry.score +
    securityHeaders.score

  return {
    overall,
    breakdown: { sslGrade, sslProtocol, certExpiry, securityHeaders },
    dataSource,
  }
}
