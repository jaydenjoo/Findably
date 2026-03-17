import { Toaster } from 'sonner'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  )
}
