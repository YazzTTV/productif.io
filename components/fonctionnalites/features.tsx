"use client"

import React from "react"
import { CheckCircle2, Clock, BarChart3, Zap, MessageSquare, Brain } from "lucide-react"

export function FonctionnalitesFeatures() {
  return (
    <section className="container mx-auto px-4 py-20 bg-gray-50">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
        Features <span className="text-green-500">designed for you</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <FeatureCard 
          icon={<Brain className="w-14 h-14 text-green-500" />}
          title="Intelligent organization"
          description="AI analyzes your tasks, habits, and schedule to create an optimal plan that respects your preferences and rhythm."
        />
        <FeatureCard 
          icon={<MessageSquare className="w-14 h-14 text-green-500" />}
          title="Built-in WhatsApp assistant"
          description="Your personal assistant guides you throughout the day via WhatsApp, sending smart reminders and encouragement at the right time."
        />
        <FeatureCard 
          icon={<Clock className="w-14 h-14 text-green-500" />}
          title="Optimized time management"
          description="Accurate tracking of time spent on each task, with insights to identify where you’re most productive and where to optimize."
        />
        <FeatureCard 
          icon={<BarChart3 className="w-14 h-14 text-green-500" />}
          title="Habits that stick"
          description="A habit tracking and reinforcement system that adapts to your real life, with contextual reminders at the right moment."
        />
        <FeatureCard 
          icon={<Zap className="w-14 h-14 text-green-500" />}
          title="Achievable goals"
          description="Smart breakdown of your big goals into actionable tasks, with automatic progress tracking."
        />
        <FeatureCard 
          icon={<CheckCircle2 className="w-14 h-14 text-green-500" />}
          title="Personalized dashboards"
          description="Clear visualization of your progress, habits, and goals without information overload."
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