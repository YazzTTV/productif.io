"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function Faq() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Questions Fréquentes <span className="text-green-500">👋</span>
        </h2>
      </div>

      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b border-gray-200">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              En quoi Productif.io est différent des autres outils de productivité ?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              La plupart des outils te demandent de t'adapter à eux. Productif.io fait l'inverse: il s'adapte à toi, à ton rythme, à tes priorités réelles. Et surtout, notre assistant IA vient à toi via WhatsApp — pas besoin d'ouvrir une app de plus. Il te guide tout au long de ta journée avec des rappels intelligents, adaptés à ton contexte.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b border-gray-200">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              Comment fonctionne l'offre waitlist à 1€ ?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              En payant 1€, tu réserves ta place dans notre waitlist exclusive limitée à 150 personnes. Ce petit investissement symbolique nous permet de filtrer les personnes réellement intéressées. Lors du lancement officiel, tu auras accès en priorité à notre offre Lifetime exceptionnelle à un tarif préférentiel. Ce tarif ne changera jamais pour toi, même quand nous augmenterons nos prix à l'avenir.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-b border-gray-200">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              Comment fonctionne l'assistant WhatsApp ?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              Tu reçois des messages personnalisés qui te guident tout au long de ta journée. Rappels de tâches au bon moment, check-ins pour tes habitudes, réorganisation de planning en fonction des imprévus... tout passe par une conversation naturelle. C'est comme avoir un assistant personnel dans ta poche, qui comprend ton contexte et t'aide à rester focalisé sur ce qui compte vraiment.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-b border-gray-200">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              Mes données sont-elles sécurisées ?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              Absolument. La sécurité de tes données est notre priorité. Nous utilisons un chiffrement de bout en bout,
              des sauvegardes automatiques et des protocoles de sécurité avancés pour protéger tes informations. Tes
              données t'appartiennent et ne sont jamais partagées avec des tiers. Productif.io existe pour t'aider à reprendre le contrôle de ta vie, pas pour prendre le contrôle de tes données.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="px-6 py-4 text-gray-900 hover:text-green-500 hover:no-underline">
              Qu'est-ce que je gagne exactement avec cette waitlist ?
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 text-gray-600">
              En rejoignant la waitlist pour 1€, tu obtiens: 1) Un accès anticipé à Productif.io avant son lancement officiel, 2) L'offre Lifetime à un tarif préférentiel qui ne sera jamais reproduit, 3) Un accompagnement personnalisé pour maximiser les bénéfices de l'outil, 4) La priorité absolue sur les nouvelles fonctionnalités à venir, et 5) La certitude de faire partie des premiers à bénéficier d'une technologie qui va transformer ta productivité.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
} 