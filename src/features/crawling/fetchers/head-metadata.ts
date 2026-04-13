/** fetch 타임아웃 (ms) */
const FETCH_TIMEOUT_MS = 15_000

/** 봇 차단 회피를 위한 User-Agent */
const USER_AGENT =
  'Mozilla/5.0 (compatible; FindablyBot/1.0; +https://findably.kr)'

/**
 * 사이트 HTML을 직접 fetch하여 <head> 메타데이터 추출.
 *
 * Firecrawl의 onlyMainContent: true가 <head>를 제거하기 때문에
 * canonical, OG tags, JSON-LD 등이 metadata에서 누락됨.
 * 이 fetcher가 직접 full HTML을 가져와서 보강한다.
 */
export interface HeadMetadata {
  canonical: string | null
  ogTags: Record<string, string>
  jsonLd: Record<string, unknown>[]
  internalLinkCount: number
  externalLinkCount: number
}

export async function fetchHeadMetadata(
  url: string
): Promise<HeadMetadata | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    })

    if (!response.ok) return null

    const html = await response.text()
    if (!html || html.length < 100) return null

    return parseHeadFromHtml(html, url)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/** HTML에서 <head> 메타데이터 + 링크 추출 */
function parseHeadFromHtml(html: string, pageUrl: string): HeadMetadata {
  // canonical: <link rel="canonical" href="...">
  const canonicalMatch =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)
  const canonical = canonicalMatch?.[1] ?? null

  // JSON-LD: <script type="application/ld+json">...</script>
  const jsonLd: Record<string, unknown>[] = []
  const ldRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let ldMatch: RegExpExecArray | null
  while ((ldMatch = ldRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(ldMatch[1]!)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === 'object')
            jsonLd.push(item as Record<string, unknown>)
        }
      } else if (parsed && typeof parsed === 'object') {
        jsonLd.push(parsed as Record<string, unknown>)
      }
    } catch {
      // JSON 파싱 실패 — 무시
    }
  }

  // OG tags: <meta property="og:..." content="...">
  const ogTags: Record<string, string> = {}
  const ogRegex =
    /<meta[^>]+property=["']og:([^"']+)["'][^>]+content=["']([^"']*)["']/gi
  let ogMatch: RegExpExecArray | null
  while ((ogMatch = ogRegex.exec(html)) !== null) {
    ogTags[ogMatch[1]!] = ogMatch[2]!
  }
  // content가 property 앞에 오는 경우
  const ogRegex2 =
    /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:([^"']+)["']/gi
  let ogMatch2: RegExpExecArray | null
  while ((ogMatch2 = ogRegex2.exec(html)) !== null) {
    if (!ogTags[ogMatch2[2]!]) ogTags[ogMatch2[2]!] = ogMatch2[1]!
  }

  // 내부/외부 링크: <a href="...">
  let internalLinkCount = 0
  let externalLinkCount = 0
  let pageHost: string
  try {
    pageHost = pageUrl
      .replace(/^https?:\/\//, '')
      .split('/')[0]!
      .split(':')[0]!
  } catch {
    pageHost = ''
  }

  const linkRegex = /<a[^>]+href=["']([^"'#]+)["']/gi
  let linkMatch: RegExpExecArray | null
  const seenHrefs = new Set<string>()
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1]!.trim()
    if (
      seenHrefs.has(href) ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:')
    )
      continue
    seenHrefs.add(href)

    if (href.startsWith('/') || href.startsWith('#')) {
      internalLinkCount++
    } else if (href.startsWith('http')) {
      const linkHost = href
        .replace(/^https?:\/\//, '')
        .split('/')[0]!
        .split(':')[0]!
      if (linkHost === pageHost) {
        internalLinkCount++
      } else {
        externalLinkCount++
      }
    }
  }

  return { canonical, ogTags, jsonLd, internalLinkCount, externalLinkCount }
}
