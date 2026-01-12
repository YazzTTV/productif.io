"use client"

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Home, 
  Bot, 
  Trophy, 
  Settings,
  Lock
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavItem {
  id: string
  label: string
  icon: typeof Home
  path: string
  isPremium?: boolean
}

interface WebSidebarProps {
  isPremium: boolean
}

export function WebSidebar({ isPremium }: WebSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'ai', label: 'AI Assistant', icon: Bot, path: '/dashboard/assistant-ia' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/dashboard/leaderboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ]

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.isPremium && !isPremium) {
      e.preventDefault()
      // Navigate to preview version
      router.push(`${item.path}?preview=true`)
    }
  }

  return (
    <aside className="hidden xl:flex flex-col w-64 border-r border-black/5 bg-white fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-black/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            productif.io
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/')
            const Icon = item.icon
            const isLocked = item.isPremium && !isPremium

            return (
              <motion.div
                key={item.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={item.path}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative
                    ${isActive 
                      ? 'bg-[#16A34A]/5 text-[#16A34A]' 
                      : 'text-black/60 hover:text-black hover:bg-black/5'
                    }
                    ${isLocked ? 'opacity-60' : ''}
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#16A34A] rounded-r-full"
                      initial={false}
                    />
                  )}

                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                  
                  {isLocked && (
                    <Lock className="w-3 h-3 ml-auto text-black/40" />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}

