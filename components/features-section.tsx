import { CheckSquare, Clock, Calendar, Target, BarChart, LineChart, ClipboardList, Settings } from "lucide-react"

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-brand-lightgreen px-3 py-1 text-sm text-brand-green font-medium">
              Fonctionnalités
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Tout ce dont vous avez besoin pour <span className="gradient-text">exceller</span>
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Notre plateforme combine gestion de tâches, suivi du temps, développement d'habitudes et bien plus encore
              dans une solution complète.
            </p>
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Pour les utilisateurs individuels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<CheckSquare className="h-10 w-10 text-brand-green" />}
              title="Gestion complète des tâches"
              description="Créez, organisez et suivez vos tâches avec des listes, des étiquettes et des priorités personnalisables."
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10 text-brand-green" />}
              title="Suivi du temps"
              description="Mesurez le temps passé sur chaque tâche pour optimiser votre productivité et identifier les domaines d'amélioration."
            />
            <FeatureCard
              icon={<Calendar className="h-10 w-10 text-brand-green" />}
              title="Habitudes quotidiennes"
              description="Créez et suivez des habitudes quotidiennes ou hebdomadaires pour développer une routine productive."
            />
            <FeatureCard
              icon={<Target className="h-10 w-10 text-brand-green" />}
              title="Objectifs personnels"
              description="Définissez des objectifs SMART et suivez votre progression vers leur réalisation."
            />
            <FeatureCard
              icon={<BarChart className="h-10 w-10 text-brand-green" />}
              title="Tableau de bord personnalisé"
              description="Visualisez vos métriques de productivité les plus importantes sur un tableau de bord entièrement personnalisable."
            />
            <FeatureCard
              icon={<LineChart className="h-10 w-10 text-brand-green" />}
              title="Statistiques de progression"
              description="Analysez votre productivité avec des graphiques détaillés et des visualisations de données."
            />
            <FeatureCard
              icon={<ClipboardList className="h-10 w-10 text-brand-green" />}
              title="Historique détaillé"
              description="Consultez l'historique complet de vos tâches terminées pour suivre vos accomplissements."
            />
            <FeatureCard
              icon={<Settings className="h-10 w-10 text-brand-green" />}
              title="Espace configurable"
              description="Personnalisez votre espace de travail selon vos préférences et votre flux de travail."
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="mb-4 p-3 bg-brand-lightgreen rounded-full">{icon}</div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  )
} 