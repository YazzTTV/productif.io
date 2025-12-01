"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function SiteHeader() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-[1400px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 mr-auto">
            <Image
              src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png"
              alt="Productif.io"
              width={48}
              height={48}
              className="object-contain"
            />
            <h1 className="text-2xl text-gray-900 whitespace-nowrap font-bold">
              Productif.io
            </h1>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/fonctionnalites" className="text-sm font-medium text-gray-700 hover:text-[#00C27A] transition-colors">
              Fonctionnalités
            </Link>
            <Link href="/tarifs" className="text-sm font-medium text-gray-700 hover:text-[#00C27A] transition-colors">
              Tarifs
            </Link>
            <Link href="/temoignages" className="text-sm font-medium text-gray-700 hover:text-[#00C27A] transition-colors">
              Témoignages
            </Link>
            <Link href="/faq" className="text-sm font-medium text-gray-700 hover:text-[#00C27A] transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="sm" className="bg-gradient-to-r from-[#00C27A] to-[#00D68F] hover:from-[#00B86A] hover:to-[#00C87F] text-white shadow-md" asChild>
                <Link href="/register?plan=premium">Devenir beta testeur</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  )
} 