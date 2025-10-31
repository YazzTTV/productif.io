'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export function LockedCard({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    fetch('/api/user/trial-status')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        if (!mounted) return
        setLocked(data.status === 'trial_expired')
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <div className="relative">
      {children}
      {locked && (
        <>
          <div
            className="absolute inset-0 z-10 cursor-not-allowed"
            onClick={() => router.push('/upgrade')}
          />
          <div className="absolute top-2 right-2 z-20 rounded-full bg-white/90 border border-gray-200 p-1 shadow-sm">
            <Lock className="w-4 h-4 text-gray-700" />
          </div>
        </>
      )}
    </div>
  )
}


