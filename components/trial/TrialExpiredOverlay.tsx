'use client';

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Lock, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TrialExpiredOverlay() {
  const [status, setStatus] = useState<'unknown' | 'trial_active' | 'trial_expired' | 'subscribed' | 'cancelled'>('unknown')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/user/trial-status')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        if (!mounted) return
        setStatus(data.status)
        if (data.status === 'trial_expired') {
          setShowModal(true)
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  if (status !== 'trial_expired') return null

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-[71] w-[92vw] max-w-xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            <button
              aria-label="Fermer"
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Votre essai gratuit est terminé</h2>
            </div>

            <p className="text-gray-600 leading-relaxed mb-5">
              Continuez à profiter de Productif.io sans limite: planifiez vos journées, suivez vos habitudes et restez focus. Rejoignez maintenant et débloquez toutes les fonctionnalités.
            </p>

            <ul className="text-gray-700 space-y-2 mb-6 list-disc list-inside">
              <li>Accès complet au tableau de bord et aux statistiques</li>
              <li>Assistant IA productivité et rappels intelligents</li>
              <li>Historique illimité et export de vos données</li>
            </ul>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Link href="/upgrade" className="inline-flex items-center justify-center gap-2 rounded-lg bg-black text-white px-4 py-2.5 font-medium hover:bg-gray-900">
                <Crown className="w-5 h-5" />
                Choisir mon abonnement
              </Link>
              <Button
                variant="secondary"
                className="bg-gray-100 hover:bg-gray-200"
                onClick={() => setShowModal(false)}
              >
                Je verrai plus tard
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


