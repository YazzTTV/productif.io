import { Metadata } from "next"

import { FonctionnalitesHero } from "@/components/fonctionnalites/hero"
import { FonctionnalitesFeatures } from "@/components/fonctionnalites/features"
import { FonctionnalitesAssistant } from "@/components/fonctionnalites/assistant"
import { FonctionnalitesCTA } from "@/components/fonctionnalites/cta"

export const metadata: Metadata = {
  title: "Features | productif.io",
  description: "Discover all the features offered by productif.io to optimize your productivity and organization.",
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