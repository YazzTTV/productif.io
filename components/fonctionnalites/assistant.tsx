"use client"

import Image from "next/image"

export function FonctionnalitesAssistant() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Your personal <span className="text-green-500">WhatsApp</span> assistant
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Productif.io goes beyond traditional apps by integrating an AI assistant directly into your WhatsApp.
            It becomes your daily mental co‑pilot.
          </p>
          
          <div className="space-y-6">
            <Feature 
              title="Smart reminders" 
              description="Receive notifications at the ideal moment to complete important tasks or maintain your habits."
            />
            <Feature 
              title="Adaptive planning" 
              description="Your schedule reorganizes automatically based on unexpected events and your real-time context."
            />
            <Feature 
              title="Natural conversations" 
              description="Interact naturally with your assistant — ask questions, get advice, or add tasks."
            />
            <Feature 
              title="Supportive follow‑up" 
              description="Personalized encouragement and progress tracking without judgment."
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
              <ChatMessage sender="assistant" content="Good morning! Here’s your organized day. You have an important meeting at 2 PM — it would be ideal to finalize the report beforehand." />
              <ChatMessage sender="user" content="Thanks! I’ll get on it. What’s my priority after the report?" />
              <ChatMessage sender="assistant" content="After the report, you should focus on Project Alpha — it aligns with your quarterly objective approaching its deadline." />
              <ChatMessage sender="assistant" content="Reminder: you planned to meditate today. The best moment would be after your meeting to decompress." />
              <ChatMessage sender="user" content="Perfect, add that to my schedule!" />
              <ChatMessage sender="assistant" content="Done! I’ll send you a reminder 10 minutes before." />
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