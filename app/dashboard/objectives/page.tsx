import { Metadata } from "next"
import { ObjectivesClient } from "@/components/objectives/objectives-client"

export const metadata: Metadata = {
  title: "Objectifs | Productif.io",
  description: "Gérez vos objectifs et votre roadmap stratégique",
}

export default async function ObjectivesPage() {
  return <ObjectivesClient />
} 