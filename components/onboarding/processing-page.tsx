"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { useLocale } from '@/lib/i18n'

// Fonction pour générer une valeur pseudo-aléatoire déterministe basée sur un seed
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

interface ProcessingPageProps {
  onComplete?: () => void
  redirectTo?: string
}

export function ProcessingPage({ onComplete, redirectTo = '/onboarding/profile-reveal' }: ProcessingPageProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const isFr = locale === 'fr'
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete()
      } else {
        router.push(redirectTo)
      }
    }, 3500)

    return () => clearTimeout(timer)
  }, [onComplete, redirectTo, router])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 relative">
      {/* Animated Background Particles */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => {
            const left = seededRandom(i) * 100
            const top = seededRandom(i + 1000) * 100
            const duration = 3 + seededRandom(i + 2000) * 2
            const delay = seededRandom(i + 3000) * 2
            
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-[#00C27A]/20 rounded-full"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.5, 0.2],
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
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        {/* Animated Circle */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 352" }}
              animate={{ strokeDasharray: "352 352" }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C27A" />
                <stop offset="100%" stopColor="#00D68F" />
              </linearGradient>
            </defs>
          </svg>
          
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={32} className="text-[#00C27A]" />
          </motion.div>
        </div>

        <h2 className="text-gray-800 mb-3 text-2xl font-semibold">
          {isFr 
            ? "Analyse de votre profil de productivité..." 
            : "Analyzing your productivity profile..."}
        </h2>
        <p className="text-gray-600 mb-8 text-lg">
          {isFr
            ? "Notre IA découvre vos forces et vos faiblesses"
            : "Our AI is discovering your strengths and weaknesses"}
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[#00C27A] text-lg font-medium"
        >
          {isFr 
            ? "Traitement en cours..." 
            : "Processing..."}
        </motion.div>
      </motion.div>
    </div>
  )
}

