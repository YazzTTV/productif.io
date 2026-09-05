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
 *
 * Nuance ajoutée le 31 août, jour du lancement Product Hunt : l'aperçu de lien
 * EST lu par le visiteur, avant le clic, dès que le lien est partagé sur X,
 * LinkedIn, Slack ou Discord. Il n'y avait aucun og:image, donc chaque partage
 * affichait une carte sans visuel, et twitter:card valait "summary", la petite
 * vignette. La carte est en ANGLAIS parce que le partage du lancement vise un
 * public international, alors que le titre et la description restent français
 * pour le référencement, qui cible des étudiants francophones. C'est un
 * compromis assumé, pas un oubli : à refaire en français si le canal principal
 * redevient francophone.
 */

/** Carte d'aperçu de lien, 1200x630 qui est le format recommandé par Open Graph.
 *  Fabriquée par le moteur des visuels Product Hunt, donc à la charte au pixel.
 *  URL absolue et non relative : le layout racine ne déclare pas de
 *  metadataBase, et une URL relative sortirait cassée dans les aperçus.
 *  Et sur l'hôte AVEC www, qui est le seul canonique : productif.io renvoie
 *  un 308 vers www.productif.io, et un robot d'aperçu de lien ne suit pas
 *  toujours une redirection pour une image. Vérifié le 31 août : sans www
 *  l'image répond 308, avec www elle répond 200 en image/png.
 *  Le libellé dit "your apps" et non "your phone" : l'app bloque les
 *  applications sélectionnées pendant une session, elle ne verrouille pas le
 *  téléphone. */
const OG_IMAGE = {
  url: "https://www.productif.io/og-mode-examen.png",
  width: 1200,
  height: 630,
  alt: "Exam Mode: your apps stay locked until the work is done.",
}

const OG_DESCRIPTION =
  "Ton planning de révisions se construit tout seul. Et ton téléphone se bloque jusqu'à ce que tu l'aies fait."

export const metadata: Metadata = {
  title: "Mode Examen - productif.io | Ton planning de révisions se construit tout seul",
  description:
    "Tu sais quoi faire, le problème c'est de t'y mettre. Ton planning de révisions se construit tout seul et ton téléphone se bloque jusqu'à la fin du bloc. Conçu pour PACES, prépa, droit et concours.",
  openGraph: {
    title: "Mode Examen - productif.io",
    description: OG_DESCRIPTION,
    type: "website",
    url: "https://www.productif.io/mode-examen",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mode Examen - productif.io",
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
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
