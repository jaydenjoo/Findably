import { NextResponse } from 'next/server'

/**
 * GET /api/dev/env-check
 * 환경변수 설정 상태 확인 (값은 노출하지 않음, 존재 여부만)
 * 프로덕션 배포 후 삭제할 것
 */
export async function GET(): Promise<Response> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL ?? ''
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET ?? ''
  const crawlSecret = process.env.CRAWL_EXECUTE_SECRET ?? ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return NextResponse.json({
    N8N_WEBHOOK_URL: webhookUrl
      ? `SET (${webhookUrl.length} chars, starts: ${webhookUrl.slice(0, 30)}...)`
      : 'EMPTY',
    N8N_WEBHOOK_SECRET: webhookSecret
      ? `SET (${webhookSecret.length} chars)`
      : 'EMPTY',
    CRAWL_EXECUTE_SECRET: crawlSecret
      ? `SET (${crawlSecret.length} chars)`
      : 'EMPTY',
    NEXT_PUBLIC_SITE_URL: siteUrl || 'EMPTY',
    timestamp: new Date().toISOString(),
  })
}
