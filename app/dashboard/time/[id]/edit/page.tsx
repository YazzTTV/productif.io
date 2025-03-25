import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TimeEntryForm } from "@/components/time/time-entry-form"

export default async function EditTimeEntryPage({ params }: { params: { id: string } }) {
  // Vérifier l'authentification côté serveur
  const token = cookies().get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  let user
  try {
    user = verify(token, process.env.JWT_SECRET || "fallback_secret")
  } catch (error) {
    redirect("/login")
  }

  const userId = (user as any).id

  // Récupérer l'entrée de temps
  const timeEntry = await prisma.timeEntry.findUnique({
    where: {
      id: params.id,
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  })

  if (!timeEntry) {
    redirect("/dashboard/time")
  }

  // Vérifier que l'entrée appartient à l'utilisateur
  if (timeEntry.userId !== userId) {
    redirect("/dashboard/time")
  }

  // Récupérer les projets pour le sélecteur
  const projects = await prisma.project.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      name: "asc",
    },
  })

  // Récupérer les tâches pour le sélecteur
  const tasks = await prisma.task.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/time">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au suivi du temps
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modifier l'entrée de temps</h1>
      </div>

      <TimeEntryForm timeEntry={timeEntry} projects={projects} tasks={tasks} />
    </div>
  )
}

