"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { 
  Shield, 
  Building2, 
  Users, 
  ClipboardList, 
  BarChart3,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function SuperAdminMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setIsSuperAdmin(data.user?.role === "SUPER_ADMIN")
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du rôle:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSuperAdmin()
  }, [])

  if (isLoading || !isSuperAdmin) {
    return null
  }

  const menuItems = [
    {
      label: "Tableau de bord",
      icon: BarChart3,
      path: "/dashboard/admin/super-dashboard",
      description: "Vue globale des utilisateurs"
    },
    {
      label: "Entreprises",
      icon: Building2,
      path: "/dashboard/admin/companies",
      description: "Liste des entreprises"
    },
    {
      label: "Utilisateurs",
      icon: Users,
      path: "/dashboard/admin/users",
      description: "Liste des utilisateurs"
    },
    {
      label: "Onboarding",
      icon: ClipboardList,
      path: "/dashboard/admin/onboarding",
      description: "Données d'onboarding"
    }
  ]

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "fixed top-4 right-4 z-50 shadow-lg",
            "bg-white hover:bg-gray-50 border-2",
            "flex items-center gap-2 px-4 py-2",
            "rounded-full"
          )}
        >
          <Shield className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-sm">Super Admin</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 mt-2 mr-4"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          Menu Super Admin
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer",
                "hover:bg-green-50",
                isActive(item.path) && "bg-green-50 text-green-700"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mt-0.5 flex-shrink-0",
                isActive(item.path) ? "text-green-600" : "text-gray-500"
              )} />
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium text-sm",
                  isActive(item.path) && "text-green-700"
                )}>
                  {item.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

