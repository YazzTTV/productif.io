"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  return (
    <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-accent-foreground">
      <LogOut className="h-4 w-4 mr-2" />
      Déconnexion
    </Button>
  )
}

