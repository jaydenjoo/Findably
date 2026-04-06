import { NextResponse } from 'next/server'

import { isPaidAnalysisData } from '@/features/diagnosis-paid'
import { ReportDocument } from '@/features/report'
import { generatePdfBuffer } from '@/lib/adapters/pdf'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params

  // 1. 인증 확인
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // 2. diagnosis 조회 (RLS가 user_id 자동 필터)
  const { data: diagnosis, error } = await supabase
    .from('diagnoses')
    .select('id, url, tier, analysis_data, total_score, grade, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !diagnosis) {
    return NextResponse.json(
      { error: '리포트를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 3. 유료 확인
  if (diagnosis.tier !== 'paid') {
    return NextResponse.json(
      { error: '유료 리포트만 PDF 다운로드가 가능합니다.' },
      { status: 403 }
    )
  }

  // 4. 타입 검증
  if (!isPaidAnalysisData(diagnosis.analysis_data)) {
    return NextResponse.json(
      { error: '분석 데이터가 올바르지 않습니다.' },
      { status: 500 }
    )
  }

  // 5. PDF 생성
  const domain = (() => {
    try {
      return new URL(diagnosis.url).hostname
    } catch {
      return 'report'
    }
  })()
  const dateStr = new Date(diagnosis.created_at).toISOString().slice(0, 10)
  const fileName = `findably-report-${domain}-${dateStr}.pdf`

  try {
    const gradeLabels: Record<string, string> = {
      excellent: '양호',
      good: '보통',
      warning: '주의',
      critical: '심각',
    }

    // Phase A (2026-04-06): single source of truth = analysis_data.overallScore
    // 기존에는 diagnoses.total_score(aggregateScores 5-매크로 평균)와
    // analysis_data.overallScore.score(engine 7-카테고리 평균)가 서로 달라서
    // 커버는 62점 / SWOT 본문은 72점처럼 불일치 발생. 이제 analysis_data를
    // canonical로 통일하고 DB total_score 컬럼은 레거시 데이터 fallback.
    const canonicalOverall = diagnosis.analysis_data.overallScore
    const canonicalScore = canonicalOverall?.score ?? diagnosis.total_score ?? 0
    const canonicalGrade = canonicalOverall?.grade ?? diagnosis.grade ?? ''

    const document = (
      <ReportDocument
        data={diagnosis.analysis_data}
        url={diagnosis.url}
        createdAt={diagnosis.created_at}
        totalScore={canonicalScore}
        gradeLabel={gradeLabels[canonicalGrade] ?? canonicalGrade ?? '—'}
      />
    )
    const buffer = await generatePdfBuffer(document)

    // 6. Response 반환 (Buffer.from으로 ArrayBuffer 제네릭 호환)
    return new Response(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[GET /api/reports/[id]/pdf]', err)
    return NextResponse.json(
      { error: 'PDF 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
