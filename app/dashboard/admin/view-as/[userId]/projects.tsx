"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Folder, Loader2, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

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

export default function ProjectsPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${userId}/projects`)
        if (!response.ok) {
          throw new Error("Impossible de récupérer les projets")
        }
        const data = await response.json()
        setProjects(data.projects || [])
      } catch (error) {
        console.error("Erreur lors de la récupération des projets:", error)
        setError("Impossible de récupérer les projets de l'utilisateur")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProjects()
  }, [userId])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
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
  
  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <Folder className="h-24 w-24 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Aucun projet trouvé</h2>
        <p className="text-muted-foreground">
          Cet utilisateur n'a pas encore créé de projets
        </p>
      </div>
    )
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Projets de l'utilisateur</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(project => (
          <Card key={project.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{project.name}</CardTitle>
                <Badge 
                  className={
                    project.status === "COMPLETED" ? "bg-green-100 text-green-800 hover:bg-green-200" : 
                    project.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : 
                    "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }
                >
                  {project.status === "COMPLETED" ? "Terminé" : 
                   project.status === "IN_PROGRESS" ? "En cours" : 
                   "Non démarré"}
                </Badge>
              </div>
              <CardDescription>
                {project.description || "Aucune description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Progression</p>
                  <div className="flex items-center">
                    <Progress value={project.progress} className="mr-2" />
                    <span className="text-sm">{project.progress}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm pt-2">
                  <div>
                    <p className="text-muted-foreground">Tâches</p>
                    <p className="font-medium">{project.completedTasks}/{project.totalTasks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Créé le</p>
                    <p className="font-medium">
                      {format(new Date(project.createdAt), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mis à jour</p>
                    <p className="font-medium">
                      {format(new Date(project.updatedAt), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 