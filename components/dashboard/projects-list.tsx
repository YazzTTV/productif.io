import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, PlusCircle } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string | null
  color: string | null
  _count?: {
    tasks: number
  }
}

interface ProjectsListProps {
  projects: Project[]
}

export function ProjectsList({ projects }: ProjectsListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Projets</CardTitle>
          <Link href="/dashboard/projects/new">
            <Button variant="ghost" size="sm">
              <PlusCircle className="h-4 w-4 mr-1" />
              Nouveau
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-6 text-gray-500">Aucun projet. Créez votre premier projet !</div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: project.color || "#6366F1" }}
                    />
                    <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline">
                      {project.name}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-500">{project._count?.tasks} tâches</div>
                </div>
                {project.description && <p className="text-sm text-gray-500 truncate">{project.description}</p>}
              </div>
            ))}

            <div className="pt-2">
              <Link href="/dashboard/projects">
                <Button variant="ghost" className="w-full justify-between">
                  Voir tous les projets
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

