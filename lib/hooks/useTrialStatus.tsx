"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type TrialStatus = 'trial_active' | 'trial_expired' | 'subscribed' | 'cancelled' | 'loading'

interface TrialContextType {
  status: TrialStatus
  hasAccess: boolean
  trialDaysLeft?: number
  showUpgradeModal: boolean
  setShowUpgradeModal: (show: boolean) => void
  refreshStatus: () => Promise<void>
}

const TrialContext = createContext<TrialContextType | undefined>(undefined)

export function TrialProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<TrialStatus>('loading')
  const [hasAccess, setHasAccess] = useState(true)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | undefined>()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const refreshStatus = async () => {
    try {
      const response = await fetch('/api/user/trial-status', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
        setHasAccess(data.hasAccess)
        setTrialDaysLeft(data.trialDaysLeft)
      }
    } catch (error) {
      console.error('[TRIAL] Erreur lors de la vérification du statut:', error)
    }
  }

  useEffect(() => {
    refreshStatus()
  }, [])

  return (
    <TrialContext.Provider value={{ 
      status, 
      hasAccess, 
      trialDaysLeft, 
      showUpgradeModal, 
      setShowUpgradeModal,
      refreshStatus 
    }}>
      {children}
    </TrialContext.Provider>
  )
}

export function useTrialStatus() {
  const context = useContext(TrialContext)
  if (context === undefined) {
    throw new Error('useTrialStatus must be used within a TrialProvider')
  }
  return context
}

