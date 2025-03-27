"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Vérifier l'authentification côté client
    const checkAuth = async () => {
      try {
        // Vérifier le cookie auth_status (non-httpOnly)
        const hasAuthStatus = document.cookie.includes('auth_status=logged_in')
        
        // Si pas de cookie d'état, vérifier avec l'API
        if (!hasAuthStatus) {
          console.log("Checking authentication with API...")
          const response = await fetch('/api/auth/me', { 
            credentials: 'include',
            cache: 'no-store' // Éviter la mise en cache de la réponse
          })
          
          if (!response.ok) {
            console.log("Not authenticated, redirecting to login")
            // Ne rediriger vers la page de connexion que si l'authentification n'a pas encore été vérifiée
            // Cela évite les boucles de redirection infinies
            if (!authChecked) {
              router.push('/login')
            }
            setAuthChecked(true)
            setIsLoading(false)
            return
          }
          
          console.log("Authentication successful")
        } else {
          console.log("Auth status cookie found")
        }
        
        setAuthChecked(true)
        setIsLoading(false)
      } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error)
        if (!authChecked) {
          router.push('/login')
        }
        setAuthChecked(true)
        setIsLoading(false)
      }
    }

    // Ne vérifier l'authentification que lorsque le chemin change
    checkAuth()
  }, [pathname, router, authChecked])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
} 