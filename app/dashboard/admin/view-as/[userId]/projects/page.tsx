"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Briefcase, CheckSquare, Clock, Info, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  totalTasks: number
  completedTasks: number
  progress: number
}

export default function ViewUserProjectsPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer les informations de l'utilisateur
        const userResponse = await fetch(`/api/users/${userId}`)
        if (!userResponse.ok) {
          throw new Error("Impossible de récupérer les informations de l'utilisateur")
        }
        const userData = await userResponse.json()
        setUserData(userData.user)
        
        // Récupérer les projets de l'utilisateur
        const projectsResponse = await fetch(`/api/users/${userId}/projects`)
        if (!projectsResponse.ok) {
          throw new Error("Impossible de récupérer les projets de l'utilisateur")
        }
        const projectsData = await projectsResponse.json()
        setProjects(projectsData.projects || [])
        
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
        setError("Impossible de récupérer les données de l'utilisateur")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [userId])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  // Statistiques sur les projets
  const totalProjects = projects.length
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length
  const inProgressProjects = projects.filter(p => p.status === "IN_PROGRESS").length
  const notStartedProjects = projects.filter(p => p.status === "NOT_STARTED").length
  
  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>
      case "IN_PROGRESS":
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
      case "NOT_STARTED":
        return <Badge className="bg-slate-100 text-slate-800">Non démarré</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-800">{status}</Badge>
    }
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Projets de {userData?.name || userData?.email || "l'utilisateur"}
      </h1>
      <p className="text-muted-foreground mb-6">
        Suivi des projets et de leur avancement
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Projets au total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Terminés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Projets terminés
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressProjects}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Projets en cours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Non démarrés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notStartedProjects}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Projets à démarrer
            </p>
          </CardContent>
        </Card>
      </div>
      
      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucun projet n'a été créé
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(project => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Créé le {format(new Date(project.createdAt), "d MMMM yyyy", { locale: fr })}
                    </CardDescription>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {project.description && (
                  <p className="text-sm mb-4">{project.description}</p>
                )}
                
                <div className="mt-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckSquare className="h-4 w-4 mr-1" />
                  <span>{project.completedTasks}/{project.totalTasks} tâches</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Mis à jour {format(new Date(project.updatedAt), "d MMM", { locale: fr })}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 