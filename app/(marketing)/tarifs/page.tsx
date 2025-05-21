import { Metadata } from "next"
import { Pricing } from "@/components/pricing"

export const metadata: Metadata = {
  title: "Tarifs | productif.io",
  description: "Découvrez nos offres et tarifs pour accéder à toutes les fonctionnalités de productif.io.",
}

export default function TarifsPage() {
  return (
    <div>
      <Pricing />
    </div>
  )
} 