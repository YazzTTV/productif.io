"use client"

import { Metadata } from "next"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { useEffect } from "react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Si on vient de l'onboarding, rediriger vers l'onboarding
  useEffect(() => {
    const fromOnboarding = searchParams.get('from') === 'onboarding'
    const callbackUrl = searchParams.get('callbackUrl')
    
    if (fromOnboarding || callbackUrl === '/onboarding') {
      router.replace('/onboarding')
    }
  }, [router, searchParams])

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
          <p className="text-sm text-muted-foreground">
            Saisissez vos identifiants pour vous connecter
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link 
            href="/onboarding"
            className="hover:text-brand-green underline underline-offset-4"
          >
            Pas encore de compte ? Inscrivez-vous
          </Link>
        </p>
      </div>
    </div>
  )
} 