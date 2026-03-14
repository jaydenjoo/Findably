/** 중복 사용되는 데이터 존재 가드 함수 */

export const hasLayer1 = (data: { layer1: unknown }): boolean =>
  data.layer1 !== null

export const hasRobotsTxt = (data: { robots_txt: unknown }): boolean =>
  data.robots_txt !== null

export const hasLayer2Crux = (data: {
  layer2: { crux: unknown } | null
}): boolean => data.layer2 !== null && data.layer2.crux !== null
