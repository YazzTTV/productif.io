"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserCog } from "lucide-react"
import { DashboardNav } from "@/components/dashboard/nav"
import Link from "next/link"

export default function ViewAsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const [userName, setUserName] = useState<string>("l'utilisateur")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setUserName(data.user.name || data.user.email || "l'utilisateur")
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des infos utilisateur:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserInfo()
  }, [userId])

  return (
    <AdminRequiredPage requireSuperAdmin>
      <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center">
          <UserCog className="text-yellow-600 h-5 w-5 mr-2" />
          <span className="font-medium text-yellow-700">
            Visualisation des données de {isLoading ? "..." : userName} (lecture seule)
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          onClick={() => router.push("/dashboard/admin/users")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à la liste
        </Button>
      </div>

      <div className="flex">
        <aside className="w-64 border-r shrink-0 h-[calc(100vh-57px)] overflow-y-auto">
          <DashboardNav viewAsMode={true} viewAsUserId={userId} />
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminRequiredPage>
  )
} 