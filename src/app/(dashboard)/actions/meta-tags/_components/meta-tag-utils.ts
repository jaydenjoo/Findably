import type { Layer1Data } from '@/features/crawling'

// ─── Types ───

export type MetaTagStatus = 'ok' | 'warning' | 'missing' | 'error'
export type RecommendationPriority = 'high' | 'medium' | 'low'

export interface MetaTagItem {
  tag: string
  label: string
  current: string | null
  status: MetaTagStatus
  issue: string | null
  currentLength: number
  maxLength: number | null
}

export interface MetaTagRecommendation {
  tag: string
  label: string
  current: string | null
  recommended: string
  reason: string
  priority: RecommendationPriority
  code: string
}

// ─── Constants ───

const TITLE_MIN = 30
const TITLE_MAX = 60
const DESCRIPTION_MIN = 70
const DESCRIPTION_MAX = 155

const STATUS_STYLES: Record<
  MetaTagStatus,
  { bg: string; text: string; label: string }
> = {
  ok: { bg: 'bg-success-50', text: 'text-success-700', label: '양호' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-700', label: '주의' },
  missing: { bg: 'bg-danger-50', text: 'text-danger-700', label: '누락' },
  error: { bg: 'bg-danger-50', text: 'text-danger-700', label: '오류' },
}

const PRIORITY_STYLES: Record<
  RecommendationPriority,
  { bg: string; text: string; label: string }
> = {
  high: { bg: 'bg-danger-50', text: 'text-danger-700', label: '높음' },
  medium: { bg: 'bg-warning-50', text: 'text-warning-700', label: '보통' },
  low: { bg: 'bg-primary-50', text: 'text-primary-700', label: '낮음' },
}

export { STATUS_STYLES, PRIORITY_STYLES }

// ─── Analysis ───

function analyzeTitleLength(title: string): {
  status: MetaTagStatus
  issue: string | null
} {
  const len = title.length
  if (len < TITLE_MIN) {
    return {
      status: 'warning',
      issue: `제목이 너무 짧습니다 (${len}자). ${TITLE_MIN}~${TITLE_MAX}자가 권장됩니다.`,
    }
  }
  if (len > TITLE_MAX) {
    return {
      status: 'warning',
      issue: `제목이 너무 깁니다 (${len}자). 검색 결과에서 잘릴 수 있습니다.`,
    }
  }
  return { status: 'ok', issue: null }
}

function analyzeDescriptionLength(desc: string): {
  status: MetaTagStatus
  issue: string | null
} {
  const len = desc.length
  if (len < DESCRIPTION_MIN) {
    return {
      status: 'warning',
      issue: `설명이 너무 짧습니다 (${len}자). ${DESCRIPTION_MIN}~${DESCRIPTION_MAX}자가 권장됩니다.`,
    }
  }
  if (len > DESCRIPTION_MAX) {
    return {
      status: 'warning',
      issue: `설명이 너무 깁니다 (${len}자). 검색 결과에서 잘릴 수 있습니다.`,
    }
  }
  return { status: 'ok', issue: null }
}

export function analyzeCurrentMetaTags(
  meta: Layer1Data['meta']
): MetaTagItem[] {
  const items: MetaTagItem[] = []

  // title
  if (meta.title != null && meta.title.trim() !== '') {
    const { status, issue } = analyzeTitleLength(meta.title)
    items.push({
      tag: 'title',
      label: 'Title',
      current: meta.title,
      status,
      issue,
      currentLength: meta.title.length,
      maxLength: TITLE_MAX,
    })
  } else {
    items.push({
      tag: 'title',
      label: 'Title',
      current: null,
      status: 'missing',
      issue:
        '페이지 제목이 설정되지 않았습니다. 검색 결과에 표시되는 가장 중요한 태그입니다.',
      currentLength: 0,
      maxLength: TITLE_MAX,
    })
  }

  // description
  if (meta.description != null && meta.description.trim() !== '') {
    const { status, issue } = analyzeDescriptionLength(meta.description)
    items.push({
      tag: 'description',
      label: 'Description',
      current: meta.description,
      status,
      issue,
      currentLength: meta.description.length,
      maxLength: DESCRIPTION_MAX,
    })
  } else {
    items.push({
      tag: 'description',
      label: 'Description',
      current: null,
      status: 'missing',
      issue:
        '메타 설명이 없습니다. 검색 결과에서 페이지 내용 대신 표시되는 텍스트입니다.',
      currentLength: 0,
      maxLength: DESCRIPTION_MAX,
    })
  }

  // og:title
  const ogTitle = meta.og['og:title'] ?? null
  items.push({
    tag: 'og:title',
    label: 'OG Title',
    current: ogTitle,
    status: ogTitle != null && ogTitle.trim() !== '' ? 'ok' : 'missing',
    issue:
      ogTitle != null && ogTitle.trim() !== ''
        ? null
        : 'SNS 공유 시 표시될 제목이 없습니다. 카카오톡, 슬랙 등에서 링크 미리보기에 사용됩니다.',
    currentLength: ogTitle?.length ?? 0,
    maxLength: null,
  })

  // og:description
  const ogDesc = meta.og['og:description'] ?? null
  items.push({
    tag: 'og:description',
    label: 'OG Description',
    current: ogDesc,
    status: ogDesc != null && ogDesc.trim() !== '' ? 'ok' : 'missing',
    issue:
      ogDesc != null && ogDesc.trim() !== ''
        ? null
        : 'SNS 공유 시 표시될 설명이 없습니다.',
    currentLength: ogDesc?.length ?? 0,
    maxLength: null,
  })

  // og:image
  const ogImage = meta.og['og:image'] ?? null
  items.push({
    tag: 'og:image',
    label: 'OG Image',
    current: ogImage,
    status: ogImage != null && ogImage.trim() !== '' ? 'ok' : 'missing',
    issue:
      ogImage != null && ogImage.trim() !== ''
        ? null
        : 'SNS 공유 시 표시될 이미지가 없습니다. 클릭률에 큰 영향을 미칩니다.',
    currentLength: ogImage?.length ?? 0,
    maxLength: null,
  })

  // canonical
  items.push({
    tag: 'canonical',
    label: 'Canonical URL',
    current: meta.canonical,
    status:
      meta.canonical != null && meta.canonical.trim() !== '' ? 'ok' : 'warning',
    issue:
      meta.canonical != null && meta.canonical.trim() !== ''
        ? null
        : 'Canonical URL이 설정되지 않았습니다. 중복 콘텐츠 문제가 발생할 수 있습니다.',
    currentLength: meta.canonical?.length ?? 0,
    maxLength: null,
  })

  // robots
  const robotsMeta = meta.robots_meta
  const hasNoindex =
    robotsMeta != null && robotsMeta.toLowerCase().includes('noindex')
  items.push({
    tag: 'robots',
    label: 'Robots',
    current: robotsMeta,
    status: hasNoindex ? 'error' : 'ok',
    issue: hasNoindex
      ? 'noindex가 설정되어 검색엔진에 페이지가 색인되지 않습니다. 의도적이지 않다면 제거하세요.'
      : null,
    currentLength: robotsMeta?.length ?? 0,
    maxLength: null,
  })

  return items
}

// ─── Recommendations ───

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function generateRecommendations(
  meta: Layer1Data['meta'],
  url: string
): MetaTagRecommendation[] {
  const recommendations: MetaTagRecommendation[] = []

  // title 추천
  const title = meta.title
  if (title == null || title.trim() === '') {
    const hostname = safeHostname(url)
    const suggested = `${hostname} — 공식 웹사이트`
    recommendations.push({
      tag: 'title',
      label: 'Title',
      current: null,
      recommended: suggested,
      reason:
        '페이지 제목은 검색 결과의 첫인상입니다. 브랜드명 + 핵심 키워드를 포함하세요.',
      priority: 'high',
      code: `<title>${escapeHtml(suggested)}</title>`,
    })
  } else if (title.length > TITLE_MAX) {
    const trimmed = title.slice(0, TITLE_MAX - 3) + '...'
    recommendations.push({
      tag: 'title',
      label: 'Title',
      current: title,
      recommended: trimmed,
      reason: `현재 ${title.length}자로, 검색 결과에서 잘립니다. ${TITLE_MAX}자 이내로 줄이세요.`,
      priority: 'medium',
      code: `<title>${escapeHtml(trimmed)}</title>`,
    })
  } else if (title.length < TITLE_MIN) {
    recommendations.push({
      tag: 'title',
      label: 'Title',
      current: title,
      recommended: `${title} — 핵심 키워드를 추가하세요`,
      reason: `현재 ${title.length}자로 너무 짧습니다. 핵심 키워드를 포함하여 ${TITLE_MIN}자 이상으로 작성하세요.`,
      priority: 'medium',
      code: `<title>${escapeHtml(title)} — 핵심 키워드를 추가하세요</title>`,
    })
  }

  // description 추천
  const desc = meta.description
  if (desc == null || desc.trim() === '') {
    recommendations.push({
      tag: 'description',
      label: 'Description',
      current: null,
      recommended: '사이트의 핵심 가치와 서비스를 70~155자 이내로 설명하세요.',
      reason:
        '메타 설명은 검색 결과에서 제목 아래 표시됩니다. 클릭률에 직접적인 영향을 미칩니다.',
      priority: 'high',
      code: '<meta name="description" content="사이트의 핵심 가치와 서비스를 설명하세요" />',
    })
  } else if (desc.length > DESCRIPTION_MAX) {
    const trimmed = desc.slice(0, DESCRIPTION_MAX - 3) + '...'
    recommendations.push({
      tag: 'description',
      label: 'Description',
      current: desc,
      recommended: trimmed,
      reason: `현재 ${desc.length}자로, 검색 결과에서 잘립니다. ${DESCRIPTION_MAX}자 이내로 줄이세요.`,
      priority: 'medium',
      code: `<meta name="description" content="${escapeHtml(trimmed)}" />`,
    })
  }

  // og:title 추천
  const ogTitle = meta.og['og:title'] ?? null
  if (ogTitle == null || ogTitle.trim() === '') {
    const fallbackTitle = title ?? safeHostname(url)
    recommendations.push({
      tag: 'og:title',
      label: 'OG Title',
      current: null,
      recommended: fallbackTitle,
      reason:
        'SNS 공유 시 제목이 표시되지 않습니다. 카카오톡, 슬랙 등에서 링크 미리보기에 사용됩니다.',
      priority: 'high',
      code: `<meta property="og:title" content="${escapeHtml(fallbackTitle)}" />`,
    })
  }

  // og:description 추천
  const ogDesc = meta.og['og:description'] ?? null
  if (ogDesc == null || ogDesc.trim() === '') {
    const fallbackDesc = desc ?? '페이지의 핵심 내용을 요약하세요'
    recommendations.push({
      tag: 'og:description',
      label: 'OG Description',
      current: null,
      recommended: fallbackDesc,
      reason: 'SNS 공유 시 설명이 표시되지 않습니다.',
      priority: 'medium',
      code: `<meta property="og:description" content="${escapeHtml(fallbackDesc)}" />`,
    })
  }

  // og:image 추천
  const ogImage = meta.og['og:image'] ?? null
  if (ogImage == null || ogImage.trim() === '') {
    recommendations.push({
      tag: 'og:image',
      label: 'OG Image',
      current: null,
      recommended: '1200x630px 크기의 대표 이미지 URL을 설정하세요',
      reason:
        'SNS 공유 시 이미지가 없으면 클릭률이 크게 떨어집니다. 1200x630px 크기가 권장됩니다.',
      priority: 'high',
      code: `<meta property="og:image" content="${escapeHtml(url)}/og-image.png" />`,
    })
  }

  // canonical 추천
  if (meta.canonical == null || meta.canonical.trim() === '') {
    recommendations.push({
      tag: 'canonical',
      label: 'Canonical URL',
      current: null,
      recommended: url,
      reason:
        'Canonical URL이 없으면 검색엔진이 중복 페이지로 판단할 수 있습니다.',
      priority: 'medium',
      code: `<link rel="canonical" href="${escapeHtml(url)}" />`,
    })
  }

  // robots noindex 제거 추천
  const robotsMeta = meta.robots_meta
  if (robotsMeta != null && robotsMeta.toLowerCase().includes('noindex')) {
    recommendations.push({
      tag: 'robots',
      label: 'Robots',
      current: robotsMeta,
      recommended: 'index, follow',
      reason:
        'noindex가 설정되어 검색엔진에 페이지가 색인되지 않습니다. 의도적이지 않다면 제거하세요.',
      priority: 'high',
      code: '<meta name="robots" content="index, follow" />',
    })
  }

  return recommendations
}

// ─── Helpers ───

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url || '내 사이트'
  }
}

/** 분석 결과 요약 점수 (ok 비율) */
export function calculateMetaScore(items: MetaTagItem[]): number {
  if (items.length === 0) return 0
  const okCount = items.filter((item) => item.status === 'ok').length
  return Math.round((okCount / items.length) * 100)
}
