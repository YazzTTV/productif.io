"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Header } from "@/components/header"

export const dynamic = 'force-dynamic'

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")

  // Get auth email if logged-in (same behavior as onboarding)
  useEffect(() => {
    let cancelled = false
    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setEmail(data.user?.email || "")
        }
      } catch {}
    }
    fetchAuth()
    return () => { cancelled = true }
  }, [])

  const handleStartPayment = (billing: 'monthly' | 'yearly') => {
    const params = new URLSearchParams()
    params.set('offer', 'early-access')
    params.set('billing', billing)
    window.location.href = `/onboarding?${params.toString()}`
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Header bg="white" />

      <Card className="w-full max-w-5xl mx-auto mt-8 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mon-logo.png" alt="Productif.io" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-center text-2xl md:text-3xl">Choose your plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}

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
              <Button onClick={() => handleStartPayment('monthly')} className="w-full bg-green-500 hover:bg-green-600 h-11 text-[15px]" disabled={loading}>{loading ? 'Redirecting…' : 'Try it for free'}</Button>
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
              <Button onClick={() => handleStartPayment('yearly')} className="w-full bg-green-500 hover:bg-green-600 h-11 text-[15px]" disabled={loading}>{loading ? 'Redirecting…' : 'Try it for free'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

//