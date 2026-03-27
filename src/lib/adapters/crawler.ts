import { crawlingConfig } from '@/config/crawling'
import type {
  CrawlTriggerRequest,
  CrawlTriggerResult,
} from '@/features/crawling/types'

/**
 * n8n 웹훅 크롤링 트리거 어댑터
 *
 * Next.js → n8n (Elest.io) 웹훅 호출을 추상화.
 * 향후 Apify 등 대체 크롤러로 교체 가능.
 *
 * 인증: Bearer 토큰 (Authorization 헤더) — n8n headerAuth와 일치
 */
export async function triggerCrawl(
  request: CrawlTriggerRequest
): Promise<CrawlTriggerResult> {
  const { webhookUrl, webhookSecret } = crawlingConfig

  if (!webhookUrl) {
    console.error('[triggerCrawl] N8N_WEBHOOK_URL not configured')
    return { success: false, error: 'Crawl service not configured' }
  }

  const payload = JSON.stringify(request)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Bearer 토큰 인증 — n8n webhook의 headerAuth 방식과 일치
  if (webhookSecret) {
    headers['Authorization'] = `Bearer ${webhookSecret}`
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: payload,
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      console.error('[triggerCrawl] Webhook failed:', response.status)
      return { success: false, error: `Webhook returned ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('[triggerCrawl] Request error:', error)
    return { success: false, error: 'Failed to reach crawl service' }
  }
}
