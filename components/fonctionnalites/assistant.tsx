"use client"

import Image from "next/image"

export function FonctionnalitesAssistant() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Votre assistant personnel <span className="text-green-500">WhatsApp</span>
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Productif.io va au-delà des applications traditionnelles en intégrant un assistant IA directement dans votre WhatsApp.
            Il devient votre co-pilote mental quotidien.
          </p>
          
          <div className="space-y-6">
            <Feature
              title="Rappels intelligents"
              description="Recevez des notifications au moment idéal pour accomplir les tâches importantes ou maintenir vos habitudes."
            />
            <Feature
              title="Planification adaptative"
              description="Votre emploi du temps se réorganise automatiquement en fonction des événements imprévus et de votre contexte en temps réel."
            />
            <Feature
              title="Conversations naturelles"
              description="Interagissez naturellement avec votre assistant — posez des questions, demandez des conseils, ou ajoutez des tâches."
            />
            <Feature
              title="Suivi bienveillant"
              description="Encouragement personnalisé et suivi des progrès sans jugement."
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
              <ChatMessage sender="assistant" content="Bonjour ! Voici votre journée organisée. Vous avez une réunion importante à 14h — il serait idéal de finaliser le rapport avant." />
              <ChatMessage sender="user" content="Merci ! Je m'y mets. Quelle est ma priorité après le rapport ?" />
              <ChatMessage sender="assistant" content="Après le rapport, vous devriez vous concentrer sur le Projet Alpha — il s'aligne avec votre objectif trimestriel qui approche de l'échéance." />
              <ChatMessage sender="assistant" content="Rappel : vous aviez prévu de méditer aujourd'hui. Le meilleur moment serait après votre réunion pour vous détendre." />
              <ChatMessage sender="user" content="Parfait, ajoute ça à mon planning !" />
              <ChatMessage sender="assistant" content="C'est fait ! Je vous enverrai un rappel 10 minutes avant." />
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