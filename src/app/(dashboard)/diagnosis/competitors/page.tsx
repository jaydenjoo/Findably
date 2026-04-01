import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  isPaidAnalysisData,
  type CompetitorAnalysis,
} from '@/features/diagnosis-paid'
import { buildMatrix, analyzeGaps } from '@/features/competitors'
import { CompetitorsContent } from './_components/CompetitorsContent'

export const metadata: Metadata = {
  title: '경쟁사 비교 분석',
  description: '경쟁사와 비교한 마케팅 점수를 확인하세요.',
}

// ─── Helpers ───

function isCategoryEntry(v: unknown): v is { id: string; score?: number } {
  return v != null && typeof v === 'object' && 'id' in v
}

function getCategoryScore(
  data: Record<string, unknown>,
  categoryId: string
): number | null {
  if (!Array.isArray(data.categoryScores)) return null
  const cat = data.categoryScores
    .filter(isCategoryEntry)
    .find((c) => c.id === categoryId)
  return typeof cat?.score === 'number' ? cat.score : null
}

function getOverallScore(
  data: Record<string, unknown>,
  fallback: number
): number {
  const os = data.overallScore
  if (os == null || typeof os !== 'object' || !('score' in os)) return fallback
  const score = (os as Record<string, unknown>).score
  return typeof score === 'number' ? score : fallback
}

// ─── Page ───

export default async function DiagnosisCompetitorsPage(): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 최신 진단 결과 조회
  const { data: diagnosis } = await supabase
    .from('diagnoses')
    .select('id, url, analysis_data, total_score, status, payment_status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const isPaid = diagnosis?.payment_status === 'paid'
  const analysisData =
    diagnosis?.analysis_data != null &&
    typeof diagnosis.analysis_data === 'object'
      ? (diagnosis.analysis_data as Record<string, unknown>)
      : null

  // 경쟁사 목록 추출 (유료 데이터에서만)
  const competitors: CompetitorAnalysis[] =
    analysisData != null && isPaidAnalysisData(analysisData)
      ? analysisData.competitors
      : []

  // 비교 매트릭스 생성 (순수 함수)
  const matrix = buildMatrix({
    originalUrl: diagnosis?.url ?? '',
    originalScores: {
      performance: analysisData
        ? getCategoryScore(analysisData, 'performance')
        : null,
      seo: analysisData ? getCategoryScore(analysisData, 'technical') : null,
      accessibility: null,
      content: analysisData ? getCategoryScore(analysisData, 'content') : null,
      geo: analysisData ? getCategoryScore(analysisData, 'geo') : null,
      overall: analysisData
        ? getOverallScore(analysisData, diagnosis?.total_score ?? 0)
        : (diagnosis?.total_score ?? 0),
    },
    crawlResults: [],
    aiCompetitors: competitors,
  })

  // 격차 분석 (순수 함수)
  const gapAnalysis = analyzeGaps(matrix)

  return (
    <CompetitorsContent
      matrix={matrix}
      gapAnalysis={gapAnalysis}
      isPaid={isPaid}
    />
  )
}
