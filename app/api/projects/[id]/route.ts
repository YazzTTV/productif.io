import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

// Fonction utilitaire pour vérifier l'authentification
async function getAuthUser() {
  const token = cookies().get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret")
    return { id: (decoded as any).id }
  } catch (error) {
    return null
  }
}

// GET /api/projects/[id] - Récupérer un projet spécifique
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      include: {
        tasks: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    // Vérifier que le projet appartient à l'utilisateur
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération du projet" }, { status: 500 })
  }
}

// PATCH /api/projects/[id] - Mettre à jour un projet
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que le projet existe et appartient à l'utilisateur
    const existingProject = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    if (existingProject.userId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { name, description, color } = await req.json()

    const updatedProject = await prisma.project.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        color,
      },
    })

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour du projet" }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Supprimer un projet
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que le projet existe et appartient à l'utilisateur
    const existingProject = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
    }

    if (existingProject.userId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.project.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true, message: "Projet supprimé avec succès" })
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression du projet" }, { status: 500 })
  }
}

