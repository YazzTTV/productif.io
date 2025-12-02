'use client';

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'

interface LockedCardProps {
  children: React.ReactNode
  onLockedClick?: () => void
}

export function LockedCard({ children, onLockedClick }: LockedCardProps) {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/user/trial-status', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        if (!mounted) return
        setLocked(data.status === 'trial_expired')
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  if (!locked) {
    return <>{children}</>
  }

  return (
    <div className="relative group">
      {children}
      {/* Overlay semi-transparent */}
      <div
        className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] cursor-pointer rounded-lg transition-all group-hover:bg-white/50"
        onClick={onLockedClick}
      />
      {/* Cadenas */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-gray-200 group-hover:scale-110 transition-transform">
          <Lock className="w-8 h-8 text-gray-600" />
        </div>
      </div>
    </div>
  )
}


