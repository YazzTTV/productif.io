import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CtaSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-brand-darkgreen text-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Prêt à transformer votre productivité ?
            </h2>
            <p className="mx-auto max-w-[700px] text-white/80 md:text-xl">
              Commencez votre essai gratuit de 7 jours dès aujourd'hui et découvrez comment notre plateforme peut vous
              aider à atteindre vos objectifs.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button size="lg" className="bg-white text-brand-darkgreen hover:bg-white/90" asChild>
              <Link href="/register?plan=premium">Commencer l'essai gratuit</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="#features">En savoir plus</Link>
            </Button>
          </div>
          <p className="text-sm text-white/60">Sans engagement. Annulation facile à tout moment.</p>
        </div>
      </div>
    </section>
  )
} 