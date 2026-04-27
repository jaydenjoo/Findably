/** 중복 사용되는 데이터 존재 가드 함수 */

export const hasLayer1 = (data: { layer1: unknown }): boolean =>
  data.layer1 !== null

/** 페이지 크기 측정값이 유효한지 — 0이면 Firecrawl metadata 미수집 (측정 불가) */
export const hasValidPageSize = (data: {
  layer1: { page_size_bytes: number } | null
}): boolean => data.layer1 !== null && data.layer1.page_size_bytes > 0

/** 로드 시간 측정값이 유효한지 — 0이면 Firecrawl metadata 미수집 (측정 불가) */
export const hasValidLoadTime = (data: {
  layer1: { load_time_ms: number } | null
}): boolean => data.layer1 !== null && data.layer1.load_time_ms > 0

export const hasRobotsTxt = (data: { robots_txt: unknown }): boolean =>
  data.robots_txt !== null

export const hasLayer2Crux = (data: {
  layer2: { crux: unknown } | null
}): boolean => data.layer2 !== null && data.layer2.crux !== null

export const hasLayer2SafeBrowsing = (data: {
  layer2: { safe_browsing: unknown } | null
}): boolean => data.layer2 !== null && data.layer2.safe_browsing !== null

/** SSL Labs에서 실제 유효한 데이터를 받았는지 확인 (grade 또는 issuer가 있어야 함) */
export const hasLayer3Ssl = (data: {
  layer3: { ssl: { grade: string | null; issuer: string | null } | null } | null
}): boolean =>
  data.layer3 !== null &&
  data.layer3.ssl !== null &&
  (data.layer3.ssl.grade !== null || data.layer3.ssl.issuer !== null)

export const hasLlmsTxt = (data: { llms_txt: unknown }): boolean =>
  data.llms_txt !== null
