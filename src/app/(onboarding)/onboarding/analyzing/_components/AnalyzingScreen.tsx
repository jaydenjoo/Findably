'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getDiagnosisStatus } from '@/features/onboarding/actions/get-diagnosis-status'
import {
  ANALYSIS_STAGES,
  ANALYSIS_POLL_INTERVAL,
  ANALYSIS_ESTIMATED_SECONDS,
} from '@/features/onboarding/constants'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface AnalyzingScreenProps {
  diagnosisId: string
  url: string
}

/**
 * 분석 대기 화면
 *
 * 프로그레스바 + 5단계 체크리스트 + 카운트다운 타이머
 * Supabase 폴링으로 상태 변경 감지 → 완료 시 대시보드 이동
 */
export function AnalyzingScreen({
  diagnosisId,
  url,
}: AnalyzingScreenProps): React.JSX.Element {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 예상 시간 초과 여부 (elapsed에서 파생)
  const isOvertime = elapsed >= ANALYSIS_ESTIMATED_SECONDS

  // 프로그레스: 0% → 90% (120초 선형), 완료 시 100%
  const progress = Math.min((elapsed / ANALYSIS_ESTIMATED_SECONDS) * 90, 90)

  // 남은 시간 계산
  const remaining = Math.max(ANALYSIS_ESTIMATED_SECONDS - elapsed, 0)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  // 체크리스트: 경과 시간 기반 순차 활성화
  const stageInterval = Math.floor(
    ANALYSIS_ESTIMATED_SECONDS / ANALYSIS_STAGES.length
  )
  const activeStageIndex = Math.min(
    Math.floor(elapsed / stageInterval),
    ANALYSIS_STAGES.length - 1
  )

  // 폴링 콜백
  const pollStatus = useCallback(async (): Promise<void> => {
    const result = await getDiagnosisStatus(diagnosisId)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.status === 'completed') {
      router.push('/dashboard')
      return
    }

    if (result.status === 'failed') {
      setError('분석 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  }, [diagnosisId, router])

  // 경과 시간 타이머
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Supabase 폴링
  useEffect(() => {
    // 초기 1회: 마이크로태스크 이후 실행 (effect 내 동기 setState 방지)
    const initialTimeout = setTimeout(() => {
      void pollStatus()
    }, 0)

    pollRef.current = setInterval(() => {
      void pollStatus()
    }, ANALYSIS_POLL_INTERVAL)

    return () => {
      clearTimeout(initialTimeout)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [pollStatus])

  // 에러 상태
  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl tracking-[-0.02em]">
            분석에 문제가 발생했습니다
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-slate-500">
            문제가 지속되면 URL을 다시 입력해주세요.
          </p>
          <Link
            href="/onboarding/url"
            className="mt-4 inline-block text-sm font-medium text-primary-500 hover:text-primary-600"
          >
            URL 입력으로 돌아가기 →
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary-500">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-xl tracking-[-0.02em]">
          사이트를 분석하고 있습니다
        </CardTitle>
        <CardDescription>
          <span className="break-all font-medium text-slate-700">{url}</span>을
          진단하고 있습니다. 잠시만 기다려주세요.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* 프로그레스바 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">분석 진행률</span>
            <span className="tabular-nums text-slate-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`분석 진행률 ${Math.round(progress)}%`}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 분석 단계 체크리스트 */}
        <div className="space-y-3" aria-live="polite">
          {ANALYSIS_STAGES.map((stage, index) => {
            const isCompleted = index < activeStageIndex
            const isActive = index === activeStageIndex

            return (
              <div
                key={stage.key}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-300 ${
                  isActive
                    ? 'bg-primary-50 text-slate-900'
                    : isCompleted
                      ? 'text-slate-500'
                      : 'text-slate-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-500" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0" />
                )}
                <span className="text-sm font-medium">{stage.label}</span>
              </div>
            )
          })}
        </div>

        {/* 카운트다운 / 초과 안내 */}
        <div className="text-center">
          {isOvertime ? (
            <p className="text-sm text-warning-600">
              분석이 예상보다 오래 걸리고 있습니다. 조금만 더 기다려주세요.
              <br />
              <span className="text-xs text-slate-400">
                이 페이지를 벗어나도 분석은 계속 진행됩니다.
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              예상 남은 시간:{' '}
              <span className="font-display font-semibold tabular-nums text-slate-700">
                {minutes > 0 ? `${minutes}분 ` : ''}
                {seconds}초
              </span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
