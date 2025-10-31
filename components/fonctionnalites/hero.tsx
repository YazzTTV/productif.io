"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

export function FonctionnalitesHero() {
  return (
    <section className="container mx-auto px-4 py-20 text-center relative">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
        An AI-powered <span className="text-green-500">personal assistant</span>
      </h1>
      <div className="w-full max-w-2xl mx-auto h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent my-6"></div>
      <p className="text-gray-600 text-xl max-w-2xl mx-auto mb-12">
        Discover how Productif.io transforms the way you manage your time, tasks, and habits
        with artificial intelligence.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto mb-20">
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md">
          <Image
            src="/dashboard-productif.jpg"
            alt="Productif.io dashboard"
            width={600}
            height={400}
            className="w-full h-auto"
          />
          <p className="text-xs text-gray-500 p-2 bg-gray-50">Productif.io smart dashboard</p>
        </div>
        <div className="text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            A complete view of your productivity
          </h2>
          <p className="text-gray-600 mb-6">
            Productif.io gives you a smart dashboard that centralizes all your tasks, habits, and goals,
            providing a clear view of your day without cognitive overload.
          </p>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => window.location.href = '/waitlist'}
          >
            Try for free
          </Button>
        </div>
      </div>
    </section>
  )
} 