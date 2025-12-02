"use client"

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Crown, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/lib/i18n'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const router = useRouter()
  const { t, locale } = useLocale()
  const isFr = locale === 'fr'

  const handleUpgrade = () => {
    onClose()
    router.push('/upgrade')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 upgrade-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
              role="dialog"
              aria-modal="true"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-[#00C27A] to-[#00D68F] p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
                  aria-label={isFr ? 'Fermer' : 'Close'}
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                    <Crown className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    {isFr ? 'Période d\'essai terminée' : 'Trial Period Ended'}
                  </h2>
                  <p className="text-white/90 text-lg">
                    {isFr 
                      ? 'Continuez votre progression avec Productif.io' 
                      : 'Continue your progress with Productif.io'}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C27A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#00C27A]" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isFr ? 'Assistant IA illimité' : 'Unlimited AI Assistant'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isFr 
                          ? 'Planification, rappels et conseils personnalisés' 
                          : 'Planning, reminders and personalized advice'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C27A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#00C27A]" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isFr ? 'Toutes les fonctionnalités' : 'All Features'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isFr 
                          ? 'Tâches, habitudes, deep work, statistiques' 
                          : 'Tasks, habits, deep work, statistics'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#00C27A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#00C27A]" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isFr ? 'Synchronisation multi-appareils' : 'Multi-device Sync'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isFr 
                          ? 'Accès web, mobile et WhatsApp' 
                          : 'Web, mobile and WhatsApp access'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing highlight */}
                <div className="bg-gradient-to-r from-[#00C27A]/10 to-[#00D68F]/10 rounded-2xl p-6 mb-6 border border-[#00C27A]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">
                      {isFr ? 'Plan Annuel' : 'Annual Plan'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">9,99€</span>
                      <span className="text-gray-600">/ {isFr ? 'mois' : 'month'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-[#00C27A]" />
                    <span className="text-[#00C27A] font-medium">
                      {isFr ? 'Économisez 60€ par an' : 'Save €60 per year'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] hover:from-[#00D68F] hover:to-[#00C27A] text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
                    data-allow-click
                  >
                    {isFr ? 'Choisir mon abonnement' : 'Choose my plan'}
                  </Button>
                  
                  <button
                    onClick={onClose}
                    className="w-full text-gray-600 hover:text-gray-900 py-3 text-sm transition-colors"
                    data-allow-click
                  >
                    {isFr ? 'Plus tard' : 'Later'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  {isFr 
                    ? 'Annulez à tout moment • Garantie satisfait ou remboursé 30 jours' 
                    : 'Cancel anytime • 30-day money-back guarantee'}
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

