/**
 * AI 인용 가능성 점수 계산 헬퍼 (Task 4.3)
 *
 * 크롤 데이터만으로 AI 플랫폼이 사이트를 인용할 가능성을 예측한다.
 * 비용 0원 — AI API 미호출, 구조 기반 예측.
 */

import type { CrawlData } from '@/features/crawling'
import type {
  AICitationPossibilityScore,
  AICitationSignals,
  AIPlatform,
  PlatformCitationScore,
} from '../types'
import {
  AI_BOT_TO_PLATFORM,
  AI_CITATION_PLATFORM_WEIGHTS,
  AI_CITATION_SIGNAL_WEIGHTS,
  AI_CITATION_THRESHOLDS,
  AI_PLATFORM_LABELS,
} from '../constants'

// ─── 신호 계산 ───

/** 봇 접근 신호 (0-100) — 특정 플랫폼 기준 */
function calculateBotAccessScore(
  data: CrawlData,
  platform: AIPlatform
): number {
  // Google: Googlebot 허용 여부
  if (platform === 'google') {
    if (data.robots_txt === null) return 50 // robots.txt 없으면 기본 허용 추정
    return data.robots_txt.allows_googlebot ? 100 : 0
  }

  // ChatGPT/Claude/Perplexity: 해당 봇 허용 여부
  const botName = Object.entries(AI_BOT_TO_PLATFORM).find(
    ([, p]) => p === platform
  )?.[0]
  if (!botName) return 50

  if (data.robots_txt === null) return 50 // robots.txt 없으면 기본 허용 추정

  const status = data.robots_txt.ai_bots[botName]
  if (status === 'allowed' || status === 'not_mentioned') return 100
  return 0 // blocked
}

/** 콘텐츠 발견 용이성 신호 (0-100) — 플랫폼 무관 */
function calculateContentDiscoverabilityScore(data: CrawlData): number {
  let score = 0
  const maxScore = 100
  const items = 5 // 5개 항목, 각 20점

  // 1. llms.txt 존재 (20점)
  if (data.llms_txt !== null && data.llms_txt.exists) {
    score += maxScore / items
  }

  // 2. Schema Markup 존재 (20점)
  if (data.layer1 !== null && data.layer1.schema_markup.length > 0) {
    score += maxScore / items
  }

  // 3. meta description 존재 (20점)
  if (
    data.layer1 !== null &&
    data.layer1.meta.description &&
    data.layer1.meta.description.trim().length > 0
  ) {
    score += maxScore / items
  }

  // 4. H1 정확히 1개 (20점)
  if (data.layer1 !== null && data.layer1.headings.h1.length === 1) {
    score += maxScore / items
  }

  // 5. canonical URL 설정 (20점)
  if (data.layer1 !== null && data.layer1.meta.canonical) {
    score += maxScore / items
  }

  return score
}

/** 신뢰 신호 (0-100) — 플랫폼 무관 */
function calculateTrustSignalsScore(data: CrawlData): number {
  let score = 0
  const maxScore = 100
  const items = 3 // 3개 항목

  // 1. SSL 유효 (34점)
  if (
    data.layer3 !== null &&
    data.layer3.ssl !== null &&
    data.layer3.ssl.valid
  ) {
    score += Math.round(maxScore / items)
  }

  // 2. Safe Browsing 안전 (33점)
  if (
    data.layer2 !== null &&
    data.layer2.safe_browsing !== null &&
    data.layer2.safe_browsing.is_safe
  ) {
    score += Math.round(maxScore / items)
  }

  // 3. 이미지 alt 비율 80%+ (33점)
  if (data.layer1 !== null) {
    const { total, without_alt } = data.layer1.images
    if (total === 0 || (total - without_alt) / total >= 0.8) {
      score += maxScore - Math.round(maxScore / items) * 2 // 나머지 점수
    }
  }

  return Math.min(score, 100)
}

// ─── 플랫폼별 점수 ───

