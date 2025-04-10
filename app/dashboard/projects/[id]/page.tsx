import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { getAuthUser } from "@/lib/auth"
import { ArrowLeft, Pencil, Calendar, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface PageProps {
  params: {
    id: string
  }
}

export default async function ProjectDetailsPage({ params }: PageProps) {
  // Vérifier l'authentification côté serveur
  const user = await getAuthUser()
  
  if (!user) {
    redirect("/login")
  }

  // Récupérer les détails du projet
  const project = await prisma.project.findUnique({
    where: {
      id: params.id,
      userId: user.id, // Sécurité pour s'assurer que le projet appartient à l'utilisateur
    },
    include: {
      tasks: {
        orderBy: {
          completed: "asc",
        },
      },
    },
  })

  // Si le projet n'existe pas ou n'appartient pas à l'utilisateur
  if (!project) {
    notFound()
  }

  // Calculer les statistiques du projet
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(task => task.completed).length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
          <div 
            className="w-3 h-3 rounded-full ml-3" 
            style={{ backgroundColor: project.color || "#6366F1" }} 
          />
        </div>
        <div className="ml-auto mt-2 sm:mt-0">
          <Link href={`/dashboard/projects/${project.id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 mb-6">{project.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total des tâches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tâches terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Tâches</h2>
        
        {project.tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">Aucune tâche dans ce projet</p>
            <div className="mt-4">
              <Link href="/dashboard/tasks/new">
                <Button>Créer une tâche</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {project.tasks.map((task) => (
              <div 
                key={task.id} 
                className={`p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.completed ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${
                      task.completed ? "bg-green-100 text-green-600" : "border border-gray-300"
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${task.completed ? "text-gray-500 line-through" : ""}`}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>
                          {format(new Date(task.dueDate), "d MMMM yyyy", { locale: fr })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-8 sm:ml-0">
                  {task.priority !== null && (
                    <Badge
                      variant="outline"
                      className={`
                        ${task.priority === 2 ? "border-red-500 text-red-500" : ""}
                        ${task.priority === 1 ? "border-yellow-500 text-yellow-500" : ""}
                        ${task.priority === 0 ? "border-blue-500 text-blue-500" : ""}
                      `}
                    >
                      {task.priority === 2 ? "Haute" : ""}
                      {task.priority === 1 ? "Moyenne" : ""}
                      {task.priority === 0 ? "Basse" : ""}
                    </Badge>
                  )}
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    <Button variant="ghost" size="sm">Voir</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 