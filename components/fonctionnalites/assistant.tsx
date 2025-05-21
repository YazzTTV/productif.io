"use client"

import Image from "next/image"

export function FonctionnalitesAssistant() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ton assistant <span className="text-green-500">WhatsApp</span> personnel
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Productif.io va au-delà des applications traditionnelles en intégrant un assistant IA directement 
            dans ton WhatsApp. Il devient ton copilote mental au quotidien.
          </p>
          
          <div className="space-y-6">
            <Feature 
              title="Rappels intelligents" 
              description="Reçois des notifications au moment idéal pour accomplir tes tâches importantes ou maintenir tes habitudes."
            />
            <Feature 
              title="Planning adaptatif" 
              description="Ton planning se réorganise automatiquement en fonction des imprévus et de ton contexte en temps réel."
            />
            <Feature 
              title="Conversations naturelles" 
              description="Interagis naturellement avec ton assistant - pose des questions, reçois des conseils ou ajoute des tâches."
            />
            <Feature 
              title="Suivi bienveillant" 
              description="Des encouragements personnalisés et un suivi de ta progression sans jugement."
            />
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-green-100 rounded-full opacity-50"></div>
          <div className="border border-gray-200 rounded-3xl overflow-hidden shadow-lg relative z-10 bg-white py-8 px-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Assistant Productif.io</h3>
                <p className="text-xs text-gray-500">En ligne</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-4">
              <ChatMessage sender="assistant" content="Bonjour ! Voici ta journée organisée. Tu as une réunion importante à 14h et il serait idéal de finaliser le rapport avant." />
              <ChatMessage sender="user" content="Merci ! Je vais m'y mettre. Quelle est ma priorité après le rapport ?" />
              <ChatMessage sender="assistant" content="Après le rapport, tu devrais te concentrer sur le projet Alpha, car c'est aligné avec ton objectif trimestriel qui approche de sa date limite." />
              <ChatMessage sender="assistant" content="Je te rappelle aussi que tu as prévu de méditer aujourd'hui. Le meilleur moment serait après ta réunion pour décompresser." />
              <ChatMessage sender="user" content="Parfait, ajoute ça à mon planning !" />
              <ChatMessage sender="assistant" content="C'est fait ! Je t'enverrai un rappel 10 minutes avant." />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function ChatMessage({ sender, content }: { sender: 'assistant' | 'user'; content: string }) {
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl px-4 py-2 ${
        sender === 'user' 
          ? 'bg-green-500 text-white rounded-tr-none' 
          : 'bg-gray-100 text-gray-800 rounded-tl-none'
      }`}>
        <p>{content}</p>
      </div>
    </div>
  )
} 