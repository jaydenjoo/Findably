import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'Findably 개인정보처리방침',
}

export default function PrivacyPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        개인정보처리방침
      </h1>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-[1.7]">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            1. 수집하는 개인정보
          </h2>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>이메일 주소 (회원가입, 로그인)</li>
            <li>진단 대상 웹사이트 URL</li>
            <li>
              결제 정보 (Toss Payments를 통해 처리, 카드 정보 직접 저장 안 함)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            2. 개인정보 이용 목적
          </h2>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>서비스 제공 (마케팅 진단 및 리포트 생성)</li>
            <li>본인 확인 및 계정 관리</li>
            <li>결제 처리 및 환불</li>
            <li>서비스 개선 및 통계 분석 (비식별 처리)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            3. 개인정보 보유 기간
          </h2>
          <p>
            회원 탈퇴 시 즉시 삭제합니다. 단, 관계 법령에 따라 보존이 필요한
            경우 해당 기간 동안 보관합니다 (전자상거래법: 결제 기록 5년).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            4. 제3자 제공
          </h2>
          <p>
            원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 단, 결제 처리를
            위해 Toss Payments에 최소한의 정보가 전달됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            5. 데이터 보호
          </h2>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>모든 데이터는 Supabase(AWS ap-northeast-2)에 암호화 저장</li>
            <li>HTTPS 통신 필수</li>
            <li>Row Level Security(RLS) 적용 — 본인 데이터만 접근 가능</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">
            6. 이용자 권리
          </h2>
          <p>
            언제든지 개인정보 열람, 수정, 삭제를 요청할 수 있습니다. 설정
            페이지에서 직접 수정하거나, support@findably.co.kr로 문의해 주세요.
          </p>
        </section>

        <p className="text-sm text-slate-400 pt-4">시행일: 2026년 3월 1일</p>
      </div>
    </div>
  )
}
