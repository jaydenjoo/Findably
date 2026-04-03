'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getDiagnosisStatus } from '@/features/onboarding/actions/get-diagnosis-status'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface PaidAnalyzingStateProps {
  diagnosisId: string
  isPaid: boolean
}

/** 유료 분석 5단계 */
const PAID_STAGES = [
  { key: 'technical', label: '기술 전문가가 속도·보안·모바일을 검사 중' },
  { key: 'seo', label: 'SEO 전문가가 검색 최적화를 분석 중' },
  { key: 'geo', label: 'GEO 전문가가 AI 검색 노출을 분석 중' },
  { key: 'content', label: '콘텐츠 전문가가 글 품질을 평가 중' },
  { key: 'verify', label: 'CMO가 최종 검증 중' },
] as const

/** 무료 분석 단계 */
const FREE_STAGES = [
  { key: 'crawling', label: '웹사이트 크롤링' },
  { key: 'technical', label: '기술 분석' },
  { key: 'seo', label: 'SEO 분석' },
  { key: 'content', label: '콘텐츠 분석' },
  { key: 'scoring', label: '점수 산출' },
] as const

/** 폴링 간격 (ms) */
const POLL_INTERVAL = 5_000

/** 예상 소요 시간 (초) */
const PAID_ESTIMATED_SECONDS = 60
const FREE_ESTIMATED_SECONDS = 120

export function PaidAnalyzingState({
  diagnosisId,
  isPaid,
}: PaidAnalyzingStateProps): React.JSX.Element {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const triggerCalledRef = useRef(false)

  const stages = isPaid ? PAID_STAGES : FREE_STAGES
  const estimatedSeconds = isPaid
    ? PAID_ESTIMATED_SECONDS
    : FREE_ESTIMATED_SECONDS

  const isOvertime = elapsed >= estimatedSeconds
  const progress = Math.min((elapsed / estimatedSeconds) * 90, 90)

  const remaining = Math.max(estimatedSeconds - elapsed, 0)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  const stageInterval = Math.floor(estimatedSeconds / stages.length)
  const activeStageIndex = Math.min(
    Math.floor(elapsed / stageInterval),
    stages.length - 1
  )

  const pollStatus = useCallback(async (): Promise<void> => {
    const result = await getDiagnosisStatus(diagnosisId)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.status === 'completed') {
      router.refresh()
      return
    }

    if (result.status === 'failed') {
      setError('분석 중 문제가 발생했습니다. 페이지를 새로고침해주세요.')
    }
  }, [diagnosisId, router])

  // 유료 분석 트리거 — 프론트엔드에서 직접 호출 (Vercel 서버리스 fire-and-forget 불안정 대응)
  useEffect(() => {
    if (!isPaid || triggerCalledRef.current) return
    triggerCalledRef.current = true

    fetch('/api/payment/trigger-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosisId }),
    }).catch(() => {
      // trigger-analysis가 60초간 실행되므로 timeout 에러가 날 수 있음
      // 실제 상태는 pollStatus에서 확인
    })
  }, [diagnosisId, isPaid])

  // 경과 시간 타이머
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // 폴링
  useEffect(() => {
    const initialTimeout = setTimeout(() => {
      void pollStatus()
    }, 0)

    pollRef.current = setInterval(() => {
      void pollStatus()
    }, POLL_INTERVAL)

    return () => {
      clearTimeout(initialTimeout)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [pollStatus])

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Card className="shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl tracking-[-0.02em]">
              분석에 문제가 발생했습니다
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="cursor-pointer text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              새로고침 →
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg py-10">
      <Card className="relative shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-lg before:bg-primary-500">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl tracking-[-0.02em]">
            {isPaid
              ? 'AI 전문가 5명이 분석 중입니다'
              : '사이트를 분석하고 있습니다'}
          </CardTitle>
          <CardDescription>
            {isPaid
              ? '각 전문가가 심층 분석을 진행하고 있습니다. 곧 완료됩니다.'
              : '잠시만 기다려주세요. 분석이 자동으로 완료됩니다.'}
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
            {stages.map((stage, index) => {
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
    </div>
  )
}
