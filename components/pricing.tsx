"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Check } from "lucide-react"

export function Pricing() {
  return (
    <section className="container mx-auto px-4 py-20 bg-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Offre exclusive <span className="text-green-500">waitlist</span>
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Sécurise ton accès à vie pour moins cher que ton coiffeur.
        </p>
      </div>

      <div className="max-w-md mx-auto bg-white border border-green-200 rounded-xl p-8 shadow-md">
        <div className="text-center mb-6 relative">
          <h3 className="text-2xl font-bold text-gray-900 mt-5">Offre Lifetime</h3>
          <div className="mt-4 mb-2">
            <span className="text-5xl font-bold text-green-500">Tarif spécial</span>
          </div>
          <p className="text-green-600 font-medium">Pour toujours. Sans augmentation.</p>
        </div>

        <AnimatedButton 
          className="w-full mb-6"
          onClick={() => window.location.href = 'https://waitlist.productif.io'}
        >
          Rejoindre la waitlist pour 1€
        </AnimatedButton>
        <p className="text-xs text-center text-gray-500 mb-6">
          1€ pour réserver ta place + accès à l'offre lifetime à prix préférentiel lors du lancement
        </p>

        <ul className="space-y-3">
          <PricingItem>Accès prioritaire lors du lancement</PricingItem>
          <PricingItem>Toutes les fonctionnalités, sans restrictions</PricingItem>
          <PricingItem>Assistant IA WhatsApp intégré</PricingItem>
          <PricingItem>Organisation automatique de tes tâches par l'IA</PricingItem>
          <PricingItem>Support prioritaire</PricingItem>
          <PricingItem>Mises à jour à vie incluses</PricingItem>
          <PricingItem>Seulement 150 places disponibles</PricingItem>
        </ul>

        <p className="text-gray-500 text-sm mt-6 text-center">
          Paiement sécurisé via Stripe. Satisfaction garantie.
        </p>
      </div>
    </section>
  )
}

function PricingItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
      <span className="text-gray-600">{children}</span>
    </li>
  )
} 