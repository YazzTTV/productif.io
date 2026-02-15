import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/subjects/[id] - Supprimer une matière
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Ne pas supprimer la matière virtuelle "no-subject"
    if (id === "no-subject") {
      return NextResponse.json(
        { error: "Impossible de supprimer cette matière" },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!subject) {
      return NextResponse.json(
        { error: "Matière non trouvée" },
        { status: 404 }
      )
    }

    // Mettre à null le subjectId des tâches liées avant de supprimer
    await prisma.task.updateMany({
      where: { subjectId: id },
      data: { subjectId: null },
    })

    await prisma.subject.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SUBJECTS_DELETE] Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la matière" },
      { status: 500 }
    )
  }
}
