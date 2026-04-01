import type { Metadata } from 'next'
import Link from 'next/link'
import { PRICING } from '@/config/pricing'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '요금제',
  description:
    'Findably 무료 진단과 건당 9.9만원 상세 분석 요금제를 비교해보세요.',
}

const FREE_FEATURES = [
  '종합 마케팅 점수',
  'SEO/GEO/콘텐츠 카테고리별 점수',
  'AI 인용 가능성 예측',
  'Quick Win 1개 무료 제공',
  '기본 진단 리포트 (웹)',
]

const PAID_FEATURES = [
  '5-Agent AI 심층 분석',
  'SWOT 분석 자동 생성',
  '90일 실행 로드맵',
  'AI 인용 실제 추적 (4개 플랫폼)',
  '경쟁사 비교 분석 (3개사)',
  'CMO 검증 리포트',
  '상세 웹 리포트 + PDF 다운로드',
  '모든 Quick Win 열람',
]

export default function PricingPage(): React.JSX.Element {
  const formattedAmount = new Intl.NumberFormat('ko-KR').format(
    PRICING.DIAGNOSIS_AMOUNT
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* 헤더 */}
      <div className="mb-12 text-center">
        <Badge
          variant="secondary"
          className="mb-4 bg-primary-50 text-primary-700"
        >
          심플한 요금제
        </Badge>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-slate-900">
          내 사이트에 맞는 플랜을 선택하세요
        </h1>
        <p className="mt-3 text-base text-slate-500">
          무료로 시작하고, 필요할 때 상세 분석을 받아보세요
        </p>
      </div>

      {/* 요금제 카드 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 무료 */}
        <Card className="relative shadow-sm transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">
              무료 진단
            </CardTitle>
            <div className="mt-2">
              <span className="font-display text-4xl font-bold text-slate-900">
                0원
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              URL 입력만으로 즉시 진단
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-success-500" aria-hidden="true">
                    ✓
                  </span>
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href="/signup"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              >
                무료로 시작하기 →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 유료 (건당) */}
        <Card className="relative border-primary-200 shadow-sm transition-shadow hover:shadow-md">
          <div className="absolute -top-3 left-6">
            <Badge className="bg-primary-500 text-white">추천</Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">
              상세 분석
            </CardTitle>
            <div className="mt-2">
              <span className="font-display text-4xl font-bold text-primary-600">
                {PRICING.DIAGNOSIS_AMOUNT_LABEL}
              </span>
              <span className="ml-1 text-sm text-slate-500">/ 건</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              AI 5-Agent가 심층 분석 + 실행 계획
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PAID_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-primary-500" aria-hidden="true">
                    ✓
                  </span>
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href="/onboarding/url"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'w-full bg-primary-500 hover:bg-primary-600 text-white'
                )}
              >
                상세 분석 받기 — {formattedAmount}원 →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 하단 안내 */}
      <div className="mt-12 text-center">
        <p className="text-sm text-slate-400">
          먼저 무료 진단으로 시작한 후, 결과를 보고 상세 분석 여부를 결정하세요.
        </p>
        <Link
          href="/reports/sample"
          className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          샘플 리포트 먼저 보기 →
        </Link>
      </div>
    </div>
  )
}
