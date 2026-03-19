import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관 | Findably',
  description: 'Findably 서비스 이용약관',
}

export default function TermsPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">이용약관</h1>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-[1.7]">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            제1조 (목적)
          </h2>
          <p>
            이 약관은 Findably(이하 &quot;서비스&quot;)가 제공하는 AI 마케팅
            진단 서비스의 이용 조건 및 절차에 관한 사항을 규정합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            제2조 (서비스 내용)
          </h2>
          <p>서비스는 다음을 제공합니다:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>웹사이트 SEO/GEO 자동 진단</li>
            <li>AI 기반 마케팅 점수 산출 및 개선 가이드</li>
            <li>경쟁사 비교 분석 (유료)</li>
            <li>상세 리포트 및 PDF 다운로드 (유료)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            제3조 (이용 요금)
          </h2>
          <p>
            무료 진단은 비용 없이 이용 가능합니다. 상세 분석은 건당 99,000원이
            부과되며, 결제 후 환불 정책은 결제일로부터 7일 이내, 리포트 미열람
            시 전액 환불이 가능합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            제4조 (면책)
          </h2>
          <p>
            Findably는 마케팅 진단 및 개선 방향 가이드를 제공하는 도구이며, 특정
            매출이나 수익을 보장하지 않습니다. 리포트 내 분석은 업종 평균
            벤치마크 기준의 참고 정보이며, 실제 결과는 다를 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            제5조 (지적 재산권)
          </h2>
          <p>
            서비스에서 생성된 리포트의 저작권은 이용자에게 귀속됩니다. 단,
            서비스의 분석 알고리즘, UI, 브랜드는 Findably에 귀속됩니다.
          </p>
        </section>

        <p className="text-sm text-slate-400 pt-4">시행일: 2026년 3월 1일</p>
      </div>
    </div>
  )
}
