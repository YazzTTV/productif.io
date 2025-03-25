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

      // Rediriger vers la page de connexion après inscription réussie
      router.push("/login?registered=true")
    } catch (error) {
      console.error("Erreur d'inscription:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscription</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
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
            {isLoading ? "Inscription en cours..." : "S'inscrire"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

