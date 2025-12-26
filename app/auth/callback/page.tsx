"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return

    if (status === "authenticated" && session?.user?.email) {
      // Appeler l'API pour créer les cookies d'authentification personnalisés
      fetch("/api/auth/sync-session", {
        method: "POST",
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            // Récupérer l'URL de redirection depuis les paramètres ou utiliser le dashboard par défaut
            const redirectUrl = searchParams.get("callbackUrl") || "/dashboard"
            router.push(redirectUrl)
          } else {
            router.push("/login?error=session_sync_failed")
          }
        })
        .catch((error) => {
          console.error("Erreur lors de la synchronisation de session:", error)
          router.push("/login?error=session_sync_error")
        })
    } else if (status === "unauthenticated") {
      router.push("/login?error=not_authenticated")
    }
  }, [status, session, router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-sm text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

