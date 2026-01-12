"use client"

import { ClientAuthProvider } from "@/components/auth/client-auth-provider"
import { AutoLogout } from "@/components/auth/auto-logout"

export default function FocusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientAuthProvider>
      <AutoLogout />
      <div className="min-h-screen bg-white">
        {children}
      </div>
    </ClientAuthProvider>
  )
}

