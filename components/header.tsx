"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, Download } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

interface HeaderProps {
  bg?: "transparent" | "white"
  hideAuth?: boolean
  hideCTA?: boolean
}

export function Header({ bg = "transparent", hideAuth = false, hideCTA = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleCTAClick = () => {
    const params = new URLSearchParams();
    const keep: string[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"];
    keep.forEach(k => {
      const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null;
      if (v) params.set(k, v);
    });
    params.set('offer', 'early-access');
    router.push(`/onboarding/welcome?${params.toString()}`);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <Image
                src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png"
                alt="Productif.io Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
            <span className="text-xl text-gray-900 hidden sm:block">Productif.io</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
              Reviews
            </a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {!hideAuth && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:block px-6 py-2.5 text-gray-700 hover:text-gray-900 transition-colors"
                onClick={() => router.push('/login')}
              >
                Sign In
              </motion.button>
            )}
            {!hideCTA && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCTAClick}
                className="px-6 py-2.5 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-full shadow-lg flex items-center gap-2"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Download Free</span>
                <span className="sm:hidden">Start</span>
              </motion.button>
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg py-2 w-48 z-50"
                >
                  <a href="#features" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    Features
                  </a>
                  <a href="#testimonials" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    Reviews
                  </a>
                  <a href="#faq" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    FAQ
                  </a>
                  {!hideAuth && (
                    <button
                      onClick={() => {
                        router.push('/login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      Sign In
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}