"use client"

import type React from "react"
import { Check, X } from "lucide-react"

export function Comparison() {
  return (
    <section className="container mx-auto px-4 py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
          As-tu déjà ressenti cette <span className="text-green-500">surcharge mentale</span>?
        </h2>
        <p className="text-gray-600 text-lg text-center mb-4">
          Ce moment où tu fermes les yeux et visualises toutes ces tâches en suspens. Ces habitudes que tu voulais maintenir. Ces objectifs que tu repousses.
        </p>
        <p className="text-gray-800 text-lg text-center font-medium">
          Ce n'est pas un manque d'organisation. C'est une surcharge cognitive.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
        Si tu veux libérer ton esprit, <span className="text-green-500">n'utilise pas les outils d'hier</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-yellow-500">😔</span> Sans Productif.io
          </h3>

          <ul className="space-y-4">
            <ComparisonItem isNegative>
              Jongler entre 5+ apps pour gérer tâches, habitudes et objectifs
            </ComparisonItem>
            <ComparisonItem isNegative>
              Subir l'angoisse quotidienne de la todo list qui s'allonge
            </ComparisonItem>
            <ComparisonItem isNegative>
              Oublier les habitudes importantes parce que... la vie
            </ComparisonItem>
            <ComparisonItem isNegative>
              Perdre du temps à décider quoi faire ensuite
            </ComparisonItem>
            <ComparisonItem isNegative>
              Voir tes objectifs de vie s'effacer derrière l'urgence du quotidien
            </ComparisonItem>
          </ul>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-green-500">😊</span> Avec Productif.io
          </h3>

          <ul className="space-y-4">
            <ComparisonItem>
              Un seul écosystème qui centralise toute ton organisation
            </ComparisonItem>
            <ComparisonItem>
              Recevoir juste ce qu'il faut faire, au moment où il faut le faire
            </ComparisonItem>
            <ComparisonItem>
              Être subtilement guidé dans tes routines quotidiennes
            </ComparisonItem>
            <ComparisonItem>
              Suivre un chemin clair optimisé par l'IA pour tes vraies priorités
            </ComparisonItem>
            <ComparisonItem>
              Progresser constamment vers tes objectifs importants, même les jours chargés
            </ComparisonItem>
          </ul>
        </div>
      </div>
    </section>
  )
}

function ComparisonItem({ children, isNegative = false }: { children: React.ReactNode; isNegative?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      {isNegative ? (
        <X className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      ) : (
        <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
      )}
      <span className="text-gray-600">{children}</span>
    </li>
  )
} 