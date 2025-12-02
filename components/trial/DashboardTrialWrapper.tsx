"use client"

import { useEffect, useState, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { UpgradeModal } from './UpgradeModal'

interface DashboardTrialWrapperProps {
  children: ReactNode
}

export function DashboardTrialWrapper({ children }: DashboardTrialWrapperProps) {
  const [trialStatus, setTrialStatus] = useState<'loading' | 'trial_active' | 'trial_expired' | 'subscribed'>('loading')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const response = await fetch('/api/user/trial-status', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setTrialStatus(data.status)
          
          console.log('[TRIAL] Statut:', data.status, 'hasAccess:', data.hasAccess)
        }
      } catch (error) {
        console.error('[TRIAL] Erreur vérification statut:', error)
      }
    }

    checkTrialStatus()
  }, [pathname])

  // Intercepter les clics quand le trial est expiré
  useEffect(() => {
    if (trialStatus !== 'trial_expired') return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Autoriser les clics sur les paramètres et la modal d'upgrade
      if (
        pathname.startsWith('/dashboard/settings') ||
        target.closest('[data-allow-click]') ||
        target.closest('[role="dialog"]')
      ) {
        return
      }

      // Vérifier si c'est un lien ou bouton cliquable
      const clickableElement = target.closest('a, button, [role="button"]')
      if (clickableElement && !clickableElement.hasAttribute('data-allow-click')) {
        e.preventDefault()
        e.stopPropagation()
        setShowUpgradeModal(true)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [trialStatus, pathname])

  if (trialStatus === 'loading') {
    return <>{children}</>
  }

  if (trialStatus === 'trial_expired') {
    return (
      <div className="relative">
        {/* Overlay semi-transparent sur tout le contenu sauf settings */}
        {!pathname.startsWith('/dashboard/settings') && (
          <div className="absolute inset-0 z-40 pointer-events-none">
            <div className="absolute inset-0 bg-gray-900/5 backdrop-blur-[0.5px]" />
            
            {/* Cadenas flottants sur différentes zones */}
            <div className="absolute top-20 left-20 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <div className="absolute top-40 right-32 animate-pulse delay-100">
              <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <div className="absolute bottom-40 left-1/3 animate-pulse delay-200">
              <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>
        )}
        
        {children}
        
        <UpgradeModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
        />
      </div>
    )
  }

  return <>{children}</>
}

