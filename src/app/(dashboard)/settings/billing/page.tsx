import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '결제 내역',
}

export default function SettingsBillingPage(): React.JSX.Element {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">결제 내역</h1>
      <p className="mt-2 text-slate-500">
        결제 내역과 영수증이 여기에 표시됩니다.
      </p>
    </div>
  )
}
