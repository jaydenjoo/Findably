import { GNB } from '@/components/shared/GNB'
import { Footer } from '@/components/shared/Footer'

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <>
      <GNB />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  )
}
