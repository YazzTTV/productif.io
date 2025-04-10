import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import { ProjectForm } from "@/components/projects/project-form"

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditProjectPage({ params }: PageProps) {
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
  })

  // Si le projet n'existe pas ou n'appartient pas à l'utilisateur
  if (!project) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier le projet</h1>
      <ProjectForm project={project} />
    </div>
  )
} 