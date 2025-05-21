"use client"

import React from "react"
import { CheckCircle2, Clock, BarChart3, Zap, MessageSquare, Brain } from "lucide-react"

export function FonctionnalitesFeatures() {
  return (
    <section className="container mx-auto px-4 py-20 bg-gray-50">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
        Des fonctionnalités <span className="text-green-500">conçues pour toi</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <FeatureCard 
          icon={<Brain className="w-14 h-14 text-green-500" />}
          title="Organisation intelligente"
          description="L'IA analyse tes tâches, tes habitudes et ton emploi du temps pour créer un planning optimal qui respecte tes préférences et ton rythme."
        />
        <FeatureCard 
          icon={<MessageSquare className="w-14 h-14 text-green-500" />}
          title="Assistant WhatsApp intégré"
          description="Ton assistant personnel te guide tout au long de la journée via WhatsApp, t'envoyant des rappels intelligents et des encouragements au bon moment."
        />
        <FeatureCard 
          icon={<Clock className="w-14 h-14 text-green-500" />}
          title="Gestion du temps optimisée"
          description="Suivi précis du temps passé sur chaque tâche, avec analyses pour identifier où tu es le plus productif et où tu peux optimiser."
        />
        <FeatureCard 
          icon={<BarChart3 className="w-14 h-14 text-green-500" />}
          title="Habitudes qui se maintiennent"
          description="Système de suivi et de renforcement des habitudes qui s'adapte à ta vie réelle, avec des rappels contextuels au moment opportun."
        />
        <FeatureCard 
          icon={<Zap className="w-14 h-14 text-green-500" />}
          title="Objectifs atteignables"
          description="Décomposition intelligente de tes grands objectifs en tâches actionables, avec suivi automatique de ta progression."
        />
        <FeatureCard 
          icon={<CheckCircle2 className="w-14 h-14 text-green-500" />}
          title="Tableaux de bord personnalisés"
          description="Visualisation claire de ta progression, tes habitudes et tes objectifs sans surcharge d'information."
        />
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow text-center">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
} 