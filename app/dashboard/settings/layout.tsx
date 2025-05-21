"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { User, KeyRound, ShieldCheck, Wrench } from "lucide-react"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isLinkActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    {
      name: "Profil",
      href: "/dashboard/settings",
      icon: <User className="mr-2 h-4 w-4" />,
    },
    {
      name: "Tokens API",
      href: "/dashboard/settings/api-tokens",
      icon: <KeyRound className="mr-2 h-4 w-4" />,
    },
    // On peut ajouter d'autres sections si nécessaire
    // {
    //   name: "Sécurité",
    //   href: "/dashboard/settings/security",
    //   icon: <ShieldCheck className="mr-2 h-4 w-4" />,
    // },
  ]

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: isLinkActive(item.href) ? "secondary" : "ghost",
                  size: "sm",
                }),
                "w-full justify-start"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
} 