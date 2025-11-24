"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useLocale } from '@/lib/i18n'

// Fonction pour générer une valeur pseudo-aléatoire déterministe basée sur un seed
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function IntroScreen() {
  const router = useRouter()
  const { t } = useLocale()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center py-12 px-8">
      {/* Animated Background Particles */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(25)].map((_, i) => {
            const left = seededRandom(i) * 100
            const top = seededRandom(i + 1000) * 100
            const duration = 4 + seededRandom(i + 2000) * 2
            const delay = seededRandom(i + 3000) * 2
            
            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-[#00C27A]/20 rounded-full"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  delay,
                }}
              />
            )
          })}
        </div>
      )}

      {/* Centered Content Container */}
      <div className="max-w-2xl w-full relative z-10">
        <div className="flex flex-col items-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex justify-center mb-12"
          >
            <div className="w-40 h-40 bg-white rounded-[40px] flex items-center justify-center shadow-2xl p-6">
              <Image
                src="/logo.png"
                alt="Productif.io"
                width={160}
                height={160}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-12"
          >
            <h1 className="text-gray-900 mb-8 text-6xl drop-shadow-sm leading-tight font-bold">
              {t('introTitle') || "Ready to Transform Your Productivity?"}
            </h1>
            <p className="text-gray-700 text-2xl leading-relaxed max-w-xl mx-auto">
              Struggling with focus, procrastination, and scattered habits? Let's fix that together.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            onClick={() => router.push('/onboarding/language')}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0, 194, 122, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full max-w-md bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-6 rounded-3xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <span className="relative text-2xl font-semibold">{t('letsGo') || "Let's Go"}</span>
            <ArrowRight className="relative" size={28} />
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="text-center text-lg text-gray-600 mt-8"
          >
            Takes less than 2 minutes
          </motion.p>
        </div>
      </div>
    </div>
  )
}

