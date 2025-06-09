"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
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
          />
        </Link>
      </div>
      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
          Accueil
        </Link>
        <Link href="/fonctionnalites" className="text-gray-600 hover:text-gray-900 transition-colors">
          Fonctionnalités
        </Link>
        <Link href="/tarification" className="text-gray-600 hover:text-gray-900 transition-colors">
          Tarification
        </Link>
      </nav>
        <div className="flex items-center gap-2">
        <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors hidden md:block">
          Connexion
        </Link>
          
        <AnimatedButton 
            className="text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2"
          onClick={() => window.location.href = '/waitlist'}
        >
          Rejoindre la waitlist
        </AnimatedButton>

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
                  Fonctionnalités
                </Link>
                <Link href="/tarification" className="block px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-500 transition-colors">
                  Tarification
                </Link>
                <Link href="/login" className="block px-4 py-2 text-gray-600 hover:bg-green-50 hover:text-green-500 transition-colors">
                  Connexion
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 