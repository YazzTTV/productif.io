import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-brand-lightgreen px-3 py-1 text-sm text-brand-darkgreen font-medium">
              Témoignages
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Ce que nos <span className="gradient-text">clients</span> disent
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Découvrez comment notre plateforme a transformé la productivité de nos utilisateurs.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <TestimonialCard
            name="Sophie Martin"
            role="Entrepreneur indépendante"
            image="/placeholder.svg?height=100&width=100"
            quote="Cette plateforme a complètement transformé ma façon de gérer mes tâches quotidiennes. Le suivi du temps m'a permis d'identifier où je perdais des heures précieuses."
          />
          <TestimonialCard
            name="Benjamin Courdrais"
            role="Directeur Marketing"
            image="/placeholder.svg?height=100&width=100"
            quote="En tant que manager d'équipe, les fonctionnalités de suivi de productivité et les rapports de performance sont inestimables. Nous avons augmenté notre efficacité de 30% en trois mois."
          />
          <TestimonialCard
            name="Julie Leroy"
            role="Développeuse Freelance"
            image="/placeholder.svg?height=100&width=100"
            quote="Le système de suivi d'habitudes m'a aidée à développer une routine de travail plus saine. Je suis plus productive et moins stressée qu'avant."
          />
          <TestimonialCard
            name="Marc Dupont"
            role="CEO, TechStart SAS"
            image="/placeholder.svg?height=100&width=100"
            quote="Nous utilisons cette plateforme pour toute notre équipe de 15 personnes. La gestion des projets et l'attribution des tâches n'ont jamais été aussi fluides."
          />
          <TestimonialCard
            name="Émilie Bernard"
            role="Consultante RH"
            image="/placeholder.svg?height=100&width=100"
            quote="L'espace configurable me permet d'adapter l'outil exactement à mes besoins. Le support client est également exceptionnel, toujours réactif et utile."
          />
          <TestimonialCard
            name="Alexandre Petit"
            role="Directeur des Opérations"
            image="/placeholder.svg?height=100&width=100"
            quote="Les métriques d'équipe nous donnent une visibilité sans précédent sur notre productivité collective. Un outil indispensable pour toute entreprise sérieuse."
          />
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ name, role, image, quote }) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex mb-4">
          <Star className="h-5 w-5 fill-brand-yellow text-brand-yellow" />
          <Star className="h-5 w-5 fill-brand-yellow text-brand-yellow" />
          <Star className="h-5 w-5 fill-brand-yellow text-brand-yellow" />
          <Star className="h-5 w-5 fill-brand-yellow text-brand-yellow" />
          <Star className="h-5 w-5 fill-brand-yellow text-brand-yellow" />
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">"{quote}"</p>
      </CardContent>
      <CardFooter className="px-6 py-4 border-t flex items-center">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
        </div>
      </CardFooter>
    </Card>
  )
} 