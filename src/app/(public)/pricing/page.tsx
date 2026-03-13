import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '요금제',
  description:
    'Findably 무료 진단과 건당 9.9만원 상세 분석 요금제를 비교해보세요.',
}

export default function PricingPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">요금제</h1>
      <p className="mt-2 text-slate-500">
        무료 / 건당 결제 요금제 비교가 여기에 표시됩니다.
      </p>
    </div>
  )
}
