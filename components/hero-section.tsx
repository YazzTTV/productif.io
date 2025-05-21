import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                <span className="gradient-text">Maximisez</span> votre productivité personnelle et d'équipe
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                Gérez vos tâches, suivez votre temps, développez des habitudes et atteignez vos objectifs avec notre
                plateforme tout-en-un.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" className="bg-brand-green hover:bg-brand-green/90" asChild>
                <Link href="/register?plan=premium">Devenir beta testeur</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#features">Découvrir les fonctionnalités</Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-brand-green" />
                <span>Aucune carte bancaire</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-brand-green" />
                <span>Accès complet</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="Aperçu du tableau de bord"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 