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
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold py-2 px-4 rounded-full text-center mb-6 animate-pulse">
          🔥 OFFRE LIMITÉE - 150 PLACES SEULEMENT
        </div>

        <div className="text-center mb-6 relative">
          <h3 className="text-2xl font-bold text-gray-900 mt-2">Accès Lifetime</h3>
          
          <div className="mt-4 mb-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="text-center">
                <div className="text-lg text-red-500 line-through font-medium">20€/mois</div>
                <div className="text-xs text-gray-500">Prix de lancement</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">4,95€/mois</div>
                <div className="text-xs text-green-600 font-medium">À VIE</div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800 font-medium">
                💰 <strong>Économise 75%</strong> en rejoignant la waitlist maintenant !
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Paye seulement <strong>1€ aujourd'hui</strong> et bénéficie du tarif préférentiel de <strong>4,95€/mois à vie</strong> au lieu de 20€/mois lors du lancement officiel.
              </p>
            </div>
          </div>
        </div>

        <AnimatedButton 
          className="w-full mb-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          onClick={() => window.location.href = '/waitlist'}
        >
          🚀 Réserver ma place pour 1€
        </AnimatedButton>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-green-800 font-medium text-center">
            ✅ <strong>1€ maintenant</strong> = <strong>4,95€/mois à vie</strong> garanti
          </p>
          <p className="text-xs text-green-700 text-center mt-1">
            Accès prioritaire + tarif préférentiel verrouillé
          </p>
        </div>

        <ul className="space-y-3">
          <PricingItem>Accès prioritaire lors du lancement</PricingItem>
          <PricingItem>Toutes les fonctionnalités, sans restrictions</PricingItem>
          <PricingItem>Assistant IA WhatsApp intégré</PricingItem>
          <PricingItem>Organisation automatique de tes tâches par l'IA</PricingItem>
          <PricingItem>Support prioritaire</PricingItem>
          <PricingItem>Mises à jour à vie incluses</PricingItem>
          <PricingItem>Tarif à vie verrouillé à 4,95€/mois</PricingItem>
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