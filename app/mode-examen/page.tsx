import type { Metadata } from "next"
import { ModeExamenContent } from "./mode-examen-content"
import { PRICE_MONTHLY, PRICE_YEARLY } from "@/lib/pricing"

/**
 * Landing de campagne, point de chute du trafic TikTok / Instagram.
 *
 * Volontairement distincte de la homepage : celle-ci vouvoie et s'adresse à un
 * public large ("coach IA", "Transformez la concentration en discipline"), alors
 * que les créas et les bios des comptes tutoient et promettent deux choses
 * précises, le planning qui se construit seul et le téléphone qui se bloque.
 * Servir la homepage à ce trafic crée une rupture entre la pub et la page.
 *
 * Ce fichier ne porte plus que les métadonnées et le JSON-LD, qui exigent un
 * composant serveur. Tout le rendu est dans ModeExamenContent, qui est client
 * parce que le sélecteur de langue a besoin d'un état. La copie des deux
 * langues est dans ./copy.ts, les prix dans lib/pricing.ts, jamais retapés.
 *
 * Les métadonnées restent en français : elles sont lues par les moteurs et les
 * aperçus de lien, pas par le visiteur, et le trafic organique visé est
 * francophone. Un basculement de langue côté client ne les change pas.
 */

export const metadata: Metadata = {
  title: "Mode Examen - productif.io | Ton planning de révisions se construit tout seul",
  description:
    "Tu sais quoi faire, le problème c'est de t'y mettre. Ton planning de révisions se construit tout seul et ton téléphone se bloque jusqu'à la fin du bloc. Conçu pour PACES, prépa, droit et concours.",
  openGraph: {
    title: "Mode Examen - productif.io",
    description:
      "Ton planning de révisions se construit tout seul. Et ton téléphone se bloque jusqu'à ce que tu l'aies fait.",
    type: "website",
    url: "https://productif.io/mode-examen",
  },
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "productif.io",
  applicationCategory: "EducationApplication",
  operatingSystem: "iOS",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: `Version gratuite disponible, Premium à ${PRICE_MONTHLY} EUR/mois ou ${PRICE_YEARLY} EUR/an`,
  },
  description:
    "Application de révision pour étudiants : le planning se construit par priorité et les applications distrayantes sont bloquées pendant les blocs de travail.",
}

export default function ModeExamenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <ModeExamenContent />
    </>
  )
}
