"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, BarChart3, Users, Zap, Shield, MessageSquare } from "lucide-react"

export function Features() {
  return (
    <section className="container mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-6">
        A complete ecosystem to <span className="text-green-500">free your mind</span>
      </h2>
      <p className="text-gray-600 text-xl max-w-2xl mx-auto text-center mb-16">
        Productif.io isn’t just another productivity tool. It’s an AI agent that becomes an extension of your brain — right in your pocket.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={<CheckCircle2 className="w-8 h-8 text-green-500" />}
          title="Smart task management"
          description="No more endless lists. AI organizes, contextualizes, and prioritizes for you."
        />
        <FeatureCard
          icon={<Clock className="w-8 h-8 text-green-500" />}
          title="Insightful time tracking"
          description="See where your time really goes and take back control of your days."
        />
        <FeatureCard
          icon={<BarChart3 className="w-8 h-8 text-green-500" />}
          title="Habits that stick"
          description="Personalized routines that adapt to your real life — not the other way around."
        />
        <FeatureCard
          icon={<Zap className="w-8 h-8 text-green-500" />}
          title="Achievable goals"
          description="From dream to done with step-by-step AI-guided tracking."
        />
        <FeatureCard
          icon={<MessageSquare className="w-8 h-8 text-green-500" />}
          title="Built-in WhatsApp assistant"
          description="Your mental co-pilot, always with you — guiding you without the mental load."
        />
        <FeatureCard
          icon={<Shield className="w-8 h-8 text-green-500" />}
          title="100% secure data"
          description="Your privacy is protected. We exist to help you, not to exploit your data."
        />
      </div>
      
      <div className="mt-16 text-center">
        <div className="inline-block bg-green-50 border border-green-100 rounded-lg px-6 py-3">
          <p className="text-green-800 font-medium">
            "For the first time, I don’t wake up thinking about everything I need to do. Productif.io simply sends me what to do, when to do it. My mental load dropped by 80%."
          </p>
          <p className="text-green-600 text-sm mt-2">— Sabrina, Freelance Media Buyer</p>
        </div>
        <div className="mt-8">
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3"
            onClick={() => {
              const params = new URLSearchParams()
              params.set('offer','early-access')
              params.set('billing','monthly')
              window.location.href = `/onboarding?${params.toString()}`
            }}
          >
            Start Now for Free
          </Button>
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