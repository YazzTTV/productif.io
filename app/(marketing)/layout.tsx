import React from "react"
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
      {children}
      <Footer />
    </>
  )
} 