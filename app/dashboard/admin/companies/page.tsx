"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminRequiredPage } from "@/components/auth/admin-required"
import { useToast } from "@/components/ui/use-toast"
import { Building2, PlusCircle, User, Users } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function CompaniesAdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer les informations de l'utilisateur connecté
        const meResponse = await fetch("/api/auth/me");
        let userInfo = null;
        if (meResponse.ok) {
          const userData = await meResponse.json();
          userInfo = userData.user;
          console.log("Informations utilisateur:", userInfo);
          console.log("Entreprises de l'utilisateur:", userData.companies);
        }
        
        const response = await fetch("/api/companies")
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Erreur API:", response.status, errorData);
          
          let errorMessage = "Impossible de récupérer la liste des entreprises";
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
          if (errorData.details) {
            errorMessage += ` (${errorData.details})`;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json()
        console.log("Entreprises récupérées:", data.companies);
        setCompanies(data.companies || [])
      } catch (error) {
        console.error("Erreur lors de la récupération des entreprises:", error)
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Impossible de récupérer la liste des entreprises",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCompanies()
  }, [toast])

  return (
    <AdminRequiredPage>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Entreprises</h1>
          <p className="text-muted-foreground">Gérez les entreprises et leurs membres</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/companies/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une entreprise
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-primary" />
              <CardTitle>Liste des entreprises</CardTitle>
            </div>
            <CardDescription>
              {companies.length} entreprise{companies.length > 1 ? "s" : ""} au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aucune entreprise</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Commencez par ajouter une entreprise en cliquant sur le bouton ci-dessus
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Création</TableHead>
                    <TableHead>Membres</TableHead>
                    <TableHead>Administrateurs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {company.logo ? (
                            <img 
                              src={company.logo} 
                              alt={company.name} 
                              className="h-8 w-8 rounded-md object-cover mr-3" 
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{company.name}</p>
                            {company.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {company.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(company.createdAt), "PPP", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{company.userCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{company.adminCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/admin/companies/${company.id}`)}
                        >
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRequiredPage>
  )
} 