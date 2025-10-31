"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Check } from "lucide-react"

export function Pricing() {
  return (
    <section className="container mx-auto px-4 py-20 bg-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Exclusive <span className="text-green-500">waitlist</span> offer
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Lock in lifetime access for less than your haircut.
        </p>
      </div>

      <div className="max-w-md mx-auto bg-white border border-green-200 rounded-xl p-8 shadow-md">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold py-2 px-4 rounded-full text-center mb-6 animate-pulse">
          🔥 LIMITED OFFER — ONLY 150 SPOTS
        </div>

        <div className="text-center mb-6 relative">
          <h3 className="text-2xl font-bold text-gray-900 mt-2">Lifetime Access</h3>
          
          <div className="mt-4 mb-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="text-center">
                <div className="text-lg text-red-500 line-through font-medium">€20/mo</div>
                <div className="text-xs text-gray-500">Launch price</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">€4.95/mo</div>
                <div className="text-xs text-green-600 font-medium">FOR LIFE</div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800 font-medium">
                💰 <strong>Save 75%</strong> by joining the waitlist now!
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Pay just <strong>€1 today</strong> and secure the preferential rate of <strong>€4.95/mo for life</strong> instead of €20/mo at the official launch.
              </p>
            </div>
          </div>
        </div>

        <AnimatedButton 
          className="w-full mb-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          onClick={() => window.location.href = '/waitlist'}
        >
          🚀 Try for free
        </AnimatedButton>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-green-800 font-medium text-center">
            ✅ <strong>€1 now</strong> = <strong>€4.95/mo for life</strong> guaranteed
          </p>
          <p className="text-xs text-green-700 text-center mt-1">
            Priority access + locked-in preferential pricing
          </p>
        </div>

        <ul className="space-y-3">
          <PricingItem>Priority access at launch</PricingItem>
          <PricingItem>All features, no restrictions</PricingItem>
          <PricingItem>Built-in WhatsApp AI assistant</PricingItem>
          <PricingItem>Automatic AI task organization</PricingItem>
          <PricingItem>Priority support</PricingItem>
          <PricingItem>Lifetime updates included</PricingItem>
          <PricingItem>Lifetime price locked at €4.95/mo</PricingItem>
        </ul>

        <p className="text-gray-500 text-sm mt-6 text-center">
          Secure payment via Stripe. Satisfaction guaranteed.
        </p>
      </div>
    </section>
  )
}

function PricingItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
      <span className="text-gray-600">{children}</span>
    </li>
  )
} 