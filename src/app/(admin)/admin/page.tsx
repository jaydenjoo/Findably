import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminActions } from './_components/AdminActions'

export const metadata: Metadata = {
  title: '관리자',
}

/** 유료 분석에 필요한 키 목록 */
const PAID_DATA_KEYS = ['aiInsights', 'swot', 'roadmap', 'cmoSummary']

/** 환경변수 존재 여부 체크 (값은 노출 안 함) */
const ENV_CHECKS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'CRAWL_EXECUTE_SECRET',
  'ANTHROPIC_API_KEY',
  'GOOGLE_API_KEY',
  'N8N_WEBHOOK_URL',
  'N8N_WEBHOOK_SECRET',
] as const

interface DiagnosisRow {
  id: string
  url: string
  status: string
  tier: string | null
  total_score: number | null
  grade: string | null
  created_at: string
  updated_at: string | null
  analysis_data: Record<string, unknown> | null
  crawl_data: Record<string, unknown> | null
  user_email?: string
}

export const dynamic = 'force-dynamic'

export default async function AdminPage(): Promise<React.JSX.Element> {
  const supabase = createAdminClient()

  // 전체 진단 목록 (최근 50건)
  const { data: diagnoses } = await supabase
    .from('diagnoses')
    .select(
      'id, url, status, tier, total_score, grade, created_at, updated_at, analysis_data, crawl_data, user_id'
    )
    .order('created_at', { ascending: false })
    .limit(50)

  const rows: DiagnosisRow[] = (diagnoses ?? []).map((d) => ({
    id: d.id,
    url: d.url,
    status: d.status,
    tier: d.tier,
    total_score: d.total_score,
    grade: d.grade,
    created_at: d.created_at,
    updated_at: d.updated_at,
    analysis_data: d.analysis_data as Record<string, unknown> | null,
    crawl_data: d.crawl_data as Record<string, unknown> | null,
    user_email: d.user_id?.slice(0, 8) ?? '—',
  }))

  // 통계
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayRows = rows.filter((r) => new Date(r.created_at) >= todayStart)
  const completedToday = todayRows.filter((r) => r.status === 'completed')
  const failedToday = todayRows.filter((r) => r.status === 'failed')
  const stuckRows = rows.filter((r) => {
    if (
      r.status !== 'analyzing' &&
      r.status !== 'pending' &&
      r.status !== 'crawling'
    )
      return false
    const updated = r.updated_at
      ? new Date(r.updated_at)
      : new Date(r.created_at)
    return now.getTime() - updated.getTime() > 5 * 60 * 1000
  })

  // 환경변수 체크
  const envStatus = ENV_CHECKS.map((key) => ({
    key,
    set: !!process.env[key],
  }))

  return (
    <div className="space-y-6">
      {/* 시스템 상태 */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="오늘 진단" value={todayRows.length} />
        <StatCard label="완료" value={completedToday.length} color="success" />
        <StatCard label="실패" value={failedToday.length} color="danger" />
        <StatCard
          label="이상 감지"
          value={stuckRows.length}
          color={stuckRows.length > 0 ? 'danger' : 'success'}
        />
      </section>

      {/* 환경변수 */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">환경변수</h2>
        <div className="flex flex-wrap gap-2">
          {envStatus.map((env) => (
            <span
              key={env.key}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                env.set
                  ? 'bg-success-50 text-success-700'
                  : 'bg-danger-50 text-danger-700'
              }`}
            >
              {env.set ? '✓' : '✗'} {env.key.replace('NEXT_PUBLIC_', '')}
            </span>
          ))}
        </div>
      </section>

      {/* 이상 감지 경고 */}
      {stuckRows.length > 0 && (
        <section className="rounded-lg border border-danger-200 bg-danger-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-danger-700">
            이상 감지: {stuckRows.length}건이 5분 이상 진행 중
          </h2>
          <ul className="space-y-1 text-xs text-danger-600">
            {stuckRows.map((r) => (
              <li key={r.id}>
                {r.id.slice(0, 8)}... — {r.status} — {r.url}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 진단 목록 */}
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-3 py-2 font-semibold text-slate-600">ID</th>
              <th className="px-3 py-2 font-semibold text-slate-600">URL</th>
              <th className="px-3 py-2 font-semibold text-slate-600">상태</th>
              <th className="px-3 py-2 font-semibold text-slate-600">티어</th>
              <th className="px-3 py-2 font-semibold text-slate-600">점수</th>
              <th className="px-3 py-2 font-semibold text-slate-600">데이터</th>
              <th className="px-3 py-2 font-semibold text-slate-600">생성</th>
              <th className="px-3 py-2 font-semibold text-slate-600">소요</th>
              <th className="px-3 py-2 font-semibold text-slate-600">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => {
              const createdAt = new Date(row.created_at)
              const updatedAt = row.updated_at ? new Date(row.updated_at) : null
              const durationSec = updatedAt
                ? Math.round((updatedAt.getTime() - createdAt.getTime()) / 1000)
                : null

              // 데이터 완성도 체크
              const hasCrawl = !!row.crawl_data
              const hasAnalysis = !!row.analysis_data
              const hasPaidData =
                row.analysis_data !== null &&
                PAID_DATA_KEYS.some((k) => k in row.analysis_data!)

              // 이상 여부
              const isStuck = stuckRows.some((s) => s.id === row.id)
              const isPaidMissing =
                row.tier === 'paid' &&
                row.status === 'completed' &&
                !hasPaidData

              return (
                <tr
                  key={row.id}
                  className={
                    isStuck
                      ? 'bg-danger-50'
                      : isPaidMissing
                        ? 'bg-warning-50'
                        : ''
                  }
                >
                  <td className="px-3 py-2 font-mono text-slate-500">
                    {row.id.slice(0, 8)}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-slate-700">
                    {row.url}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2">
                    <TierBadge tier={row.tier} />
                  </td>
                  <td className="px-3 py-2 font-display font-semibold text-slate-700">
                    {row.total_score ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <DataIndicator
                      hasCrawl={hasCrawl}
                      hasAnalysis={hasAnalysis}
                      hasPaidData={hasPaidData}
                      tier={row.tier}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                    {formatTime(createdAt)}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {durationSec !== null ? formatDuration(durationSec) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <AdminActions
                      diagnosisId={row.id}
                      currentStatus={row.status}
                      tier={row.tier ?? 'free'}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}

// ─── 하위 컴포넌트 ───

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color?: 'success' | 'danger'
}): React.JSX.Element {
  const colorClass =
    color === 'success'
      ? 'text-success-600'
      : color === 'danger'
        ? 'text-danger-600'
        : 'text-slate-900'
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-display text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const styles: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600',
    crawling: 'bg-primary-50 text-primary-700',
    analyzing: 'bg-warning-50 text-warning-700',
    completed: 'bg-success-50 text-success-700',
    failed: 'bg-danger-50 text-danger-700',
  }
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {status}
    </span>
  )
}

function TierBadge({ tier }: { tier: string | null }): React.JSX.Element {
  return tier === 'paid' ? (
    <span className="inline-block rounded-full bg-primary-500 px-2 py-0.5 text-xs font-semibold text-white">
      유료
    </span>
  ) : (
    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
      무료
    </span>
  )
}

function DataIndicator({
  hasCrawl,
  hasAnalysis,
  hasPaidData,
  tier,
}: {
  hasCrawl: boolean
  hasAnalysis: boolean
  hasPaidData: boolean
  tier: string | null
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-1">
      <span
        className={`h-2 w-2 rounded-full ${hasCrawl ? 'bg-success-500' : 'bg-slate-200'}`}
        title={hasCrawl ? '크롤링 완료' : '크롤링 없음'}
      />
      <span
        className={`h-2 w-2 rounded-full ${hasAnalysis ? 'bg-success-500' : 'bg-slate-200'}`}
        title={hasAnalysis ? '무료 분석 완료' : '무료 분석 없음'}
      />
      {tier === 'paid' && (
        <span
          className={`h-2 w-2 rounded-full ${hasPaidData ? 'bg-primary-500' : 'bg-danger-500'}`}
          title={hasPaidData ? 'AI 분석 완료' : 'AI 분석 누락!'}
        />
      )}
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}분 ${s}초`
}
