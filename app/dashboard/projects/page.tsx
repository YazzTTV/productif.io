import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ProjectsGrid } from "@/components/projects/projects-grid"
import { getAuthUser } from "@/lib/auth"

export default async function ProjectsPage() {
  // Vérifier l'authentification côté serveur
  const user = await getAuthUser()
  
  if (!user) {
    redirect("/login")
  }

  // Récupérer les projets de l'utilisateur
  const userId = user.id

  const projects = await prisma.project.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projets</h1>
          <p className="text-gray-600 mt-1">Gérez tous vos projets</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </Link>
      </div>

      <ProjectsGrid projects={projects} />
    </div>
  )
}

