"use client"

import type React from "react"
import { CheckCircle2, Clock, BarChart3, Users, Zap, Shield, MessageSquare } from "lucide-react"

export function Features() {
  return (
    <section className="container mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-6">
        Un écosystème complet pour <span className="text-green-500">libérer ton esprit</span>
      </h2>
      <p className="text-gray-600 text-xl max-w-2xl mx-auto text-center mb-16">
        Productif.io n'est pas un simple outil de productivité. C'est un agent IA qui devient l'extension de ton cerveau — directement dans ta poche.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={<CheckCircle2 className="w-8 h-8 text-green-500" />}
          title="Gestion de tâches intelligente"
          description="Fini les listes interminables. L'IA organise, contextualise et priorise pour toi."
        />
        <FeatureCard
          icon={<Clock className="w-8 h-8 text-green-500" />}
          title="Suivi du temps révélateur"
          description="Découvre où va réellement ton temps et reprends le contrôle de tes journées."
        />
        <FeatureCard
          icon={<BarChart3 className="w-8 h-8 text-green-500" />}
          title="Habitudes qui tiennent"
          description="Des routines personnalisées qui s'adaptent à ta vie réelle, pas l'inverse."
        />
        <FeatureCard
          icon={<Zap className="w-8 h-8 text-green-500" />}
          title="Objectifs atteignables"
          description="Du rêve à la réalité grâce à un suivi pas-à-pas piloté par l'IA."
        />
        <FeatureCard
          icon={<MessageSquare className="w-8 h-8 text-green-500" />}
          title="Assistant WhatsApp intégré"
          description="Ton copilote mental toujours avec toi, qui te guide sans que tu aies à y penser."
        />
        <FeatureCard
          icon={<Shield className="w-8 h-8 text-green-500" />}
          title="Données 100% sécurisées"
          description="Ta vie privée est protégée. Nous existons pour t'aider, pas pour exploiter tes données."
        />
      </div>
      
      <div className="mt-16 text-center">
        <div className="inline-block bg-green-50 border border-green-100 rounded-lg px-6 py-3">
          <p className="text-green-800 font-medium">
            "Pour la première fois, je ne me réveille plus en pensant à tout ce que je dois faire. Productif.io m'envoie simplement ce qu'il faut faire, quand il faut le faire. Ma charge mentale a diminué de 80%."
          </p>
          <p className="text-green-600 text-sm mt-2">— Sabrina, Media Buyer en freelance</p>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
} 