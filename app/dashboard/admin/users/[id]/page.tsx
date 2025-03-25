"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, PencilLine, User } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Separator } from "@/components/ui/separator"

interface UserDetails {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  companyName?: string
  companies?: {
    id: string
    name: string
    isActive: boolean
  }[]
}

export default function UserDetailsPage() {
  const params = useParams()
  const userId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  
  const [user, setUser] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}`)
        
        if (!response.ok) {
          throw new Error("Impossible de récupérer les détails de l'utilisateur")
        }
        
        const data = await response.json()
        setUser({
          ...data.user,
          companies: data.companies
        })
      } catch (error) {
        console.error("Erreur lors de la récupération des détails:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les détails de l'utilisateur",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserDetails()
  }, [userId, toast])
  
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
            <Link href="/dashboard/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste des utilisateurs
            </Link>
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
            <h1 className="text-2xl font-bold">Détails de l'utilisateur</h1>
          </div>
          
          <Button asChild>
            <Link href={`/dashboard/admin/users/${userId}/edit`}>
              <PencilLine className="mr-2 h-4 w-4" />
              Modifier l'utilisateur
            </Link>
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                <CardTitle>Informations générales</CardTitle>
              </div>
              <CardDescription>
                Détails du compte utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nom</p>
                <p className="text-lg">{user.name || "Non défini"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rôle</p>
                <div className="mt-1">
                  <Badge variant={user.role === "SUPER_ADMIN" ? "default" : user.role === "ADMIN" ? "secondary" : "outline"}>
                    {user.role === "SUPER_ADMIN"
                      ? "Super Admin"
                      : user.role === "ADMIN"
                        ? "Administrateur"
                        : "Utilisateur"}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date d'inscription</p>
                <p className="text-lg">{format(new Date(user.createdAt), "PPP", { locale: fr })}</p>
              </div>
              
              {user.companyName && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {user.role === "ADMIN" ? "Entreprise gérée" : "Entreprise principale"}
                  </p>
                  <p className="text-lg">{user.companyName}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Entreprises</CardTitle>
              <CardDescription>
                Entreprises auxquelles l'utilisateur appartient
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user.companies || user.companies.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Cet utilisateur n'appartient à aucune entreprise
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {user.companies.map(company => (
                    <li key={company.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {company.id}
                        </p>
                      </div>
                      <Badge variant={company.isActive ? "outline" : "secondary"}>
                        {company.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminRequiredPage>
  )
} 