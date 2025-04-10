"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, FolderKanban, PlusCircle } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string | null
  color: string | null
  _count: {
    tasks: number
  }
}

interface ProjectsGridProps {
  projects: Project[]
}

export function ProjectsGrid({ projects: initialProjects }: ProjectsGridProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  async function deleteProject(projectId: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du projet")
      }

      // Mettre à jour l'état local
      setProjects(projects.filter((project) => project.id !== projectId))
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {projects.length === 0 ? (
        <div className="col-span-full text-center py-10 sm:py-12 bg-white rounded-lg border">
          <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FolderKanban className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Aucun projet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Vous n'avez pas encore créé de projet. Les projets vous aident à organiser vos tâches.
          </p>
          <div className="mt-6">
            <Link href="/dashboard/projects/new">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        projects.map((project) => (
          <Card key={project.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: project.color || "#6366F1" }} />
                  <CardTitle className="truncate">{project.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteProject(project.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {project.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
              )}
            </CardHeader>
            <CardContent className="pb-3 flex-grow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">{project._count.tasks} tâches</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                Voir les détails
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}

