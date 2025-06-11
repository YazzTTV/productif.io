"use client"

import * as React from "react"
import { Capacitor } from '@capacitor/core'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkIsMobile = () => {
      // Vérifier si on est sur une plateforme native (Capacitor)
      if (Capacitor.isNativePlatform()) {
        setIsMobile(true)
        return
      }

      // Sinon, vérifier la taille d'écran
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    checkIsMobile()
    
    const handleResize = () => {
      // Sur native, toujours mobile
      if (Capacitor.isNativePlatform()) return
      
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return isMobile
}
