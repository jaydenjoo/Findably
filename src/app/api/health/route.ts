import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DIAGNOSIS_PAID_CONFIG } from '@/config/diagnosis-paid'
import { crawlingConfig } from '@/config/crawling'

// ─── 타입 ───

type ServiceStatus = 'ok' | 'degraded' | 'down'

interface ServiceCheck {
  name: string
  status: ServiceStatus
  /** 응답 시간 (ms) — 연결 체크 시 */
  latencyMs?: number
  /** 문제 상세 */
  error?: string
}

interface HealthCheckResponse {
  overall: ServiceStatus
  timestamp: string
  services: ServiceCheck[]
  /** n8n 노드/AI 어댑터 가용성 요약 */
  summary: {
    supabase: ServiceStatus
    n8n: ServiceStatus
    aiAdapters: {
      available: string[]
      missing: string[]
      status: ServiceStatus
    }
    /** 최근 진단 상태 분포 — 실패율 모니터링 */
    recentDiagnoses?: {
      total: number
      completed: number
      failed: number
      analyzing: number
      failRate: number
    }
  }
}

// ─── 개별 체크 ───

/** Supabase 연결 확인 — diagnoses 테이블 COUNT */
async function checkSupabase(): Promise<ServiceCheck> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('diagnoses')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return {
        name: 'Supabase',
        status: 'down',
        latencyMs: Date.now() - start,
        error: error.message,
      }
    }
    return {
      name: 'Supabase',
      status: 'ok',
      latencyMs: Date.now() - start,
    }
  } catch (err: unknown) {
    return {
      name: 'Supabase',
      status: 'down',
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/** n8n 웹훅 URL 설정 확인 (실제 호출은 안 함 — 크롤링 트리거 방지) */
function checkN8n(): ServiceCheck {
  const { webhookUrl, webhookSecret } = crawlingConfig

  if (!webhookUrl) {
    return {
      name: 'n8n Webhook',
      status: 'down',
      error: 'N8N_WEBHOOK_URL 미설정',
    }
  }
  if (!webhookSecret) {
    return {
      name: 'n8n Webhook',
      status: 'degraded',
      error: 'N8N_WEBHOOK_SECRET 미설정 — 인증 없이 동작',
    }
  }
  return { name: 'n8n Webhook', status: 'ok' }
}

/** AI 어댑터 API 키 가용성 확인 */
function checkAIAdapters(): {
  services: ServiceCheck[]
  available: string[]
  missing: string[]
} {
  const platforms = DIAGNOSIS_PAID_CONFIG.CITATION_TRACKING.PLATFORMS
  const available: string[] = []
  const missing: string[] = []
  const services: ServiceCheck[] = []

  for (const p of platforms) {
    const hasKey = !!process.env[p.envKey]
    if (hasKey) {
      available.push(p.name)
      services.push({ name: `AI: ${p.name}`, status: 'ok' })
    } else {
      missing.push(p.name)
      services.push({
        name: `AI: ${p.name}`,
        status: 'down',
        error: `${p.envKey} 미설정`,
      })
    }
  }

  return { services, available, missing }
}

/** 최근 24시간 진단 상태 분포 조회 */
async function checkRecentDiagnoses(): Promise<{
  total: number
  completed: number
  failed: number
  analyzing: number
  failRate: number
} | null> {
  try {
    const supabase = createAdminClient()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('diagnoses')
      .select('status')
      .gte('created_at', since)

    if (error || !data) return null

    const total = data.length
    const completed = data.filter((d) => d.status === 'completed').length
    const failed = data.filter((d) => d.status === 'failed').length
    const analyzing = data.filter((d) => d.status === 'analyzing').length
    const failRate = total > 0 ? Math.round((failed / total) * 100) / 100 : 0

    return { total, completed, failed, analyzing, failRate }
  } catch {
    return null
  }
}

// ─── 종합 판정 ───

function deriveOverallStatus(services: ServiceCheck[]): ServiceStatus {
  if (services.some((s) => s.name === 'Supabase' && s.status === 'down')) {
    return 'down' // DB 다운 = 전체 다운
  }
  if (services.some((s) => s.status === 'down')) {
    return 'degraded'
  }
  if (services.some((s) => s.status === 'degraded')) {
    return 'degraded'
  }
  return 'ok'
}

// ─── 핸들러 ───

async function handleHealthCheck(): Promise<NextResponse<HealthCheckResponse>> {
  const [supabaseResult, recentDiagnoses] = await Promise.all([
    checkSupabase(),
    checkRecentDiagnoses(),
  ])

  const n8nResult = checkN8n()
  const aiResult = checkAIAdapters()

  const allServices = [supabaseResult, n8nResult, ...aiResult.services]
  const overall = deriveOverallStatus(allServices)

  const aiStatus: ServiceStatus =
    aiResult.available.length === 0
      ? 'down'
      : aiResult.missing.length > 0
        ? 'degraded'
        : 'ok'

  const response: HealthCheckResponse = {
    overall,
    timestamp: new Date().toISOString(),
    services: allServices,
    summary: {
      supabase: supabaseResult.status,
      n8n: n8nResult.status,
      aiAdapters: {
        available: aiResult.available,
        missing: aiResult.missing,
        status: aiStatus,
      },
      ...(recentDiagnoses ? { recentDiagnoses } : {}),
    },
  }

  const httpStatus =
    overall === 'down' ? 503 : overall === 'degraded' ? 207 : 200
  return NextResponse.json(response, { status: httpStatus })
}

export const GET = handleHealthCheck
export const POST = handleHealthCheck
