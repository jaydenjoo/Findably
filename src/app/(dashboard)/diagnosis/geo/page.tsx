import type { Metadata } from 'next'
import { getDiagnosisAction } from '@/features/diagnosis-free/actions/get-diagnosis'
import { GeoDetail } from './_components/GeoDetail'
import { EmptyState } from '@/components/shared/EmptyState'
import { AlertCircle, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'GEO 상세 분석',
  description: 'AI 검색 엔진에서 사이트가 인용될 가능성을 상세 분석합니다.',
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DiagnosisGeoPage(
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
          href: isNotFound ? '/onboarding/url' : '/diagnosis/geo',
        }}
      />
    )
  }

  return (
    <GeoDetail
      categories={data.analysisData.overallScore.categories}
      citation={data.analysisData.aiCitation}
      tier={data.tier}
    />
  )
}
