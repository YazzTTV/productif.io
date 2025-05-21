import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const processes = await prisma.process.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(processes)
  } catch (error) {
    console.error("Erreur lors de la récupération des process:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des process" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { name, description } = await request.json()

    const process = await prisma.process.create({
      data: {
        name,
        description,
        userId: user.id,
      },
    })

    return NextResponse.json(process)
  } catch (error) {
    console.error("Erreur lors de la création du process:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du process" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id, name, description } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "L'ID du processus est requis" },
        { status: 400 }
      )
    }

    // Vérifier que le processus appartient à l'utilisateur
    const existingProcess = await prisma.process.findUnique({
      where: { id }
    })

    if (!existingProcess) {
      return NextResponse.json(
        { error: "Processus non trouvé" },
        { status: 404 }
      )
    }

    if (existingProcess.userId !== user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier ce processus" },
        { status: 403 }
      )
    }

    // Mettre à jour le processus
    const updatedProcess = await prisma.process.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingProcess.name,
        description: description !== undefined ? description : existingProcess.description,
        updatedAt: new Date()
      }
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

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "L'ID du processus est requis" },
        { status: 400 }
      )
    }

    // Vérifier que le processus appartient à l'utilisateur
    const existingProcess = await prisma.process.findUnique({
      where: { id }
    })

    if (!existingProcess) {
      return NextResponse.json(
        { error: "Processus non trouvé" },
        { status: 404 }
      )
    }

    if (existingProcess.userId !== user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à supprimer ce processus" },
        { status: 403 }
      )
    }

    // Dissocier le processus de toutes les tâches associées
    await prisma.task.updateMany({
      where: { processId: id },
      data: { processId: null }
    })

    // Supprimer le processus
    await prisma.process.delete({
      where: { id }
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