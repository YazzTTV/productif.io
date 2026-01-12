"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"

interface HeaderProps {
  bg?: "transparent" | "white"
  hideAuth?: boolean
  hideCTA?: boolean
}

export function Header({ bg = "transparent", hideAuth = false, hideCTA = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={bg === "white" ? "bg-white" : "bg-transparent"}>
      <header className="container mx-auto py-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/mon-logo.png"
                alt="Productif.io Logo"
                width={160}
                height={48}
                className="object-contain"
                priority={bg === "white"}
              />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-600 hover:text-green-500 transition-colors">
              Home
            </Link>
            <Link href="/fonctionnalites" className="text-gray-600 hover:text-green-500 transition-colors">
              Features
            </Link>
            <Link href="/tarification" className="text-gray-600 hover:text-green-500 transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {!hideAuth && (
              <Link href="/login" className="text-gray-600 hover:text-green-500 transition-colors hidden md:block">
                Log in
              </Link>
            )}
            {!hideCTA && (
              <AnimatedButton 
                className="text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2"
                onClick={() => {
                  const params = new URLSearchParams()
                  const keep: string[] = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","ref"]
                  keep.forEach(k => {
                    const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null
                    if (v) params.set(k, v)
                  })
                  params.set('offer','early-access')
                  window.location.href = `/onboarding?${params.toString()}`
                }}
              >
                Start Now for Free
              </AnimatedButton>
            )}

            {/* Menu mobile */}
            <div className="relative md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center justify-center p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Menu mobile"
              >
                <Menu className={`h-5 w-5 ${mobileMenuOpen ? 'hidden' : 'block'}`} />
                <X className={`h-5 w-5 ${mobileMenuOpen ? 'block' : 'hidden'}`} />
              </button>
              
              {mobileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg py-2 w-48 z-50">
                  <Link href="/fonctionnalites" className="block px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-500 transition-colors">
                    Features
                  </Link>
                  <Link href="/tarification" className="block px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-500 transition-colors">
                    Pricing
                  </Link>
                  {!hideAuth && (
                    <Link href="/login" className="block px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-500 transition-colors">
                      Log in
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}