/** 단일 플랫폼 인용 가능성 점수 계산 */
function calculatePlatformScore(
  data: CrawlData,
  platform: AIPlatform
): PlatformCitationScore {
  const botAccess = calculateBotAccessScore(data, platform)
  const contentDiscoverability = calculateContentDiscoverabilityScore(data)
  const trustSignals = calculateTrustSignalsScore(data)

  const signals: AICitationSignals = {
    botAccess,
    contentDiscoverability,
    trustSignals,
  }

  // 가중 합산
  let score =
    (botAccess * AI_CITATION_SIGNAL_WEIGHTS.botAccess +
      contentDiscoverability *
        AI_CITATION_SIGNAL_WEIGHTS.contentDiscoverability +
      trustSignals * AI_CITATION_SIGNAL_WEIGHTS.trustSignals) /
    100

  // 봇 차단 → 해당 플랫폼 0점
  const blocked = botAccess === 0
  if (blocked) {
    score = 0
  }

  // Safe Browsing 위험 하드캡
  if (
    data.layer2 !== null &&
    data.layer2.safe_browsing !== null &&
    !data.layer2.safe_browsing.is_safe
  ) {
    score = Math.min(score, AI_CITATION_THRESHOLDS.UNSAFE_HARD_CAP)
  }

  // SSL 무효 하드캡 (SSL Labs에서 실제 데이터를 받은 경우만 적용)
  if (
    data.layer3 !== null &&
    data.layer3.ssl !== null &&
    (data.layer3.ssl.grade !== null || data.layer3.ssl.issuer !== null) &&
    !data.layer3.ssl.valid
  ) {
    score = Math.min(score, AI_CITATION_THRESHOLDS.SSL_INVALID_HARD_CAP)
  }

  return {
    platform,
    platformLabel: AI_PLATFORM_LABELS[platform],
    score: Math.round(score),
    blocked,
    signals,
  }
}

// ─── 추천 메시지 ───

/** 점수 기반 추천 메시지 생성 */
function getRecommendation(
  overallScore: number,
  platforms: PlatformCitationScore[]
): string {
  const blockedPlatforms = platforms
    .filter((p) => p.blocked)
    .map((p) => p.platformLabel)

  if (blockedPlatforms.length > 0) {
    return `${blockedPlatforms.join(', ')}에서 봇이 차단되어 있습니다. robots.txt에서 해당 봇을 허용하면 인용 가능성이 크게 올라갑니다. 예상값입니다. 정확한 인용 현황은 유료 진단에서 확인하세요.`
  }

  if (overallScore >= 80) {
    return `AI 인용 가능성이 높습니다. 현재 구조를 유지하세요. 예상값입니다. 정확한 인용 현황은 유료 진단에서 확인하세요.`
  }

  if (overallScore >= AI_CITATION_THRESHOLDS.PASS_SCORE) {
    return `AI 인용 가능성이 보통입니다. llms.txt 추가, Schema Markup 보강으로 개선할 수 있습니다. 예상값입니다. 정확한 인용 현황은 유료 진단에서 확인하세요.`
  }

  return `AI 인용 가능성이 낮습니다. 봇 접근 허용, llms.txt, Schema Markup 등을 점검하세요. 예상값입니다. 정확한 인용 현황은 유료 진단에서 확인하세요.`
}

// ─── 공개 API ───

/** AI 인용 가능성 종합 점수 계산 */
export function calculateAICitationPossibility(
  data: CrawlData
): AICitationPossibilityScore {
  const platformIds: AIPlatform[] = [
    'chatgpt',
    'claude',
    'perplexity',
    'google',
  ]

  const platforms = platformIds.map((p) => calculatePlatformScore(data, p))

  // 가중 평균
  const overallScore = Math.round(
    platforms.reduce(
      (sum, p) => sum + p.score * AI_CITATION_PLATFORM_WEIGHTS[p.platform],
      0
    ) / 100
  )

  const recommendation = getRecommendation(overallScore, platforms)

  return {
    overallScore,
    passed: overallScore >= AI_CITATION_THRESHOLDS.PASS_SCORE,
    platforms,
    recommendation,
  }
}
