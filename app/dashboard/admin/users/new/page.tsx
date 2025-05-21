"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserPlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function NewUserPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("USER") // Par défaut, l'utilisateur a le rôle "USER"
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Validation des champs
      if (!email || !password) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez remplir tous les champs obligatoires.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      // Création de l'utilisateur via l'API
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création de l'utilisateur")
      }
      
      // Succès
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès.",
      })
      
      // Redirection vers la liste des utilisateurs
      router.push("/dashboard/admin/users")
      router.refresh()
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la création de l'utilisateur.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <AdminRequiredPage>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/dashboard/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux utilisateurs
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Nouvel utilisateur</h1>
          <p className="text-muted-foreground">
            Créer un nouvel utilisateur sur la plateforme
          </p>
          <Separator className="mt-4" />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'utilisateur</CardTitle>
            <CardDescription>
              Remplissez les informations pour créer un nouvel utilisateur
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
              
              <div className="space-y-2">
                <Label htmlFor="role">Rôle *</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value)}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Utilisateur</SelectItem>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Administrateur</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Les utilisateurs standards peuvent utiliser la plateforme. Les administrateurs peuvent gérer leur entreprise.
                  Les super administrateurs ont tous les droits sur la plateforme.
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isLoading ? "Création en cours..." : "Créer l'utilisateur"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminRequiredPage>
  )
} 