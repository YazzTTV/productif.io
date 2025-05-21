import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FaqSection() {
  return (
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-brand-lightgreen px-3 py-1 text-sm text-brand-green font-medium">
              FAQ
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Questions <span className="gradient-text">fréquentes</span>
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Tout ce que vous devez savoir sur notre plateforme et nos services.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl mt-12">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Comment fonctionne le programme beta testeur ?</AccordionTrigger>
              <AccordionContent>
                Notre programme beta testeur vous donne un accès complet à toutes les fonctionnalités premium gratuitement,
                sans aucune restriction. En tant que beta testeur, vous nous aidez à améliorer notre plateforme en nous 
                fournissant vos retours d'expérience. Aucune carte bancaire n'est requise.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Combien de temps dure le programme beta testeur ?</AccordionTrigger>
              <AccordionContent>
                Le programme beta testeur durera au moins jusqu'à la sortie officielle de notre plateforme. Tous les 
                beta testeurs bénéficieront d'avantages exclusifs lorsque nous passerons à la version commerciale.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Puis-je annuler mon abonnement à tout moment ?</AccordionTrigger>
              <AccordionContent>
                Oui, vous pouvez annuler votre abonnement à tout moment. Si vous annulez, vous conserverez l'accès à
                toutes les fonctionnalités premium jusqu'à la fin de votre période de facturation en cours. Aucun
                remboursement partiel n'est effectué pour les mois non utilisés.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Combien de membres puis-je ajouter à mon espace entreprise ?</AccordionTrigger>
              <AccordionContent>
                Il n'y a pas de limite au nombre de membres que vous pouvez ajouter à votre espace entreprise. Chaque
                membre bénéficie d'un accès complet aux fonctionnalités, et le prix reste le même quel que soit la
                taille de votre équipe.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Mes données sont-elles sécurisées ?</AccordionTrigger>
              <AccordionContent>
                Absolument. Nous prenons la sécurité de vos données très au sérieux. Toutes les données sont chiffrées
                en transit et au repos. Nous effectuons des sauvegardes automatiques régulières et nous ne partageons
                jamais vos informations avec des tiers sans votre consentement explicite.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>La plateforme est-elle accessible sur mobile ?</AccordionTrigger>
              <AccordionContent>
                Oui, notre plateforme est entièrement responsive et fonctionne parfaitement sur tous les appareils
                mobiles. Vous pouvez accéder à toutes les fonctionnalités depuis votre smartphone ou tablette via votre
                navigateur web. Nous travaillons également sur des applications natives qui seront disponibles
                prochainement.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>Proposez-vous des formations pour les équipes ?</AccordionTrigger>
              <AccordionContent>
                Oui, nous proposons des formations personnalisées pour les équipes en option payante supplémentaire. Ces
                sessions sont adaptées aux besoins spécifiques de votre entreprise et peuvent être organisées en ligne
                ou en présentiel selon vos préférences. Contactez notre équipe commerciale pour plus d'informations.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger>Comment fonctionne le support technique ?</AccordionTrigger>
              <AccordionContent>
                Tous nos clients premium bénéficient d'un support prioritaire par email avec un temps de réponse garanti
                sous 24 heures. Notre équipe de support technique est disponible du lundi au vendredi de 9h à 18h. Nous
                proposons également une documentation complète et des tutoriels intégrés pour vous aider à tirer le
                meilleur parti de notre plateforme.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  )
} 