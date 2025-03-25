"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserPlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"

export default function InviteUserPage() {
  const params = useParams()
  const companyId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/companies/${companyId}/users/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "L'utilisateur a été invité avec succès"
        })
        router.push(`/dashboard/admin/companies/${companyId}`)
      } else {
        throw new Error(data.error || "Une erreur est survenue")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push(`/dashboard/admin/companies/${companyId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Inviter un utilisateur</h1>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Nouvel utilisateur</CardTitle>
            <CardDescription>
              Invitez un nouvel utilisateur à rejoindre votre entreprise
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom (optionnel)</Label>
                <Input
                  id="name"
                  placeholder="Nom de l'utilisateur"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="utilisateur@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  L'utilisateur pourra modifier son mot de passe après la première connexion.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isLoading ? "Création en cours..." : "Inviter l'utilisateur"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 