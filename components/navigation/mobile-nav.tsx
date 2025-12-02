"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Capacitor } from '@capacitor/core'

export function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
  }, [])

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      )
    },
    {
      path: "/dashboard/habits",
      label: "Habitudes",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      path: "/dashboard/tasks",
      label: "Tâches",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      path: "/dashboard/settings",
      label: "Paramètres",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(path)
  }

  return (
    <nav 
      className={cn(
        "bg-white/98 backdrop-blur-xl border-t border-gray-200/80 px-4 py-2 pb-safe-area-inset-bottom shadow-2xl md:hidden supports-[backdrop-filter]:bg-white/90",
        isNative 
          ? "mobile-nav-native h-20" 
          : "fixed bottom-0 left-0 right-0 z-[9999]"
      )}
      style={isNative ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: '80px',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      } : {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999
      }}
    >
      <div className="flex items-center justify-around max-w-sm mx-auto gap-1">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            onClick={() => router.push(item.path)}
            className={cn(
              "flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200",
              "hover:bg-green-50 active:scale-95 min-h-[60px] justify-center",
              isActive(item.path)
                ? "text-green-600 bg-green-50" 
                : "text-gray-500 hover:text-green-600"
            )}
            data-allow-click={item.path === "/dashboard/settings"}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
              isActive(item.path)
                ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                : "bg-gray-100 text-gray-400"
            )}>
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  )
} 