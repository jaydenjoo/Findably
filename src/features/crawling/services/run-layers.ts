import type { Layer2Data, Layer3Data } from '../types'
import { fetchPageSpeed } from '../fetchers/pagespeed'
import { fetchCrux } from '../fetchers/crux'
import { fetchSafeBrowsing } from '../fetchers/safe-browsing'
import { fetchSslLabs } from '../fetchers/ssl-labs'
import { fetchObservatory } from '../fetchers/observatory'

/**
 * Layer 2 (Google API) + Layer 3 (오픈소스) 병렬 실행
 *
 * - Promise.allSettled로 개별 실패 → null (전체 실패 안 함)
 * - 각 fetcher는 내부 타임아웃 + 에러 핸들링 보유
 *
 * @param url - 분석 대상 URL
 * @returns { layer2, layer3 }
 */
export async function runLayers(
  url: string
): Promise<{ layer2: Layer2Data; layer3: Layer3Data }> {
  const [
    pagespeedResult,
    cruxResult,
    safeBrowsingResult,
    sslResult,
    observatoryResult,
  ] = await Promise.allSettled([
    fetchPageSpeed(url),
    fetchCrux(url),
    fetchSafeBrowsing(url),
    fetchSslLabs(url),
    fetchObservatory(url),
  ])

  const layer2: Layer2Data = {
    pagespeed: extractValue(pagespeedResult),
    crux: extractValue(cruxResult),
    safe_browsing: extractValue(safeBrowsingResult),
  }

  const layer3: Layer3Data = {
    ssl: extractValue(sslResult),
    observatory: extractValue(observatoryResult),
  }

  return { layer2, layer3 }
}

/** PromiseSettledResult에서 값 추출. rejected → null */
function extractValue<T>(result: PromiseSettledResult<T | null>): T | null {
  if (result.status === 'fulfilled') {
    return result.value
  }
  console.error('[runLayers] Fetcher rejected:', result.reason)
  return null
}
