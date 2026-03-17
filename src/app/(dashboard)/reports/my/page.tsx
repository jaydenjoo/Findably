import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BlurOverlay } from '@/components/shared/BlurOverlay'
import { EmptyState } from '@/components/shared/EmptyState'
import { AlertCircle, FileText, ExternalLink } from 'lucide-react'
import { SCORING } from '@/config/scoring'

export const metadata: Metadata = {
  title: '내 리포트 | Findably',
  description: '진단 리포트 목록을 확인하세요.',
}

interface DiagnosisRow {
  id: string
  url: string
  tier: string
  status: string
  total_score: number | null
  grade: string | null
  created_at: string
}

export default async function ReportsMyPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 사용자의 전체 진단 목록 조회
  const { data: diagnoses, error } = await supabase
    .from('diagnoses')
    .select('id, url, tier, status, total_score, grade, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[reports/my] DB error:', error.message)
    return (
      <EmptyState
        icon={AlertCircle}
        title="데이터를 불러올 수 없습니다"
        description="잠시 후 다시 시도해주세요."
        action={{ label: '새로고침 →', href: '/reports/my' }}
      />
    )
  }

  if (!diagnoses || diagnoses.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="아직 리포트가 없어요"
        description="URL을 입력하고 무료 진단을 시작해보세요."
        action={{ label: '진단 시작 →', href: '/onboarding/url' }}
      />
    )
  }

  // 유료 진단이 1개라도 있으면 paid 사용자
  const hasPaid = diagnoses.some((d: DiagnosisRow) => d.tier === 'paid')

  if (!hasPaid) {
    return (
      <BlurOverlay
        visiblePercent={20}
        ctaLabel="상세 분석 받기 — 9.9만원"
        ctaHref="/pricing"
        sampleLabel="샘플 먼저 보기 →"
        sampleHref="/reports/sample"
      >
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl font-bold text-slate-900">내 리포트</h1>
          <p className="text-slate-500">생성된 리포트 목록입니다.</p>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </BlurOverlay>
    )
  }

  // Paid 사용자 — 실제 리포트 목록
  const rows = diagnoses as DiagnosisRow[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">내 리포트</h1>
        <p className="mt-2 text-sm text-slate-500">
          진단 리포트 목록입니다. 클릭하여 상세 결과를 확인하세요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((d) => {
          const score = d.total_score ?? 0
          const gradeLabel = d.grade ? SCORING.getScoreLabel(score) : '—'
          const gradeColors = SCORING.getScoreColor(score)
          const isPaid = d.tier === 'paid'
          const isCompleted = d.status === 'completed'
          const dateStr = new Date(d.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          return (
            <Link
              key={d.id}
              href={isCompleted ? `/dashboard?id=${d.id}` : '#'}
              className={`group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all ${
                isCompleted
                  ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
                  : 'opacity-60 cursor-default'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: URL + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {d.url}
                    </p>
                    {isPaid && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-600">
                        유료
                      </span>
                    )}
                    {!isCompleted && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-semibold text-warning-600">
                        {d.status === 'failed' ? '실패' : '진행 중'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{dateStr}</p>
                </div>

                {/* Right: Score + arrow */}
                <div className="flex items-center gap-3">
                  {isCompleted && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg font-display text-lg font-bold tabular-nums ${gradeColors.bg} ${gradeColors.text}`}
                      >
                        {score}
                      </div>
                      <span
                        className={`text-xs font-semibold ${gradeColors.text}`}
                      >
                        {gradeLabel}
                      </span>
                    </div>
                  )}
                  {isCompleted && (
                    <ExternalLink className="size-4 text-slate-300 transition-colors group-hover:text-primary-500" />
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
