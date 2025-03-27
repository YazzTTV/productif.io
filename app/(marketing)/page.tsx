import HeroSection from "@/components/hero-section"
import FeaturesSection from "@/components/features-section"
import DashboardSection from "@/components/dashboard-section"
import PricingSection from "@/components/pricing-section"
import TestimonialsSection from "@/components/testimonials-section"
import FaqSection from "@/components/faq-section"
import CtaSection from "@/components/cta-section"

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <FeaturesSection />
      <DashboardSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </main>
  )
} 