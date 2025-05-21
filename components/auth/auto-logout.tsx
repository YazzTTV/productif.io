"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { appConfig } from "@/lib/config"

export function AutoLogout() {
  const router = useRouter()

  useEffect(() => {
    // Vérifier si la fonctionnalité est activée dans la configuration
    if (!appConfig.autoLogoutEnabled) {
      return;
    }

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      try {
        // Envoyer une requête de déconnexion au serveur
        // Utiliser sendBeacon pour une requête qui sera envoyée même si la page se ferme
        navigator.sendBeacon("/api/auth/logout", JSON.stringify({}))
      } catch (error) {
        console.error("Erreur lors de la déconnexion automatique:", error)
      }
    }

    // Ajouter l'écouteur d'événement pour détecter la fermeture de la page
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Nettoyer l'écouteur d'événement lors du démontage du composant
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // Ce composant ne rend rien visuellement
  return null
} 