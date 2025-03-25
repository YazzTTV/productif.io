"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { Separator } from "@/components/ui/separator"

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

export default function EditUserPage() {
  const params = useParams()
  const userId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  
  const [user, setUser] = useState<User | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les informations sur l'utilisateur connecté
        const meResponse = await fetch("/api/auth/me")
        if (meResponse.ok) {
          const meData = await meResponse.json()
          setCurrentUserRole(meData.user.role)
        }
        
        // Récupérer les données de l'utilisateur à modifier
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) {
          throw new Error("Impossible de récupérer les données de l'utilisateur")
        }
        
        const data = await response.json()
        setUser(data.user)
        
        // Initialiser les champs du formulaire
        if (data.user) {
          setName(data.user.name || "")
          setEmail(data.user.email)
          setRole(data.user.role)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les données de l'utilisateur",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [userId, toast])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          role,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Les informations de l'utilisateur ont été mises à jour"
        })
        router.push("/dashboard/admin/users")
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
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <AdminRequiredPage>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminRequiredPage>
    )
  }
  
  if (!user) {
    return (
      <AdminRequiredPage>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold">Utilisateur non trouvé</h2>
          <p className="mt-2 text-muted-foreground">
            L'utilisateur demandé n'existe pas ou vous n'avez pas les permissions nécessaires.
          </p>
          <Button asChild className="mt-4">
            <a href="/dashboard/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste des utilisateurs
            </a>
          </Button>
        </div>
      </AdminRequiredPage>
    )
  }
  
  return (
    <AdminRequiredPage>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push("/dashboard/admin/users")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Modifier un utilisateur</h1>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid gap-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Informations utilisateur</CardTitle>
                <CardDescription>
                  Modifiez les informations de l'utilisateur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    L'adresse email ne peut pas être modifiée
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    placeholder="Nom de l'utilisateur"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={role}
                    onValueChange={setRole}
                    disabled={
                      // Désactiver si:
                      // - c'est l'utilisateur lui-même 
                      // - l'utilisateur connecté n'est pas SUPER_ADMIN et essaie de modifier un SUPER_ADMIN
                      // - l'utilisateur n'est pas SUPER_ADMIN et essaie de faire de quelqu'un un SUPER_ADMIN
                      userId === user.id ||
                      (currentUserRole !== "SUPER_ADMIN" && user.role === "SUPER_ADMIN") ||
                      (currentUserRole !== "SUPER_ADMIN" && role === "SUPER_ADMIN")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Utilisateur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                      {currentUserRole === "SUPER_ADMIN" && (
                        <SelectItem value="SUPER_ADMIN">Super Administrateur</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {userId === user.id && (
                    <p className="text-xs text-muted-foreground">
                      Vous ne pouvez pas modifier votre propre rôle
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </AdminRequiredPage>
  )
} 