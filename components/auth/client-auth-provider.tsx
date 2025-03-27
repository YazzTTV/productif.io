"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Vérifier l'authentification côté client
    const checkAuth = async () => {
      try {
        // Vérifier le cookie auth_status (non-httpOnly)
        const hasAuthStatus = document.cookie.includes('auth_status=logged_in')
        
        // Si pas de cookie d'état, vérifier avec l'API
        if (!hasAuthStatus) {
          const response = await fetch('/api/auth/me', { 
            credentials: 'include' 
          })
          
          if (!response.ok) {
            // Rediriger vers la page de connexion si non authentifié
            router.push('/login')
            return
          }
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
} 