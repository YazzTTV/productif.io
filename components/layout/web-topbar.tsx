"use client"

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WebTopbarProps {
  userName: string
  userEmail: string
  isPremium: boolean
  showBackButton?: boolean
}

export function WebTopbar({ userName, userEmail, isPremium, showBackButton = false }: WebTopbarProps) {
  const router = useRouter()
  const [initials, setInitials] = useState('U')

  useEffect(() => {
    if (userName) {
      const parts = userName.split(' ')
      if (parts.length >= 2) {
        setInitials(`${parts[0][0]}${parts[1][0]}`.toUpperCase())
      } else if (parts.length === 1) {
        setInitials(parts[0][0].toUpperCase())
      }
    } else if (userEmail) {
      setInitials(userEmail[0].toUpperCase())
    }
  }, [userName, userEmail])

  return (
    <header className="hidden xl:flex items-center justify-between px-8 py-4 border-b border-black/5 bg-white sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 rounded-xl border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Badge 
          variant={isPremium ? "default" : "secondary"}
          className={isPremium ? "bg-[#16A34A] text-white" : "bg-black/5 text-black/60"}
        >
          {isPremium ? 'Premium' : 'Free'}
        </Badge>
        
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-black/5 text-black/60 text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

