import SiteHeader from "@/components/site-header"
import Footer from "@/components/footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
} 