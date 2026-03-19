import Link from 'next/link'

const Footer = () => (
  <footer className="bg-findably-dark text-slate-400 py-20 px-6 border-t border-findably-light/5">
    <div className="max-w-[1120px] mx-auto">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2">
          <div className="text-xl font-bold text-findably-light mb-6">
            <span className="text-findably-cyan">F</span>indably
          </div>
          <p className="max-w-xs text-sm leading-[1.7]">
            마케팅 진단 결과를 바로 실행할 수 있는 계획으로. AI 기반 자동 진단
            및 개선 가이드 도구.
          </p>
        </div>
        <div>
          <h5 className="text-findably-light font-bold mb-6 text-sm">제품</h5>
          <ul className="space-y-4 text-sm">
            <li>
              <Link
                href="/pricing"
                className="hover:text-findably-cyan transition-colors"
              >
                가격
              </Link>
            </li>
            <li>
              <Link
                href="/reports/sample"
                className="hover:text-findably-cyan transition-colors"
              >
                샘플 리포트
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="text-findably-light font-bold mb-6 text-sm">법적</h5>
          <ul className="space-y-4 text-sm">
            <li>
              <Link
                href="/terms"
                className="hover:text-findably-cyan transition-colors"
              >
                이용약관
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="hover:text-findably-cyan transition-colors"
              >
                개인정보처리방침
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="pt-8 border-t border-findably-light/5 space-y-4">
        <p className="text-[11px] leading-relaxed">
          * Findably는 마케팅 진단 및 개선 방향 가이드를 제공하는 도구이며, 특정
          매출이나 수익을 보장하지 않습니다. 리포트 내 비즈니스 영향도 분석은
          업종 평균 벤치마크 기준의 참고 정보이며, 실제 결과는 다를 수 있습니다.
        </p>
        <p className="text-[11px]">© 2026 Findably. All rights reserved.</p>
      </div>
    </div>
  </footer>
)

export default Footer
