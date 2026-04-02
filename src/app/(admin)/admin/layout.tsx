import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ACCESS } from '@/config/access-control'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const isAdmin = ACCESS.ADMIN_EMAILS.includes(user.email ?? '')
  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Findably Admin</h1>
          <span className="text-xs text-slate-400">{user.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
