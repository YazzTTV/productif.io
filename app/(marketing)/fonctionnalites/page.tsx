import { Metadata } from "next"

import { FonctionnalitesHero } from "@/components/fonctionnalites/hero"
import { FonctionnalitesFeatures } from "@/components/fonctionnalites/features"
import { FonctionnalitesAssistant } from "@/components/fonctionnalites/assistant"
import { FonctionnalitesCTA } from "@/components/fonctionnalites/cta"

export const metadata: Metadata = {
  title: "Fonctionnalités | productif.io",
  description: "Découvrez toutes les fonctionnalités offertes par productif.io pour optimiser votre productivité et votre organisation.",
}

export default function FonctionnalitesPage() {
  return (
    <div>
      <FonctionnalitesHero />
      <FonctionnalitesFeatures />
      <FonctionnalitesAssistant />
      <FonctionnalitesCTA />
    </div>
  )
} 