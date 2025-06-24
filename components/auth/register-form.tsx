"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCompanyAccount, setIsCompanyAccount] = useState(false)

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
      // Inscription
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

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'inscription")
      }

      // Connexion automatique
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: '/dashboard/onboarding'
      })

    } catch (error) {
      console.error("Erreur complète:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="companyAccount"
              checked={isCompanyAccount}
              onCheckedChange={(checked) => setIsCompanyAccount(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="companyAccount" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Créer un compte entreprise
            </Label>
          </div>

          {isCompanyAccount && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required={isCompanyAccount}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">Description de l'entreprise</Label>
                <Input
                  id="companyDescription"
                  name="companyDescription"
                  type="text"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Création du compte..." : "Créer un compte"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

