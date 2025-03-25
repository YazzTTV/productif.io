import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ProjectsGrid } from "@/components/projects/projects-grid"

export default async function ProjectsPage() {
  // Vérifier l'authentification côté serveur
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  let user
  try {
    user = verify(token, process.env.JWT_SECRET || "fallback_secret")
  } catch (error) {
    redirect("/login")
  }

  // Récupérer les projets de l'utilisateur
  const userId = (user as any).id

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projets</h1>
          <p className="text-gray-600 mt-1">Gérez tous vos projets</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </Link>
      </div>

      <ProjectsGrid projects={projects} />
    </div>
  )
}

