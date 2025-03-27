"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { signIn } from "next-auth/react"

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCompanyAccount, setIsCompanyAccount] = useState(false)
  const isPremiumPlan = searchParams?.get("plan") === "premium"

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const companyName = isCompanyAccount ? formData.get("companyName") as string : undefined
    const companyDescription = isCompanyAccount ? formData.get("companyDescription") as string : undefined

    try {
      // 1. Inscription
      console.log('Sending registration request...');
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          company: isCompanyAccount ? { name: companyName, description: companyDescription } : undefined
        }),
      })

      const data = await response.json()
      console.log('Registration response:', data);

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'inscription")
      }

      if (!data.user?.id) {
        throw new Error("L'ID utilisateur n'a pas été retourné par l'API")
      }

      // Si l'inscription est réussie et que c'est un plan premium, créer une session Stripe
      // IMPORTANT: Nous créons la session Stripe AVANT la connexion automatique
      if (isPremiumPlan) {
        console.log('Creating Stripe checkout session...');
        const stripeResponse = await fetch("/api/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id }),
        })

        const stripeData = await stripeResponse.json()
        console.log('Stripe response:', stripeData);

        if (!stripeResponse.ok) {
          throw new Error(stripeData.error || "Erreur lors de la création de la session de paiement")
        }

        if (stripeData.url) {
          console.log('Redirecting to Stripe checkout:', stripeData.url);
          
          // On stocke l'URL dans le localStorage avant la redirection
          localStorage.setItem('stripeCheckoutUrl', stripeData.url);
          
          // Redirection immédiate vers Stripe
          window.location.href = stripeData.url;
          return;
        } else {
          throw new Error("L'URL de paiement n'a pas été retournée")
        }
      }

      // 2. Connexion automatique (seulement si on n'est pas en train de créer un plan premium)
      console.log('Attempting automatic sign in...');
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: '/dashboard'
      })

      // Note: Le code après cette ligne ne sera pas exécuté si la redirection est effectuée
      console.log('Sign in result:', signInResult);
    } catch (error) {
      console.error("Erreur complète:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscription {isPremiumPlan ? "Premium" : ""}</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isPremiumPlan && (
            <Alert>
              <AlertDescription>
                Après votre inscription, vous serez redirigé vers la page de paiement pour activer votre compte premium.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" placeholder="Votre nom" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="votre.email@exemple.com" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isCompany" 
              checked={isCompanyAccount}
              onCheckedChange={(checked) => setIsCompanyAccount(checked === true)}
            />
            <Label 
              htmlFor="isCompany" 
              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Je souhaite créer un compte entreprise
            </Label>
          </div>
          
          <div 
            className={cn(
              "rounded-lg border p-4 space-y-4 transition-all",
              isCompanyAccount ? "opacity-100" : "opacity-50 pointer-events-none"
            )}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium">Informations de l'entreprise</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input 
                id="companyName" 
                name="companyName" 
                placeholder="Nom de votre entreprise"
                required={isCompanyAccount} 
                disabled={!isCompanyAccount}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyDescription">Description (optionnelle)</Label>
              <Input 
                id="companyDescription" 
                name="companyDescription" 
                placeholder="Décrivez votre entreprise en quelques mots"
                disabled={!isCompanyAccount}
              />
              <p className="text-xs text-muted-foreground">
                Cette description pourra être modifiée ultérieurement.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Inscription en cours..." : isPremiumPlan ? "S'inscrire et continuer vers le paiement" : "S'inscrire"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

