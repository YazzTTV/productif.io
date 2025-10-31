"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export function FonctionnalitesCTA() {
  const handleStartPayment = (billing: 'monthly' | 'yearly') => {
    const params = new URLSearchParams()
    params.set('offer', 'early-access')
    params.set('billing', billing)
    window.location.href = `/onboarding?${params.toString()}`
  }

  return (
    <section className="container mx-auto px-4 py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Ready to <span className="text-green-500">revolutionize</span> your productivity?
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
          Choose your plan and start your 7-day free trial today.
        </p>
        
        <div className="mx-auto w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-gray-600">Monthly</div>
            <div className="mt-1 text-4xl font-bold tracking-tight">€14.99<span className="text-base font-medium">/mo</span></div>
            <div className="text-xs text-muted-foreground">Billed monthly</div>
            <ul className="space-y-4 my-6">
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-gray-900">AI-powered task management</strong> — No more endless to‑do lists. Your AI organizes, prioritizes, and suggests what to tackle next based on your real priorities.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-gray-900">WhatsApp AI assistant</strong> — Your personal co‑pilot sends you smart reminders, encouragement, and guidance throughout your day. No need to open another app.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-gray-900">Habits & goals that actually stick</strong> — Build routines that adapt to your real life with contextual reminders. Track progress on OKRs and see real results.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-gray-900">Complete privacy & lifetime access</strong> — Your data stays yours. End‑to‑end encryption, automatic backups, and all future updates included forever.</span>
              </li>
            </ul>
            <Button onClick={() => handleStartPayment('monthly')} className="w-full bg-green-500 hover:bg-green-600 h-11 text-[15px]">Start Now for Free</Button>
          </div>

          {/* Yearly */}
          <div className="relative rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-green-200 hover:shadow-md transition-shadow">
            <div className="absolute right-4 top-4 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Most popular</div>
            <div className="text-sm font-medium text-gray-600">Yearly</div>
            <div className="mt-1 text-4xl font-bold tracking-tight">€9.99<span className="text-base font-medium">/mo</span><span className="ml-2 text-xs inline-block rounded bg-green-100 text-green-700 px-2 py-0.5">save €60</span></div>
            <div className="text-xs text-muted-foreground">Billed yearly</div>
            <ul className="space-y-4 my-6">
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-gray-900">AI-powered task management</strong> — No more endless to‑do lists. Your AI organizes, prioritizes, and suggests what to tackle next based on your real priorities.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-gray-900">WhatsApp AI assistant</strong> — Your personal co‑pilot sends you smart reminders, encouragement, and guidance throughout your day. No need to open another app.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-gray-900">Habits & goals that actually stick</strong> — Build routines that adapt to your real life with contextual reminders. Track progress on OKRs and see real results.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-gray-900">Complete privacy & lifetime access</strong> — Your data stays yours. End‑to‑end encryption, automatic backups, and all future updates included forever.</span>
              </li>
            </ul>
            <Button onClick={() => handleStartPayment('yearly')} className="w-full bg-green-500 hover:bg-green-600 h-11 text-[15px]">Start Now for Free</Button>
          </div>
        </div>
      </div>
    </section>
  )
} 