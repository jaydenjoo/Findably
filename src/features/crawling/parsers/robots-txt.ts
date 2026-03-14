import type { RobotsTxtData } from '../types'
import { AI_BOT_LIST } from '../constants'

/** 봇별 규칙을 저장하는 내부 구조 */
interface BotRules {
  disallowAll: boolean
  hasExplicitAllow: boolean
  hasAnyRule: boolean
}

/**
 * robots.txt 원문을 파싱하여 RobotsTxtData를 반환.
 * n8n이 fetch한 robots.txt 텍스트를 받아 파싱만 수행.
 *
 * @param raw - robots.txt 전체 텍스트 (null이면 파일 미존재)
 */
export function parseRobotsTxt(raw: string | null): RobotsTxtData {
  const defaultAiBots = createDefaultAiBots()

  // 파일 미존재
  if (raw === null) {
    return {
      exists: false,
      allows_googlebot: true,
      ai_bots: defaultAiBots,
      sitemap_urls: [],
    }
  }

  // BOM 제거
  const cleaned = raw.replace(/^\uFEFF/, '')

  // 빈 파일 (공백/줄바꿈만)
  if (cleaned.trim() === '') {
    return {
      exists: true,
      allows_googlebot: true,
      ai_bots: defaultAiBots,
      sitemap_urls: [],
      raw,
    }
  }

  const lines = cleaned.split(/\r?\n/)
  const groups = parseGroups(lines)
  const sitemapUrls = parseSitemapUrls(lines)

  // 봇별 판정
  const aiBots: Record<string, 'allowed' | 'blocked' | 'not_mentioned'> = {}
  for (const botName of AI_BOT_LIST) {
    aiBots[botName] = determineBotStatus(botName, groups)
  }

  // Googlebot 판정
  const allowsGooglebot = determineBotStatus('Googlebot', groups) !== 'blocked'

  return {
    exists: true,
    allows_googlebot: allowsGooglebot,
    ai_bots: aiBots,
    sitemap_urls: sitemapUrls,
    raw,
  }
}

/** AI_BOT_LIST 기반 기본값 생성 (모두 not_mentioned) */
function createDefaultAiBots(): Record<
  string,
  'allowed' | 'blocked' | 'not_mentioned'
> {
  const result: Record<string, 'allowed' | 'blocked' | 'not_mentioned'> = {}
  for (const botName of AI_BOT_LIST) {
    result[botName] = 'not_mentioned'
  }
  return result
}

/** 줄에서 주석 제거 + 지시어:값 분리. 유효하지 않으면 null */
function parseDirectiveLine(
  rawLine: string
): { directive: string; value: string } | null {
  const line = (rawLine.split('#')[0] ?? '').trim()
  if (line === '') return null

  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) return null

  return {
    directive: line.slice(0, colonIndex).trim().toLowerCase(),
    value: line.slice(colonIndex + 1).trim(),
  }
}

/**
 * User-agent 그룹별 규칙을 파싱.
 * 키: 소문자 User-agent 이름, 값: BotRules
 */
function parseGroups(lines: string[]): Map<string, BotRules> {
  const groups = new Map<string, BotRules>()
  let currentAgents: string[] = []
  let lastDirectiveType: 'user-agent' | 'rule' | 'none' = 'none'

  for (const rawLine of lines) {
    const parsed = parseDirectiveLine(rawLine)
    if (!parsed) continue

    const { directive, value } = parsed

    if (directive === 'user-agent') {
      const agentName = value.toLowerCase()
      // 규칙 이후 새 User-agent → 새 그룹 시작 (이전 그룹과 분리)
      if (lastDirectiveType === 'rule') {
        currentAgents = []
      }
      if (!groups.has(agentName)) {
        groups.set(agentName, {
          disallowAll: false,
          hasExplicitAllow: false,
          hasAnyRule: false,
        })
      }
      currentAgents.push(agentName)
      lastDirectiveType = 'user-agent'
    } else if (directive === 'disallow') {
      for (const agent of currentAgents) {
        const rules = groups.get(agent)
        if (!rules) continue

        if (value === '/') {
          rules.disallowAll = true
          rules.hasAnyRule = true
        } else if (value !== '') {
          // 부분 Disallow (경로 제한) — 루트 차단은 아님
          rules.hasAnyRule = true
        }
        // 빈 Disallow: = 모두 허용 (RFC 9309)
      }
      lastDirectiveType = 'rule'
    } else if (directive === 'allow') {
      for (const agent of currentAgents) {
        const rules = groups.get(agent)
        if (!rules) continue

        if (value === '/') {
          rules.hasExplicitAllow = true
          rules.hasAnyRule = true
        } else if (value !== '') {
          rules.hasAnyRule = true
        }
      }
      lastDirectiveType = 'rule'
    } else {
      // sitemap, crawl-delay 등 다른 지시어는 User-agent 그룹 리셋
      // (단, sitemap은 그룹 밖에서도 유효하므로 리셋하지 않음)
      if (directive !== 'sitemap' && directive !== 'crawl-delay') {
        currentAgents = []
      }
    }
  }

  return groups
}

/** Sitemap URL 추출 */
function parseSitemapUrls(lines: string[]): string[] {
  const urls: string[] = []

  for (const rawLine of lines) {
    const parsed = parseDirectiveLine(rawLine)
    if (!parsed) continue

    if (parsed.directive === 'sitemap' && parsed.value) {
      urls.push(parsed.value)
    }
  }

  return urls
}

/**
 * 특정 봇의 차단 상태를 판정.
 *
 * 우선순위: 봇 이름 전용 섹션 > `*` 섹션 > not_mentioned
 */
function determineBotStatus(
  botName: string,
  groups: Map<string, BotRules>
): 'allowed' | 'blocked' | 'not_mentioned' {
  const lowerName = botName.toLowerCase()

  // 1. 봇 이름 전용 섹션
  const specificRules = groups.get(lowerName)
  if (specificRules) {
    if (specificRules.hasExplicitAllow && !specificRules.disallowAll)
      return 'allowed'
    if (specificRules.disallowAll && !specificRules.hasExplicitAllow)
      return 'blocked'
    if (specificRules.disallowAll && specificRules.hasExplicitAllow)
      return 'allowed' // Allow 우선
    if (specificRules.hasAnyRule) return 'allowed' // 부분 Disallow만 있으면 루트는 허용
    return 'allowed' // 섹션 존재하지만 규칙 없음 → 허용
  }

  // 2. 와일드카드 섹션
  const wildcardRules = groups.get('*')
  if (wildcardRules) {
    if (wildcardRules.disallowAll && !wildcardRules.hasExplicitAllow)
      return 'blocked'
    if (wildcardRules.hasExplicitAllow) return 'allowed'
    if (wildcardRules.hasAnyRule) return 'allowed'
    return 'allowed'
  }

  // 3. 섹션 없음
  return 'not_mentioned'
}
