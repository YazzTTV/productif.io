"use client";

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { LogoutButton } from "@/components/auth/logout-button"
import { useLocale } from "@/lib/i18n"
import { ClientAuthProvider } from "@/components/auth/client-auth-provider"
import { AutoLogout } from "@/components/auth/auto-logout"
import { cn } from "@/lib/utils"
import { Capacitor } from '@capacitor/core'
import { MobileNav } from "@/components/navigation/mobile-nav"
import { TrialBanner } from "@/components/trial/TrialBanner"
import { TrialExpiredOverlay } from "@/components/trial/TrialExpiredOverlay"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { locale } = useLocale();
  const [isNativeMobile, setIsNativeMobile] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setIsNativeMobile(Capacitor.isNativePlatform());
  }, []);

  // Masquer le header global pour toutes les pages du dashboard (nouveau design plein écran)
  const isDashboardPage = pathname.startsWith("/dashboard");
  
  return (
    <ClientAuthProvider>
      {/* Composant de déconnexion automatique */}
      <AutoLogout />
      
      <div className={cn(
        "flex flex-col",
        isNativeMobile ? "ios-viewport-fix" : "min-h-screen"
      )}>
        {!isDashboardPage && (
          <header className={cn(
            "bg-card border-b border-border shadow z-20 sticky top-0",
            isNativeMobile && "pt-safe-area-inset-top"
          )}>
            <div className={cn(
              "mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8",
              isNativeMobile && "pt-2"
            )}>
              <div className="flex items-center">
                <Link href="/dashboard" className="text-xl sm:text-2xl font-bold text-foreground">
                  productif.io
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                <LogoutButton />
              </div>
            </div>
          </header>
        )}

        {/* Bannière de rappel du trial */}
        {!isDashboardPage && <TrialBanner />}

        <div className="flex flex-1 relative">
          {/* Main content - Full width without sidebar */}
          <main className={cn(
            "flex-1 w-full",
            isNativeMobile 
              ? "ios-content-wrapper" 
              : "overflow-auto"
          )}>
            {children}
          </main>
        </div>

        <footer className="bg-card border-t border-border z-10 hidden md:block">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} productif.io. {locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
          </div>
        </footer>
        
        {/* Navigation mobile globale - fixe en bas de l'écran */}
        <MobileNav />
        {/* Trial overlay + lock mask when trial expiré */}
        <TrialExpiredOverlay />
      </div>
    </ClientAuthProvider>
  )
}

