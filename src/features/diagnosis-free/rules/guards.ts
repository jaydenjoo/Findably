/** 중복 사용되는 데이터 존재 가드 함수 */

export const hasLayer1 = (data: { layer1: unknown }): boolean =>
  data.layer1 !== null

export const hasRobotsTxt = (data: { robots_txt: unknown }): boolean =>
  data.robots_txt !== null

export const hasLayer2Crux = (data: {
  layer2: { crux: unknown } | null
}): boolean => data.layer2 !== null && data.layer2.crux !== null

export const hasLayer2SafeBrowsing = (data: {
  layer2: { safe_browsing: unknown } | null
}): boolean => data.layer2 !== null && data.layer2.safe_browsing !== null

export const hasLayer3Ssl = (data: {
  layer3: { ssl: unknown } | null
}): boolean => data.layer3 !== null && data.layer3.ssl !== null

export const hasLlmsTxt = (data: { llms_txt: unknown }): boolean =>
  data.llms_txt !== null
