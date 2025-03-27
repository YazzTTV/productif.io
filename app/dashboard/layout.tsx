"use client";

import type React from "react"
import Link from "next/link"
import { LogoutButton } from "@/components/auth/logout-button"
import { DashboardNav } from "@/components/dashboard/nav"
import { useLocale } from "@/lib/i18n"
import { ClientAuthProvider } from "@/components/auth/client-auth-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { locale } = useLocale();
  
  return (
    <ClientAuthProvider>
      <div className="flex min-h-screen flex-col">
        <header className="bg-card border-b border-border shadow z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
            <Link href="/dashboard" className="text-2xl font-bold text-foreground">
              productif.io
            </Link>
            <div className="flex items-center space-x-4">
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-64 bg-card border-r border-border">
            <DashboardNav />
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6 bg-background">{children}</main>
        </div>

        <footer className="bg-card border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} productif.io. {locale === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
          </div>
        </footer>
      </div>
    </ClientAuthProvider>
  )
}

