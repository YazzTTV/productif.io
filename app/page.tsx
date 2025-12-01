import SiteHeader from "@/components/site-header"
import { Hero } from "@/components/hero"
import { Stats } from "@/components/stats"
import { Features } from "@/components/features"
import { Comparison } from "@/components/comparison"
import { Testimonials } from "@/components/testimonials"
import { DownloadCTA } from "@/components/download-cta"
import { Faq } from "@/components/faq"
import { FinalCTA } from "@/components/final-cta"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />
      <Hero />
      <Stats />
      <Features />
      <Comparison />
      <Testimonials />
      <DownloadCTA />
      <Faq />
      <FinalCTA />
      <Footer />
    </main>
  )
} 