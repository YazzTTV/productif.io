"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useLocale } from '@/lib/i18n'

// Fonction pour générer une valeur pseudo-aléatoire déterministe basée sur un seed
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function WelcomePage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const { t } = useLocale()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 relative overflow-hidden">
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
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center relative z-10 max-w-2xl w-full"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="w-40 h-40 bg-white rounded-[40px] flex items-center justify-center shadow-2xl p-6">
            <motion.img
              src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png"
              alt="Productif.io Logo"
              className="w-full h-full object-contain"
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
        
        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center text-gray-900 mb-8 text-6xl drop-shadow-sm leading-tight font-bold"
        >
          {t('onboardingWelcomeTitle') || 'Productif.io'}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-gray-700 mb-16 text-2xl leading-relaxed max-w-xl mx-auto"
        >
          {t('onboardingWelcomeSubtitle') || 'Master your focus. Measure your growth.'}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="w-full max-w-md space-y-4"
        >
          <motion.button
            onClick={() => router.push('/onboarding/language')}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0, 194, 122, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-6 rounded-3xl transition-all duration-300 shadow-2xl relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <span className="relative z-10 text-xl font-semibold">
              {t('onboardingGetStarted') || 'Get Started'}
            </span>
          </motion.button>
          
          <motion.button
            onClick={() => router.push('/login')}
            whileHover={{ scale: 1.02, boxShadow: "0 5px 20px rgba(0, 214, 143, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 py-6 rounded-3xl transition-all duration-300 shadow-lg hover:border-[#00C27A]"
          >
            <span className="text-xl font-semibold">
              {t('onboardingLogin') || 'Log in'}
            </span>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}

