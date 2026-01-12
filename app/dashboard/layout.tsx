"use client";

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ClientAuthProvider } from "@/components/auth/client-auth-provider"
import { AutoLogout } from "@/components/auth/auto-logout"
import { WebSidebar } from "@/components/layout/web-sidebar"
import { WebTopbar } from "@/components/layout/web-topbar"
import { cn } from "@/lib/utils"
import { Capacitor } from '@capacitor/core'
import { MobileNav } from "@/components/navigation/mobile-nav"
import { TrialExpiredOverlay } from "@/components/trial/TrialExpiredOverlay"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isNativeMobile, setIsNativeMobile] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsNativeMobile(Capacitor.isNativePlatform())
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setUserName(data.user?.name || '')
          setUserEmail(data.user?.email || '')
          
          // Check premium status
          const premiumResponse = await fetch('/api/user/trial-status', { credentials: 'include' })
          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json()
            setIsPremium(premiumData.hasAccess || false)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const isDashboardPage = pathname?.startsWith("/dashboard")
  const isFullScreenPage = pathname === '/dashboard/focus' || pathname === '/dashboard/exam' || pathname === '/focus'
  const showBackButton = isDashboardPage && pathname !== '/dashboard'

  // Mobile: keep existing layout
  if (isNativeMobile || typeof window !== 'undefined' && window.innerWidth < 1280) {
    return (
      <ClientAuthProvider>
        <AutoLogout />
        <div className={cn("flex flex-col", isNativeMobile ? "ios-viewport-fix" : "min-h-screen")}>
          <main className={cn("flex-1 w-full", isNativeMobile ? "ios-content-wrapper" : "overflow-auto")}>
            {children}
          </main>
          <MobileNav />
          <TrialExpiredOverlay />
        </div>
      </ClientAuthProvider>
    )
  }

  // Desktop: 2-column layout
  return (
    <ClientAuthProvider>
      <AutoLogout />
      <div className="min-h-screen bg-white">
        {/* Full screen pages (Focus, Exam) - no sidebar */}
        {isFullScreenPage ? (
          <main className="min-h-screen">
            {children}
          </main>
        ) : (
          <>
            {/* Sidebar - fixed left */}
            <WebSidebar isPremium={isPremium} />

            {/* Main content area */}
            <div className="xl:ml-64">
              {/* Top bar */}
              <WebTopbar 
                userName={userName}
                userEmail={userEmail}
                isPremium={isPremium}
                showBackButton={showBackButton}
              />

              {/* Content */}
              <main className="max-w-[1200px] mx-auto px-8 py-8">
                {children}
              </main>
            </div>
          </>
        )}
        <TrialExpiredOverlay />
      </div>
    </ClientAuthProvider>
  )
}
