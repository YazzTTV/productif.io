"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

export function Comparison() {
  return (
    <section className="container mx-auto px-4 py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
          Have you ever felt this <span className="text-green-500">mental overload</span>?
        </h2>
        <p className="text-gray-600 text-lg text-center mb-4">
          That moment when you close your eyes and visualize all the unfinished tasks. The habits you wanted to keep. The goals you keep postponing.
        </p>
        <p className="text-gray-800 text-lg text-center font-medium">
          It isn’t a lack of organization. It’s cognitive overload.
        </p>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
        If you want to free your mind, <span className="text-green-500">don’t use yesterday’s tools</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-yellow-500">😔</span> Without Productif.io
          </h3>

          <ul className="space-y-4">
            <ComparisonItem isNegative>
              Juggling 5+ apps to manage tasks, habits, and goals
            </ComparisonItem>
            <ComparisonItem isNegative>
              Daily anxiety from an ever-growing to-do list
            </ComparisonItem>
            <ComparisonItem isNegative>
              Forgetting important habits because… life happens
            </ComparisonItem>
            <ComparisonItem isNegative>
              Wasting time deciding what to do next
            </ComparisonItem>
            <ComparisonItem isNegative>
              Watching life goals fade behind everyday urgencies
            </ComparisonItem>
          </ul>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-green-500">😊</span> With Productif.io
          </h3>

          <ul className="space-y-4">
            <ComparisonItem>
              A single ecosystem that centralizes all your organization
            </ComparisonItem>
            <ComparisonItem>
              Get exactly what to do, at the moment you should do it
            </ComparisonItem>
            <ComparisonItem>
              Be subtly guided through your daily routines
            </ComparisonItem>
            <ComparisonItem>
              Follow a clear, AI-optimized path for your real priorities
            </ComparisonItem>
            <ComparisonItem>
              Keep progressing toward your important goals, even on busy days
            </ComparisonItem>
          </ul>
        </div>
      </div>
      <div className="mt-10 text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const params = new URLSearchParams()
            const keep: string[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]
            keep.forEach(k => {
              const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null
              if (v) params.set(k, v)
            })
            params.set('offer', 'early-access')
            window.location.href = `/onboarding/welcome?${params.toString()}`
          }}
          className="px-8 py-4 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-full shadow-xl text-lg"
        >
          Start Now for Free
        </motion.button>
      </div>
    </section>
  )
}

function ComparisonItem({ children, isNegative = false }: { children: React.ReactNode; isNegative?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      {isNegative ? (
        <X className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      ) : (
        <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
      )}
      <span className="text-gray-600">{children}</span>
    </li>
  )
} 