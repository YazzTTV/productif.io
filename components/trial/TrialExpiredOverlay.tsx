'use client';

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Lock } from 'lucide-react'
import { UpgradeModal } from './UpgradeModal'

export function TrialExpiredOverlay() {
  const [status, setStatus] = useState<'unknown' | 'trial_active' | 'trial_expired' | 'subscribed' | 'cancelled'>('unknown')
  const [showModal, setShowModal] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    fetch('/api/user/trial-status', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        if (!mounted) return
        setStatus(data.status)
        console.log('[TRIAL_OVERLAY] Statut:', data.status)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [pathname])

  // Intercepter les clics quand le trial est expiré
  useEffect(() => {
    if (status !== 'trial_expired') return

    // Ne pas intercepter les clics sur settings ou upgrade
    if (pathname.startsWith('/dashboard/settings') || pathname.startsWith('/upgrade')) {
      console.log('[TRIAL_OVERLAY] Page settings/upgrade - clics autorisés')
      return
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Autoriser les clics dans la modal d'upgrade
      if (
        target.closest('[data-allow-click]') ||
        target.closest('[role="dialog"]') ||
        target.closest('.upgrade-modal')
      ) {
        return
      }

      // Vérifier si c'est un lien ou bouton cliquable dans le dashboard
      const clickableElement = target.closest('a, button, [role="button"], [onclick]')
      if (clickableElement && !clickableElement.hasAttribute('data-allow-click')) {
        // Ne pas bloquer le lien vers settings
        const href = clickableElement.getAttribute('href')
        if (href && href.includes('settings')) {
          console.log('[TRIAL_OVERLAY] Lien vers settings autorisé')
          return
        }

        e.preventDefault()
        e.stopPropagation()
        console.log('[TRIAL_OVERLAY] Clic bloqué, affichage de la modal')
        setShowModal(true)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [status, pathname])

  // Ajouter des styles CSS pour les cadenas sur les sections
  useEffect(() => {
    if (status !== 'trial_expired') return

    // Ne pas verrouiller si on est sur settings ou upgrade
    const isSettingsOrUpgrade = pathname.startsWith('/dashboard/settings') || pathname.startsWith('/upgrade')
    
    if (isSettingsOrUpgrade) {
      console.log('[TRIAL_OVERLAY] Page settings/upgrade - pas de verrouillage')
      return
    }

    // Ajouter des styles globaux pour verrouiller les sections
    const style = document.createElement('style')
    style.id = 'trial-lock-styles'
    style.textContent = `
      /* Verrouiller toutes les cartes et sections */
      .dashboard-card,
      .stat-card,
      .metric-card,
      [data-lockable="true"] {
        position: relative;
      }
      
      .dashboard-card::after,
      .stat-card::after,
      .metric-card::after,
      [data-lockable="true"]::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(1px);
        border-radius: inherit;
        z-index: 10;
        pointer-events: auto;
        cursor: pointer;
      }
      
      .dashboard-card::before,
      .stat-card::before,
      .metric-card::before,
      [data-lockable="true"]::before {
        content: '🔒';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2rem;
        z-index: 20;
        pointer-events: none;
      }
    `
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById('trial-lock-styles')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [status, pathname])

  if (status !== 'trial_expired') return null

  return (
    <>
      {/* Modal d'upgrade */}
      <UpgradeModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  )
}



