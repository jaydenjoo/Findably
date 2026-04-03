import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ACCESS } from '@/config/access-control'
import { AdminActions } from './_components/AdminActions'
import { AdminGiftCodeForm } from './_components/AdminGiftCodeForm'
import { AdminLoginForm } from './_components/AdminLoginForm'

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
  paid_at: string | null
}

export const dynamic = 'force-dynamic'

export default async function AdminPage(): Promise<React.JSX.Element> {
  // 관리자 세션 확인
  const authSupabase = await createClient()
  const {
    data: { user: adminUser },
  } = await authSupabase.auth.getUser()

  const isAdmin =
    adminUser && ACCESS.ADMIN_EMAILS.includes(adminUser.email ?? '')

  const supabase = createAdminClient()

  // 선물 코드 목록
  const { data: giftCodes } = await supabase
    .from('gift_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // 선물 코드 사용 이력
  const giftCodeIds = (giftCodes ?? []).map((c) => c.id)
  const { data: giftCodeUses } = await supabase
    .from('gift_code_uses')
    .select('gift_code_id, user_id, diagnosis_id, used_at')
    .in('gift_code_id', giftCodeIds.length > 0 ? giftCodeIds : ['none'])

  // 진단 목록 + 결제 정보 (최근 30건)
  const { data: diagnoses } = await supabase
    .from('diagnoses')
    .select(
      'id, url, status, tier, total_score, grade, created_at, updated_at, analysis_data, crawl_data, user_id'
    )
    .order('created_at', { ascending: false })
    .limit(30)

  // 결제 정보 조회
  const diagIds = (diagnoses ?? []).map((d) => d.id)
  const { data: payments } = await supabase
    .from('payments')
    .select('diagnosis_id, paid_at')
    .in('diagnosis_id', diagIds.length > 0 ? diagIds : ['none'])

  const paymentMap: Record<string, string> = {}
  for (const p of payments ?? []) {
    paymentMap[p.diagnosis_id] = p.paid_at ?? ''
  }

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
    paid_at: paymentMap[d.id] ?? null,
  }))

  // 통계
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayRows = rows.filter((r) => new Date(r.created_at) >= todayStart)
  const completedToday = todayRows.filter((r) => r.status === 'completed')
  const failedToday = todayRows.filter((r) => r.status === 'failed')
  const stuckRows = rows.filter((r) => {
    if (!['analyzing', 'pending', 'crawling'].includes(r.status)) return false
    const updated = r.updated_at
      ? new Date(r.updated_at)
      : new Date(r.created_at)
    return now.getTime() - updated.getTime() > 5 * 60 * 1000
  })
  const paidMissingRows = rows.filter(
    (r) =>
      r.tier === 'paid' &&
      r.status === 'completed' &&
      r.analysis_data !== null &&
      !PAID_DATA_KEYS.some((k) => k in r.analysis_data!)
  )

  // 환경변수 체크
  const envStatus = ENV_CHECKS.map((key) => ({
    key,
    set: !!process.env[key],
  }))
  const missingEnvs = envStatus.filter((e) => !e.set)

  return (
    <div className="space-y-6">
      {/* 관리자 로그인 상태 */}
      {!isAdmin && <AdminLoginForm />}
      {isAdmin && (
        <p className="text-xs text-success-600">✓ {adminUser.email} 로그인됨</p>
      )}

      {/* 시스템 상태 */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="오늘 진단" value={todayRows.length} />
        <StatCard label="완료" value={completedToday.length} color="success" />
        <StatCard label="실패" value={failedToday.length} color="danger" />
        <StatCard
          label="이상(stuck)"
          value={stuckRows.length}
          color={stuckRows.length > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="유료 누락"
          value={paidMissingRows.length}
          color={paidMissingRows.length > 0 ? 'danger' : 'success'}
        />
      </section>

      {/* 환경변수 */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          환경변수{' '}
          {missingEnvs.length > 0 && `(${missingEnvs.length}개 미설정!)`}
        </h2>
        <div className="flex flex-wrap gap-2">
          {envStatus.map((env) => (
            <span
              key={env.key}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                env.set
                  ? 'bg-success-50 text-success-700'
                  : 'bg-danger-50 text-danger-700 ring-1 ring-danger-200'
              }`}
            >
              {env.set ? '✓' : '✗'} {env.key.replace('NEXT_PUBLIC_', '')}
            </span>
          ))}
        </div>
        {missingEnvs.length > 0 && (
          <p className="mt-2 text-xs text-danger-600">
            미설정 환경변수가 있으면 크롤링/AI분석이 실패합니다. Vercel
            환경변수를 확인하세요.
          </p>
        )}
      </section>

      {/* 이상 감지 경고 */}
      {(stuckRows.length > 0 || paidMissingRows.length > 0) && (
        <section className="rounded-lg border border-danger-200 bg-danger-50 p-4 space-y-2">
          {stuckRows.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-danger-700">
                {stuckRows.length}건 — 5분 이상 진행 중 (stuck)
              </h3>
              <p className="text-xs text-danger-600">
                n8n 크롤링 또는 AI 분석이 멈춤. &quot;완료처리&quot; 또는
                &quot;재분석&quot; 필요.
              </p>
            </div>
          )}
          {paidMissingRows.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-danger-700">
                {paidMissingRows.length}건 — 유료 결제 완료, AI 분석 데이터 없음
              </h3>
              <p className="text-xs text-danger-600">
                결제 후 5-Agent 분석이 실행되지 않았거나 실패.
                &quot;재분석&quot; 버튼으로 복구 가능.
              </p>
            </div>
          )}
        </section>
      )}

      {/* 진단 목록 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          진단 목록 (최근 30건)
        </h2>
        {rows.map((row) => {
          const createdAt = new Date(row.created_at)
          const updatedAt = row.updated_at ? new Date(row.updated_at) : null
          const paidAt = row.paid_at ? new Date(row.paid_at) : null
          const durationSec = updatedAt
            ? Math.round((updatedAt.getTime() - createdAt.getTime()) / 1000)
            : null

          // 파이프라인 단계별 체크
          const pipeline = buildPipeline(row, paidAt)
          const isStuck = stuckRows.some((s) => s.id === row.id)
          const isPaidMissing = paidMissingRows.some((s) => s.id === row.id)

          return (
            <div
              key={row.id}
              className={`rounded-lg border bg-white p-4 ${
                isStuck
                  ? 'border-danger-300 bg-danger-50'
                  : isPaidMissing
                    ? 'border-warning-300 bg-warning-50'
                    : 'border-slate-200'
              }`}
            >
              {/* 헤더: ID + URL + 상태 + 점수 + 액션 */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-slate-400">
                    {row.id.slice(0, 8)}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-700">
                    {row.url}
                  </span>
                  <StatusBadge status={row.status} />
                  <TierBadge tier={row.tier} />
                  {row.total_score !== null && (
                    <span className="font-display text-sm font-bold text-slate-700">
                      {row.total_score}점
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">
                    {formatTime(createdAt)}
                    {durationSec !== null &&
                      ` · ${formatDuration(durationSec)}`}
                  </span>
                  <AdminActions
                    diagnosisId={row.id}
                    currentStatus={row.status}
                    tier={row.tier ?? 'free'}
                  />
                </div>
              </div>

              {/* 파이프라인 상세 */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {pipeline.map((step) => (
                  <PipelineStep key={step.label} {...step} />
                ))}
              </div>

              {/* 이상 시 원인 표시 */}
              {isPaidMissing && (
                <p className="mt-2 text-xs text-danger-600 bg-danger-50 rounded px-2 py-1">
                  원인: 결제 후 유료 분석(5-Agent)이 실행되지 않았거나 모든
                  에이전트가 실패. Vercel 로그에서 [transitionStatus] 또는
                  [trigger-analysis] 검색 필요. ANTHROPIC_API_KEY 미설정 가능성
                  확인.
                </p>
              )}
            </div>
          )
        })}
      </section>

      {/* ─── 선물 코드 관리 ─── */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">선물 코드 관리</h2>

        {/* 코드 생성 폼 (AdminActions에서 처리) */}
        <AdminGiftCodeForm />

        {/* 코드 목록 */}
        <div className="space-y-2">
          {(giftCodes ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">생성된 코드가 없습니다</p>
          ) : (
            (giftCodes ?? []).map((gc) => {
              const uses = (giftCodeUses ?? []).filter(
                (u) => u.gift_code_id === gc.id
              )
              const isExpired =
                gc.expires_at && new Date(gc.expires_at as string) < new Date()
              const isExhausted =
                (gc.used_count as number) >= (gc.max_uses as number)

              return (
                <div
                  key={gc.id}
                  className={`rounded-lg border p-3 ${
                    !gc.is_active || isExpired || isExhausted
                      ? 'border-slate-200 bg-slate-50 opacity-60'
                      : 'border-primary-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm font-bold text-slate-800">
                        {gc.code}
                      </code>
                      <span className="text-xs text-slate-500">
                        {gc.used_count}/{gc.max_uses}회 사용
                      </span>
                      {isExpired && (
                        <span className="text-xs text-danger-500">만료</span>
                      )}
                      {isExhausted && (
                        <span className="text-xs text-warning-500">소진</span>
                      )}
                      {!gc.is_active && (
                        <span className="text-xs text-slate-400">비활성</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {gc.expires_at
                        ? `만료: ${new Date(gc.expires_at as string).toLocaleDateString('ko-KR')}`
                        : '무기한'}
                    </span>
                  </div>
                  {gc.description && (
                    <p className="mt-1 text-xs text-slate-500">
                      {gc.description}
                    </p>
                  )}
                  {uses.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {uses.map((u) => (
                        <p
                          key={`${u.gift_code_id}-${u.user_id}`}
                          className="text-xs text-slate-400"
                        >
                          사용: {(u.user_id as string).slice(0, 8)}… /{' '}
                          {new Date(u.used_at as string).toLocaleString(
                            'ko-KR',
                            {
                              timeZone: 'Asia/Seoul',
                            }
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}

// ─── 파이프라인 빌더 ───

interface PipelineStepData {
  label: string
  status: 'ok' | 'fail' | 'skip' | 'warn'
  detail?: string
}

function buildPipeline(
  row: DiagnosisRow,
  paidAt: Date | null
): PipelineStepData[] {
  const steps: PipelineStepData[] = []
  const cd = row.crawl_data
  const ad = row.analysis_data

  // 1. 크롤링
  const hasCrawl = !!cd
  const hasLayer1 = cd !== null && 'layer1' in cd
  const hasLayer2 = cd !== null && 'layer2' in cd
  const hasLayer3 = cd !== null && 'layer3' in cd
  const layerCount = [hasLayer1, hasLayer2, hasLayer3].filter(Boolean).length

  steps.push({
    label: '크롤링',
    status: hasCrawl ? (layerCount === 3 ? 'ok' : 'warn') : 'fail',
    detail: hasCrawl ? `Layer ${layerCount}/3` : '데이터 없음',
  })

  // 2. 무료 분석
  const hasFreeScore = ad !== null && 'overallScore' in ad
  steps.push({
    label: '무료 분석',
    status: hasFreeScore ? 'ok' : 'fail',
    detail: hasFreeScore ? `${row.total_score}점` : '미실행',
  })

  // 3. 결제 (유료만)
  if (row.tier === 'paid') {
    steps.push({
      label: '결제',
      status: paidAt ? 'ok' : 'fail',
      detail: paidAt ? formatTime(paidAt) : '결제 기록 없음',
    })
  }

  // 4. 유료 AI 분석 (유료만)
  if (row.tier === 'paid') {
    const hasInsights = ad !== null && 'aiInsights' in ad
    const hasSwot = ad !== null && 'swot' in ad
    const hasRoadmap = ad !== null && 'roadmap' in ad
    const hasCmo = ad !== null && 'cmoSummary' in ad
    const paidCount = [hasInsights, hasSwot, hasRoadmap, hasCmo].filter(
      Boolean
    ).length

    steps.push({
      label: 'AI 분석',
      status: paidCount === 4 ? 'ok' : paidCount > 0 ? 'warn' : 'fail',
      detail:
        paidCount === 4
          ? '전체 완료'
          : paidCount > 0
            ? `${paidCount}/4 완료`
            : '미실행',
    })

    // 5. 개별 항목 (AI 분석 실패 시 상세)
    if (paidCount < 4) {
      const items = [
        { name: 'Insights', has: hasInsights },
        { name: 'SWOT', has: hasSwot },
        { name: 'Roadmap', has: hasRoadmap },
        { name: 'CMO', has: hasCmo },
      ]
      for (const item of items) {
        steps.push({
          label: `  └ ${item.name}`,
          status: item.has ? 'ok' : 'fail',
        })
      }
    }
  }

  return steps
}

// ─── 하위 컴포넌트 ───

function PipelineStep({
  label,
  status,
  detail,
}: PipelineStepData): React.JSX.Element {
  const icon =
    status === 'ok'
      ? '✓'
      : status === 'warn'
        ? '△'
        : status === 'skip'
          ? '—'
          : '✗'
  const color =
    status === 'ok'
      ? 'text-success-600'
      : status === 'warn'
        ? 'text-warning-600'
        : status === 'skip'
          ? 'text-slate-400'
          : 'text-danger-600'

  return (
    <span className={`text-xs ${color}`}>
      <span className="font-bold">{icon}</span>{' '}
      <span className="font-medium">{label}</span>
      {detail && <span className="text-slate-400"> {detail}</span>}
    </span>
  )
}

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

function formatTime(date: Date): string {
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}분 ${s}초`
}
