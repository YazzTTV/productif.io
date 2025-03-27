"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Search, UserPlus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function AddUsersPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await fetch(`/api/companies/${params.id}`)
        if (!response.ok) {
          throw new Error("Impossible de récupérer les détails de l'entreprise")
        }
        const data = await response.json()
        setCompany(data.company)
      } catch (error) {
        console.error("Erreur:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les détails de l'entreprise",
          variant: "destructive"
        })
      }
    }

    fetchCompanyDetails()
  }, [params.id, toast])

  const searchUsers = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`)
      if (!response.ok) {
        throw new Error("Impossible de rechercher les utilisateurs")
      }
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les utilisateurs",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/companies/${params.id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Impossible d'ajouter l'utilisateur")
      }

      toast({
        title: "Succès",
        description: "L'utilisateur a été ajouté à l'entreprise",
      })

      // Retirer l'utilisateur de la liste
      setUsers(users.filter(user => user.id !== userId))
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'ajouter l'utilisateur",
        variant: "destructive"
      })
    }
  }

  return (
    <AdminRequiredPage>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">Ajouter des utilisateurs</h1>
          <p className="text-muted-foreground">
            {company ? `Ajouter des utilisateurs à ${company.name}` : 'Chargement...'}
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Rechercher des utilisateurs</CardTitle>
          <CardDescription>
            Recherchez des utilisateurs par nom ou email pour les ajouter à l'entreprise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Recherche</Label>
              <Input
                id="search"
                placeholder="Nom ou email de l'utilisateur"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchUsers} disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résultats de la recherche</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Inscrit le {format(new Date(user.createdAt), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddUser(user.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminRequiredPage>
  )
} 