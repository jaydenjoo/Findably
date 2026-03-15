import type { Metadata } from 'next'
import { getDiagnosisAction } from '@/features/diagnosis-free/actions/get-diagnosis'
import { ContentDetail } from './_components/ContentDetail'
import { EmptyState } from '@/components/shared/EmptyState'
import { AlertCircle, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: '콘텐츠 상세 분석 | Findably',
  description: '콘텐츠 구조, 가독성, 전문성 상세 분석 결과입니다.',
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DiagnosisContentPage(
  props: PageProps
): Promise<React.JSX.Element> {
  const searchParams = await props.searchParams
  const diagnosisId =
    typeof searchParams.id === 'string' ? searchParams.id : undefined

  const { data, error } = await getDiagnosisAction(diagnosisId)

  if (error || !data) {
    const isNotFound = error === '진단 정보를 찾을 수 없습니다.'
    return (
      <EmptyState
        icon={isNotFound ? BarChart3 : AlertCircle}
        title={
          isNotFound ? '아직 진단 결과가 없어요' : '데이터를 불러올 수 없습니다'
        }
        description={
          isNotFound
            ? 'URL을 입력하고 무료 진단을 시작해보세요.'
            : '잠시 후 다시 시도해주세요.'
        }
        action={{
          label: isNotFound ? '진단 시작 →' : '새로고침 →',
          href: isNotFound ? '/onboarding/url' : '/diagnosis/content',
        }}
      />
    )
  }

  const contentCategory = data.analysisData.overallScore.categories.find(
    (c) => c.id === 'content'
  )

  if (!contentCategory) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="콘텐츠 분석 데이터가 없습니다"
        description="진단 결과에 콘텐츠 카테고리가 포함되지 않았습니다."
        action={{ label: '종합 결과 보기 →', href: '/diagnosis/overview' }}
      />
    )
  }

  return <ContentDetail contentCategory={contentCategory} tier={data.tier} />
}
