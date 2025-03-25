"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Building2, Users, UserPlus, PencilLine, Trash2 } from "lucide-react"
import Link from "next/link"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function CompanyDetailsPage() {
  const params = useParams()
  const companyId = params.id as string
  const { toast } = useToast()
  const router = useRouter()
  
  const [company, setCompany] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isStatusChanging, setIsStatusChanging] = useState<string | null>(null)
  const [isRoleChanging, setIsRoleChanging] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        // Récupérer les informations de l'utilisateur connecté
        const meResponse = await fetch("/api/auth/me");
        let userInfo = null;
        if (meResponse.ok) {
          const userData = await meResponse.json();
          userInfo = userData.user;
          console.log("Informations utilisateur:", userInfo);
        }
        
        // Appeler l'API pour récupérer les détails de l'entreprise
        const companyResponse = await fetch(`/api/companies/${companyId}`);
        
        if (!companyResponse.ok) {
          const errorData = await companyResponse.json().catch(() => ({}));
          console.error("Erreur API compagnie:", companyResponse.status, errorData);
          
          let errorMessage = "Impossible de récupérer les détails de l'entreprise";
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
          if (errorData.details) {
            errorMessage += ` (${errorData.details})`;
          }
          
          throw new Error(errorMessage);
        }
        
        const companyData = await companyResponse.json();
        setCompany(companyData.company);
        
        // Récupérer les utilisateurs de l'entreprise
        const usersResponse = await fetch(`/api/companies/${companyId}/users`);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users || []);
        } else {
          console.warn("Impossible de récupérer les utilisateurs de l'entreprise");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des détails de l'entreprise:", error);
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Impossible de récupérer les détails de l'entreprise",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      fetchCompanyDetails();
    }
  }, [companyId, toast]);

  const handleRemoveUser = async (userId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir retirer cet utilisateur de l'entreprise ?")) {
      setIsRemoving(userId)
      
      try {
        const response = await fetch(`/api/companies/${companyId}/users/${userId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          toast({
            title: "Utilisateur retiré",
            description: "L'utilisateur a été retiré de l'entreprise avec succès",
            variant: "default"
          })
          // Mettre à jour la liste des utilisateurs localement
          setUsers(users.filter(user => user.id !== userId))
        } else {
          const error = await response.json()
          throw new Error(error.error || "Une erreur est survenue")
        }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue lors du retrait de l'utilisateur",
          variant: "destructive"
        })
      } finally {
        setIsRemoving(null)
      }
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setIsStatusChanging(userId)
    
    try {
      const response = await fetch(`/api/companies/${companyId}/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        toast({
          title: "Statut modifié",
          description: `L'utilisateur a été ${!currentStatus ? 'activé' : 'désactivé'} avec succès`,
          variant: "default"
        })
        // Mettre à jour le statut de l'utilisateur localement
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isActive: !currentStatus } 
            : user
        ))
      } else {
        const error = await response.json()
        throw new Error(error.error || "Une erreur est survenue")
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification du statut",
        variant: "destructive"
      })
    } finally {
      setIsStatusChanging(null)
    }
  }

  const handleToggleRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    setIsRoleChanging(userId)
    
    try {
      const response = await fetch(`/api/companies/${companyId}/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isAdmin: !isCurrentlyAdmin
        })
      })

      if (response.ok) {
        toast({
          title: "Rôle modifié",
          description: `L'utilisateur est maintenant ${!isCurrentlyAdmin ? 'administrateur' : 'membre standard'} de l'entreprise`,
          variant: "default"
        })
        // Mettre à jour le rôle de l'utilisateur localement
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, role: !isCurrentlyAdmin ? 'ADMIN' : 'USER' } 
            : user
        ))
      } else {
        const error = await response.json()
        throw new Error(error.error || "Une erreur est survenue")
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification du rôle",
        variant: "destructive"
      })
    } finally {
      setIsRoleChanging(null)
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
        <Link href="/dashboard/admin/companies" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Retour à la liste des entreprises
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4">
              {company.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="h-12 w-12 rounded-md object-cover" 
                />
              ) : (
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground">
                Créée le {format(new Date(company.createdAt), "PPP", { locale: fr })}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/admin/companies/${companyId}/edit`}>
                <PencilLine className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </Button>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
      
      {company.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{company.description}</p>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              <CardTitle>Membres de l'entreprise</CardTitle>
            </div>
            <CardDescription>
              {users.length} membre{users.length > 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/admin/companies/${companyId}/users/add`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter un membre
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/admin/companies/${companyId}/users/invite`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Inviter un utilisateur
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucun membre</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Commencez par ajouter des membres à cette entreprise
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>A rejoint le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "Sans nom"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role === "ADMIN" ? "Administrateur" : "Membre"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "outline" : "secondary"}>
                        {user.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.joinedAt ? format(new Date(user.joinedAt), "PPP", { locale: fr }) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRole(user.id, user.role === "ADMIN")}
                          disabled={isRoleChanging === user.id}
                        >
                          {isRoleChanging === user.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                              Modification...
                            </>
                          ) : (
                            user.role === "ADMIN" ? "Retirer admin" : "Faire admin"
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link href={`/dashboard/admin/users/${user.id}/edit`}>
                            Modifier
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          disabled={isStatusChanging === user.id}
                        >
                          {isStatusChanging === user.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                              Modification...
                            </>
                          ) : (
                            user.isActive ? "Désactiver" : "Activer"
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={isRemoving === user.id}
                        >
                          {isRemoving === user.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                              Retrait...
                            </>
                          ) : (
                            "Retirer"
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminRequiredPage>
  )
} 