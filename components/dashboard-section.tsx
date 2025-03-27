import { Building, Users, ShieldCheck, Activity, FolderKanban, TrendingUp } from "lucide-react"

export default function DashboardSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-brand-lightgreen px-3 py-1 text-sm text-brand-darkgreen font-medium">
              Pour les CEO et managers
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Pilotez votre <span className="gradient-text">équipe</span> efficacement
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Des outils puissants pour gérer votre équipe, suivre la productivité et optimiser les performances.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureCard
                icon={<Building className="h-8 w-8 text-brand-darkgreen" />}
                title="Espace entreprise dédié"
                description="Créez un espace de travail dédié pour votre entreprise avec une gestion centralisée."
              />
              <FeatureCard
                icon={<Users className="h-8 w-8 text-brand-darkgreen" />}
                title="Gestion des membres"
                description="Invitez et gérez facilement les membres de votre équipe au sein de votre espace."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-8 w-8 text-brand-darkgreen" />}
                title="Rôles et permissions"
                description="Attribuez des rôles et des permissions spécifiques à chaque membre de l'équipe."
              />
              <FeatureCard
                icon={<Activity className="h-8 w-8 text-brand-darkgreen" />}
                title="Suivi de productivité"
                description="Suivez la productivité de votre équipe avec des métriques claires et des indicateurs de performance."
              />
              <FeatureCard
                icon={<FolderKanban className="h-8 w-8 text-brand-darkgreen" />}
                title="Gestion de projets"
                description="Gérez des projets d'entreprise avec des tableaux Kanban, des jalons et des échéances."
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8 text-brand-darkgreen" />}
                title="Rapports de performance"
                description="Générez des rapports détaillés sur la performance de l'équipe et l'avancement des projets."
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <img
                src="/placeholder.svg?height=500&width=600"
                alt="Tableau de bord d'équipe"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="flex flex-col p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="mb-3 p-2 bg-brand-lightgreen rounded-full w-fit">{icon}</div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  )
} 