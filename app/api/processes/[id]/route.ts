import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/processes/[id] - Récupérer un processus spécifique et ses tâches
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = params

    // Vérifier que le processus appartient à l'utilisateur
    const process = await prisma.process.findUnique({
      where: {
        id,
        userId: user.id
      },
      include: {
        tasks: {
          orderBy: {
            createdAt: "desc"
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        }
      }
    })

    if (!process) {
      return NextResponse.json(
        { error: "Processus non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(process)
  } catch (error) {
    console.error("Erreur lors de la récupération du processus:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du processus" },
      { status: 500 }
    )
  }
}

// PUT /api/processes/[id] - Mettre à jour un processus
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const processId = params.id
    const body = await req.json()
    const { name, description } = body

    // Validation des données
    if (!name) {
      return NextResponse.json(
        { error: "Le nom du processus est requis" },
        { status: 400 }
      )
    }

    // Vérifier que le processus appartient à l'utilisateur
    const existingProcess = await prisma.process.findFirst({
      where: {
        id: processId,
        userId: user.id,
      },
    })

    if (!existingProcess) {
      return NextResponse.json(
        { error: "Processus non trouvé" },
        { status: 404 }
      )
    }

    // Mettre à jour le processus
    const updatedProcess = await prisma.process.update({
      where: {
        id: processId,
      },
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(updatedProcess)
  } catch (error) {
    console.error("Erreur lors de la mise à jour du processus:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du processus" },
      { status: 500 }
    )
  }
}

// DELETE /api/processes/[id] - Supprimer un processus
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const processId = params.id

    // Vérifier que le processus appartient à l'utilisateur
    const existingProcess = await prisma.process.findFirst({
      where: {
        id: processId,
        userId: user.id,
      },
    })

    if (!existingProcess) {
      return NextResponse.json(
        { error: "Processus non trouvé" },
        { status: 404 }
      )
    }

    // Supprimer le processus
    await prisma.process.delete({
      where: {
        id: processId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression du processus:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du processus" },
      { status: 500 }
    )
  }
} 