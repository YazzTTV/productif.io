import { Header } from "@/components/header"
// import { Hero } from "@/components/hero" // Ancienne version sans vidéo
import { Hero } from "@/components/hero" // Version avec vidéo YouTube
// import { HeroWithLocalVideo as Hero } from "@/components/hero-with-local-video" // Version avec vidéo locale
import { Features } from "@/components/features"
import { Comparison } from "@/components/comparison"
import { Testimonials } from "@/components/testimonials"
import { Pricing } from "@/components/pricing"
import { Faq } from "@/components/faq"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <Comparison />
      <Testimonials />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  )
} 