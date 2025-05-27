"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

export function FonctionnalitesHero() {
  return (
    <section className="container mx-auto px-4 py-20 text-center relative">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
        Un assistant personnel <span className="text-green-500">alimenté par l'IA</span>
      </h1>
      <div className="w-full max-w-2xl mx-auto h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent my-6"></div>
      <p className="text-gray-600 text-xl max-w-2xl mx-auto mb-12">
        Découvre comment Productif.io transforme ta façon de gérer ton temps, tes tâches et tes habitudes
        grâce à l'intelligence artificielle.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto mb-20">
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md">
          <Image
            src="/dashboard-productif.jpg"
            alt="Tableau de bord Productif.io"
            width={600}
            height={400}
            className="w-full h-auto"
          />
          <p className="text-xs text-gray-500 p-2 bg-gray-50">Tableau de bord intelligent de Productif.io</p>
        </div>
        <div className="text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Une vision complète de ta productivité
          </h2>
          <p className="text-gray-600 mb-6">
            Productif.io t'offre un tableau de bord intelligent qui centralise toutes tes tâches, 
            habitudes et objectifs, te donnant une vision claire de ta journée sans surcharge cognitive.
          </p>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => window.location.href = 'https://waitlist.productif.io'}
          >
            Rejoindre la waitlist pour 1€
          </Button>
        </div>
      </div>
    </section>
  )
} 