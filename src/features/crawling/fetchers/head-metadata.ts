/** fetch 타임아웃 (ms) */
const FETCH_TIMEOUT_MS = 15_000

/**
 * 1차 User-Agent — Findably 봇 식별 (정직성)
 */
const PRIMARY_UA =
  'Mozilla/5.0 (compatible; FindablyBot/1.0; +https://findably.kr)'

/**
 * 2차 User-Agent — 봇 차단 회피용 일반 브라우저 UA.
 * 1차 시도에서 봇 차단(403/empty)된 경우 재시도하여 진단 신뢰도 확보.
 */
const FALLBACK_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

/**
 * 사이트 HTML을 직접 fetch하여 <head> 메타데이터 추출.
 *
 * Firecrawl이 head 영역(title, description, h1, canonical, OG, JSON-LD)을
 * 누락하는 경우 이 fetcher가 직접 full HTML을 가져와서 보강한다.
 */
export interface HeadMetadata {
  title: string | null
  description: string | null
  h1: string[]
  canonical: string | null
  ogTags: Record<string, string>
  jsonLd: Record<string, unknown>[]
  internalLinkCount: number
  externalLinkCount: number
}

/** HTML 본문 fetch (UA 인자 받음) */
async function tryFetchHtml(
  url: string,
  userAgent: string
): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': userAgent },
      signal: controller.signal,
      redirect: 'follow',
    })

    if (!response.ok) return null

    const html = await response.text()
    if (!html || html.length < 100) return null

    return html
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchHeadMetadata(
  url: string
): Promise<HeadMetadata | null> {
  // 1차: FindablyBot UA — 정직한 식별
  let html = await tryFetchHtml(url, PRIMARY_UA)

  // 2차: 봇 차단된 경우 일반 브라우저 UA로 재시도
  if (!html) {
    html = await tryFetchHtml(url, FALLBACK_UA)
  }

  if (!html) return null

  return parseHeadFromHtml(html, url)
}

/** HTML에서 <head> 메타데이터 + 링크 추출 (parse-crawl-v2.ts에서도 재사용) */
export function parseHeadFromHtml(html: string, pageUrl: string): HeadMetadata {
  // title: <title>...</title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch?.[1]?.trim() || null

  // description: <meta name="description" content="...">
  const descMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
    )
  const description = descMatch?.[1]?.trim() || null

  // h1: <h1>...</h1> (내부 태그 제거)
  const h1: string[] = []
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi
  let h1Match: RegExpExecArray | null
  while ((h1Match = h1Regex.exec(html)) !== null) {
    const text = h1Match[1]!.replace(/<[^>]+>/g, '').trim()
    if (text) h1.push(text)
  }

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

  return {
    title,
    description,
    h1,
    canonical,
    ogTags,
    jsonLd,
    internalLinkCount,
    externalLinkCount,
  }
}
