import { NextResponse } from 'next/server'

/**
 * GET /api/dev/env-check — 환경변수 상태 확인
 * POST /api/dev/env-check — n8n 웹훅 직접 호출 테스트
 * 프로덕션 디버깅 후 삭제할 것
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

export async function POST(): Promise<Response> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL ?? ''
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET ?? ''

  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'N8N_WEBHOOK_URL is empty' },
      { status: 500 }
    )
  }

  const testPayload = {
    diagnosisId: 'test-000-000',
    url: 'https://example.com',
    userId: 'test-user',
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (webhookSecret) {
    headers['Authorization'] = `Bearer ${webhookSecret}`
  }

  try {
    const start = Date.now()
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10_000),
    })
    const elapsed = Date.now() - start

    let responseBody: string
    try {
      responseBody = await response.text()
    } catch {
      responseBody = '(could not read body)'
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      elapsed: `${elapsed}ms`,
      responseBody: responseBody.slice(0, 500),
      webhookUrl: `${webhookUrl.slice(0, 40)}...`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      success: false,
      error: message,
      webhookUrl: `${webhookUrl.slice(0, 40)}...`,
    })
  }
}
