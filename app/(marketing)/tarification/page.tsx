import { Metadata } from "next"
import { Pricing } from "@/components/pricing"

export const metadata: Metadata = {
  title: "Tarification | productif.io",
  description: "Découvrez nos offres et tarification pour accéder à toutes les fonctionnalités de productif.io.",
}

export default function TarificationPage() {
  return (
    <div>
      <Pricing />
    </div>
  )
} 