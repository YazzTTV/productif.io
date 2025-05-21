import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PricingSection() {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-brand-lightgreen px-3 py-1 text-sm text-brand-green font-medium">
              Tarification
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Une offre <span className="gradient-text">simple</span> et transparente
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Accédez à toutes les fonctionnalités premium avec notre formule unique, sans restrictions.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl mt-12">
          <Card className="relative overflow-hidden border-2 border-brand-green">
            <div className="absolute top-0 right-0 bg-brand-green text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
              Programme Beta
            </div>
            <CardHeader className="pb-8 pt-10">
              <CardTitle className="text-3xl font-bold text-center">Premium</CardTitle>
              <CardDescription className="text-center text-lg mt-2">
                Toutes les fonctionnalités, sans restriction
              </CardDescription>
              <div className="mt-6 text-center">
                <span className="text-5xl font-bold gradient-text">Gratuit</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">pendant la beta</span>
              </div>
              <p className="text-center text-gray-500 dark:text-gray-400 mt-2">
                Programme beta testeur limité
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-lg">Fonctionnalités individuelles</h4>
                  <ul className="space-y-2">
                    <PricingItem>Gestion complète des tâches</PricingItem>
                    <PricingItem>Suivi du temps</PricingItem>
                    <PricingItem>Habitudes quotidiennes/hebdomadaires</PricingItem>
                    <PricingItem>Objectifs personnels</PricingItem>
                    <PricingItem>Tableau de bord personnalisé</PricingItem>
                    <PricingItem>Statistiques de progression</PricingItem>
                    <PricingItem>Historique détaillé</PricingItem>
                    <PricingItem>Espace configurable</PricingItem>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-lg">Fonctionnalités entreprise</h4>
                  <ul className="space-y-2">
                    <PricingItem>Espace entreprise dédié</PricingItem>
                    <PricingItem>Gestion des membres</PricingItem>
                    <PricingItem>Rôles et permissions</PricingItem>
                    <PricingItem>Suivi de productivité d'équipe</PricingItem>
                    <PricingItem>Métriques d'équipe</PricingItem>
                    <PricingItem>Gestion de projets</PricingItem>
                    <PricingItem>Attribution de tâches</PricingItem>
                    <PricingItem>Rapports de performance</PricingItem>
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-lg mb-2">Avantages premium inclus</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <PricingItem>Support prioritaire</PricingItem>
                  <PricingItem>Mises à jour en avant-première</PricingItem>
                  <PricingItem>Sauvegarde automatique</PricingItem>
                  <PricingItem>Synchronisation multi-appareils</PricingItem>
                  <PricingItem>Accès mobile (responsive)</PricingItem>
                  <PricingItem>Documentation complète</PricingItem>
                  <PricingItem>Tutoriels intégrés</PricingItem>
                  <PricingItem>Support technique réactif</PricingItem>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 pb-8">
              <Button size="lg" className="w-full bg-brand-green hover:bg-brand-green/90" asChild>
                <Link href="/register?plan=premium">Devenir beta testeur</Link>
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Aucune carte bancaire requise. Places limitées.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}

function PricingItem({ children }) {
  return (
    <li className="flex items-center">
      <CheckCircle className="h-5 w-5 text-brand-green mr-2 flex-shrink-0" />
      <span>{children}</span>
    </li>
  )
} 