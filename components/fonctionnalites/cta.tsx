"use client"

import { Button } from "@/components/ui/button"

export function FonctionnalitesCTA() {
  return (
    <section className="container mx-auto px-4 py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Prêt à <span className="text-green-500">révolutionner</span> ta productivité ?
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
          Rejoins notre waitlist exclusive et sécurise ton accès à vie à un tarif préférentiel lors du lancement.
          Seulement 150 places disponibles !
        </p>
        
        <div className="bg-white border border-green-200 rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Offre spéciale waitlist</h3>
          <div className="mb-6">
            <div className="inline-block bg-green-50 text-green-800 text-sm font-medium px-4 py-1 rounded-full mb-2">
              Accès prioritaire
            </div>
            <p className="text-gray-600">
              Investis seulement 1€ aujourd'hui pour rejoindre la waitlist et bénéficier d'un 
              tarif privilégié à vie lors du lancement.
            </p>
          </div>
          
          <ul className="text-left mb-6 space-y-2">
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">Accès anticipé à la plateforme</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">Offre à vie à tarif préférentiel</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">Toutes les fonctionnalités premium</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">Support prioritaire</span>
            </li>
          </ul>
          
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-white text-lg py-6 h-auto"
            onClick={() => {
              const params = new URLSearchParams()
              const keep: string[] = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","ref"]
              keep.forEach(k => {
                const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null
                if (v) params.set(k, v)
              })
              params.set('offer','early-access')
              window.location.href = `/onboarding?${params.toString()}`
            }}
          >
            Rejoindre la waitlist pour 1€
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            Paiement sécurisé. Satisfaction garantie ou remboursement.
          </p>
        </div>
      </div>
    </section>
  )
} 