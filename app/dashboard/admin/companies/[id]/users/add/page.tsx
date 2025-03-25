"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Building2, UserPlus, Search } from "lucide-react"
import Link from "next/link"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function AddUsersToCompanyPage() {
  const params = useParams()
  const companyId = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  
  const [company, setCompany] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les détails de l'entreprise
        const companyResponse = await fetch(`/api/companies/${companyId}`)
        if (!companyResponse.ok) {
          throw new Error("Impossible de récupérer les détails de l'entreprise")
        }
        const companyData = await companyResponse.json()
        setCompany(companyData.company)
        
        // Récupérer les utilisateurs existants de l'entreprise
        const companyUsersResponse = await fetch(`/api/companies/${companyId}/users`)
        let companyUsers: any[] = []
        if (companyUsersResponse.ok) {
          const companyUsersData = await companyUsersResponse.json()
          companyUsers = companyUsersData.users || []
        }
        
        // Récupérer tous les utilisateurs pour sélection
        const usersResponse = await fetch(`/api/users`)
        if (!usersResponse.ok) {
          throw new Error("Impossible de récupérer la liste des utilisateurs")
        }
        const usersData = await usersResponse.json()
        
        // Filtrer pour n'afficher que les utilisateurs qui ne sont pas déjà dans l'entreprise
        const companyUserIds = new Set(companyUsers.map((u: any) => u.id))
        const availableUsers = usersData.users.filter((u: any) => !companyUserIds.has(u.id))
        
        setUsers(availableUsers)
        setFilteredUsers(availableUsers)
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les données nécessaires",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (companyId) {
      fetchData()
    }
  }, [companyId, toast])

  useEffect(() => {
    // Filtrer les utilisateurs basés sur la recherche
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const lowerQuery = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          user => 
            (user.name && user.name.toLowerCase().includes(lowerQuery)) || 
            user.email.toLowerCase().includes(lowerQuery)
        )
      )
    }
  }, [searchQuery, users])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUserId) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner un utilisateur à ajouter",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/companies/${companyId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: selectedUserId
        })
      })

      if (response.ok) {
        toast({
          title: "Utilisateur ajouté",
          description: "L'utilisateur a été ajouté à l'entreprise avec succès",
          variant: "default"
        })
        router.push(`/dashboard/admin/companies/${companyId}`)
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Une erreur est survenue")
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout de l'utilisateur",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
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

  if (!company) {
    return (
      <AdminRequiredPage>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold">Entreprise non trouvée</h2>
          <p className="mt-2 text-muted-foreground">
            L'entreprise demandée n'existe pas ou vous n'avez pas les permissions nécessaires.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/admin/companies">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Retour à la liste des entreprises
            </Link>
          </Button>
        </div>
      </AdminRequiredPage>
    )
  }

  return (
    <AdminRequiredPage>
      <div className="mb-6">
        <Link href={`/dashboard/admin/companies/${companyId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Retour aux détails de l'entreprise
        </Link>
        <div className="flex items-center">
          <div className="mr-2">
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={company.name} 
                className="h-8 w-8 rounded-md object-cover" 
              />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              Ajouter des membres à {company.name}
            </h1>
            <p className="text-muted-foreground">Sélectionnez les utilisateurs à ajouter à cette entreprise</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <CardTitle>Ajouter un utilisateur</CardTitle>
          </div>
          <CardDescription>
            Recherchez et sélectionnez un utilisateur à ajouter à cette entreprise
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur par nom ou email"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {filteredUsers.length === 0 ? (
              <div className="bg-muted/50 rounded-md p-6 text-center">
                <p className="text-muted-foreground">Aucun utilisateur trouvé. Tous les utilisateurs ont déjà été ajoutés ou votre recherche ne correspond à aucun utilisateur.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Sélection</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <RadioGroup value={selectedUserId || ""} onValueChange={setSelectedUserId}>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <RadioGroupItem value={user.id} id={`user-${user.id}`} className="mx-auto" />
                          </TableCell>
                          <TableCell>
                            <Label htmlFor={`user-${user.id}`} className="cursor-pointer font-medium">
                              {user.name || <span className="text-muted-foreground italic">Sans nom</span>}
                            </Label>
                          </TableCell>
                          <TableCell>
                            <Label htmlFor={`user-${user.id}`} className="cursor-pointer">
                              {user.email}
                            </Label>
                          </TableCell>
                          <TableCell>
                            <Label htmlFor={`user-${user.id}`} className="cursor-pointer">
                              {user.role === "SUPER_ADMIN" ? "Super Admin" : 
                               user.role === "ADMIN" ? "Administrateur" : "Utilisateur"}
                            </Label>
                          </TableCell>
                        </TableRow>
                      ))}
                    </RadioGroup>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => router.push(`/dashboard/admin/companies/${companyId}`)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedUserId || filteredUsers.length === 0}
            >
              {isSubmitting ? "Ajout en cours..." : "Ajouter à l'entreprise"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AdminRequiredPage>
  )
} 