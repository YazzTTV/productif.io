"use client";

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { LogoutButton } from "@/components/auth/logout-button"
import { DashboardNav } from "@/components/dashboard/nav"
import { useLocale } from "@/lib/i18n"
import { ClientAuthProvider } from "@/components/auth/client-auth-provider"
import { AutoLogout } from "@/components/auth/auto-logout"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Capacitor } from '@capacitor/core'
import { MobileNav } from "@/components/navigation/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { locale } = useLocale();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNativeMobile, setIsNativeMobile] = useState(false);
  
  useEffect(() => {
    setIsNativeMobile(Capacitor.isNativePlatform());
  }, []);
  
  return (
    <ClientAuthProvider>
      {/* Composant de déconnexion automatique */}
      <AutoLogout />
      
      <div className="flex min-h-screen flex-col">
        <header className={cn(
          "bg-card border-b border-border shadow z-20 sticky top-0",
          isNativeMobile && "pt-safe-area-inset-top"
        )}>
          <div className={cn(
            "mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8",
            isNativeMobile && "pt-2"
          )}>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
              <Link href="/dashboard" className="text-xl sm:text-2xl font-bold text-foreground">
                productif.io
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="flex flex-1 relative">
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/80 z-10 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <aside 
            className={cn(
              "fixed md:static inset-y-0 left-0 z-20 w-64 transform transition-transform duration-200 ease-in-out bg-card border-r border-border overflow-y-auto",
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
              "md:h-[calc(100vh-4rem)] md:sticky md:top-16",
              isNativeMobile ? "pt-24" : "pt-20",
              "md:pt-0"
            )}
          >
            <div className="px-2 py-2">
              <DashboardNav onNavItemClick={() => setSidebarOpen(false)} />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 sm:p-6 bg-background w-full overflow-auto pb-24 md:pb-6">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>

        <footer className="bg-card border-t border-border z-10">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} productif.io. {locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
          </div>
        </footer>
        
        {/* Navigation mobile globale */}
        <MobileNav />
      </div>
    </ClientAuthProvider>
  )
}

