import FaqSection from "@/components/faq-section"

export default function FaqPage() {
  return (
    <main className="flex-1 py-16">
      <div className="container">
        <h1 className="text-4xl font-bold mb-8 text-center">Questions Fréquentes</h1>
        <FaqSection />
      </div>
    </main>
  )
} 