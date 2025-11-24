"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Sparkles, Check, Zap } from 'lucide-react'

// Fonction pour générer une valeur pseudo-aléatoire déterministe basée sur un seed
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

interface ProfileRevealScreenProps {
  profileType?: string
  profileEmoji?: string
  description?: string
}

export function ProfileRevealScreen({
  profileType = "The Strategic Achiever",
  profileEmoji = "🎯",
  description = "You thrive on structure and clear objectives. Your analytical mindset helps you break down complex goals into actionable steps."
}: ProfileRevealScreenProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-white px-6 py-12 flex flex-col">
      {/* Confetti Effect */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => {
            const left = seededRandom(i) * 100
            const duration = 2 + seededRandom(i + 1000) * 2
            const delay = seededRandom(i + 2000) * 0.5
            const emojiIndex = Math.floor(seededRandom(i + 3000) * 5)
            const emojis = ['🎉', '✨', '🚀', '💚', '⭐']
            
            return (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${left}%`,
                  top: `-10%`,
                }}
                animate={{
                  y: ['0vh', '100vh'],
                  rotate: [0, 360],
                  opacity: [1, 0],
                }}
                transition={{
                  duration,
                  delay,
                  ease: 'linear',
                }}
              >
                {emojis[emojiIndex]}
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center relative z-10 max-w-4xl mx-auto w-full px-8">
        {/* Success Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="w-28 h-28 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center text-white shadow-2xl">
            <span className="text-6xl">✓</span>
          </div>
        </motion.div>

        {/* Profile Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <p className="text-[#00C27A] text-xl mb-3 font-semibold">Your productivity profile</p>
          <h1 className="text-gray-900 text-5xl mb-2 flex items-center justify-center gap-3 font-bold">
            <span>{profileType}</span>
            <span className="text-5xl">{profileEmoji}</span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg mb-8 border border-gray-200"
        >
          <p className="text-gray-700 leading-relaxed text-center text-xl">
            {description}
          </p>
        </motion.div>

        {/* Transformation Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-green-50 rounded-2xl p-6 text-center border-2 border-green-200 shadow-md">
            <p className="text-green-600 text-3xl mb-2 font-bold">+87%</p>
            <p className="text-gray-600 text-lg">Focus</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-6 text-center border-2 border-blue-200 shadow-md">
            <p className="text-blue-600 text-3xl mb-2 font-bold">3.2x</p>
            <p className="text-gray-600 text-lg">Tasks</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-6 text-center border-2 border-purple-200 shadow-md">
            <p className="text-purple-600 text-3xl mb-2 font-bold">-64%</p>
            <p className="text-gray-600 text-lg">Stress</p>
          </div>
        </motion.div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-8"
        >
          <h3 className="text-gray-900 text-2xl mb-6 text-center font-bold">Choose your plan</h3>
          
          {/* Annual Plan - Highlighted */}
          <motion.button
            onClick={() => setSelectedPlan('annual')}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full p-7 rounded-3xl border-2 mb-4 transition-all relative ${
              selectedPlan === 'annual'
                ? 'border-[#00C27A] bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/5 shadow-xl'
                : 'border-[#00C27A] bg-gradient-to-br from-[#00C27A]/10 to-[#00D68F]/5 shadow-xl'
            }`}
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#00C27A]/20 to-[#00D68F]/20 blur-xl -z-10" />
            
            {/* Best Value Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white text-lg px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
              <span>⭐</span>
              <span>Best Value</span>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-left">
                <p className="text-gray-900 text-xl mb-2 font-semibold">Annual Plan</p>
                <div className="flex items-center gap-2">
                  <span className="text-base text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">💰 Save $60/year</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-gray-900 text-3xl font-bold">$9.99</p>
                  <p className="text-base text-gray-500">per month</p>
                  <p className="text-sm text-gray-400">billed annually</p>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'annual'
                    ? 'border-[#00C27A] bg-[#00C27A]'
                    : 'border-gray-300'
                }`}>
                  {selectedPlan === 'annual' && (
                    <Check size={20} className="text-white" />
                  )}
                </div>
              </div>
            </div>
          </motion.button>

          {/* Monthly Plan */}
          <motion.button
            onClick={() => setSelectedPlan('monthly')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full p-6 rounded-3xl border-2 transition-all ${
              selectedPlan === 'monthly'
                ? 'border-[#00C27A] bg-[#00C27A]/5 shadow-lg'
                : 'border-gray-200 bg-white shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-gray-900 text-xl font-semibold">Monthly Plan</p>
                <p className="text-base text-gray-500">Flexible billing</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-gray-900 text-3xl font-bold">$14.99</p>
                  <p className="text-base text-gray-500">per month</p>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === 'monthly'
                    ? 'border-[#00C27A] bg-[#00C27A]'
                    : 'border-gray-300'
                }`}>
                  {selectedPlan === 'monthly' && (
                    <Check size={20} className="text-white" />
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Trial Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-gradient-to-br from-[#00C27A]/10 to-white rounded-3xl p-6 border-2 border-[#00C27A]/30 mb-8 shadow-md"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap size={24} className="text-[#00C27A]" />
            <p className="text-gray-900 text-xl font-semibold">7-Day Free Trial</p>
          </div>
          <div className="flex items-center justify-center gap-6 text-lg text-gray-600">
            <span className="flex items-center gap-2">
              <span className="text-[#00C27A]">✓</span> 50K+ users
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[#00C27A]">✓</span> Cancel anytime
            </span>
          </div>
        </motion.div>
      </div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="space-y-3 mt-6"
      >
        <motion.button
          onClick={() => router.push('/dashboard')}
          whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0, 194, 122, 0.4)" }}
          whileTap={{ scale: 0.98 }}
          animate={{ 
            boxShadow: [
              "0 10px 30px rgba(0, 194, 122, 0.3)",
              "0 15px 40px rgba(0, 194, 122, 0.4)",
              "0 10px 30px rgba(0, 194, 122, 0.3)"
            ]
          }}
          transition={{ 
            boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-5 rounded-2xl transition-all shadow-lg relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative text-lg flex items-center justify-center gap-2 font-semibold">
            <Zap size={20} />
            Start My Free Trial
          </span>
        </motion.button>

        <motion.button
          onClick={() => router.push('/dashboard')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full text-gray-600 py-3 rounded-2xl hover:text-gray-800 transition-all"
        >
          Skip
        </motion.button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center text-xs text-gray-400 mt-3"
      >
        By continuing, you agree to our Terms & Privacy Policy
      </motion.p>
    </div>
  )
}

