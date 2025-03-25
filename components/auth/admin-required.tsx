"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface AdminRequiredPageProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  prohibitSuperAdmin?: boolean;
}

export function AdminRequiredPage({ children, requireSuperAdmin = false, prohibitSuperAdmin = false }: AdminRequiredPageProps) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          const role = data.user?.role
          setUserRole(role)
          
          if (requireSuperAdmin) {
            // Si on exige un super admin, vérifier le rôle
            if (role === "SUPER_ADMIN") {
              setIsAdmin(true)
            } else {
              setIsAdmin(false)
              router.push("/dashboard/admin")
            }
          } else if (prohibitSuperAdmin) {
            // Si on interdit l'accès aux super admins
            if (role === "SUPER_ADMIN") {
              setIsAdmin(false)
              router.push("/dashboard/admin")
            } else if (role === "ADMIN") {
              setIsAdmin(true)
            } else {
              setIsAdmin(false)
              router.push("/dashboard")
            }
          } else {
            // Sinon, accepter admin ou super admin
            if (role === "ADMIN" || role === "SUPER_ADMIN") {
              setIsAdmin(true)
            } else {
              setIsAdmin(false)
              router.push("/dashboard")
            }
          }
        } else {
          setIsAdmin(false)
          router.push("/login")
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error)
        setIsAdmin(false)
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [router, requireSuperAdmin, prohibitSuperAdmin])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            {requireSuperAdmin 
              ? "Cette fonctionnalité est réservée aux super administrateurs." 
              : prohibitSuperAdmin && userRole === "SUPER_ADMIN"
                ? "Cette fonctionnalité n'est pas disponible pour les super administrateurs."
                : "Vous n'avez pas les droits nécessaires pour accéder à cette page."}
            {" "}Redirection en cours...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
} 