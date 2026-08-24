import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { priorityIntToLabel } from "@/lib/tasks"

// PATCH /api/subjects/[id] - Modifier une matière (nom, coefficient, date d'examen)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // "no-subject" est une matière virtuelle construite par GET /api/subjects
    // pour regrouper les tâches sans matière : elle n'existe pas en base.
    if (id === "no-subject") {
      return NextResponse.json(
        { error: "Impossible de modifier cette matière" },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.findFirst({
      where: { id, userId: user.id },
    })

    if (!subject) {
      return NextResponse.json({ error: "Matière non trouvée" }, { status: 404 })
    }

    const body = await req.json()
    const data: { name?: string; coefficient?: number; deadline?: Date | null } = {}

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { error: "Le nom de la matière est requis" },
          { status: 400 }
        )
      }

      const name = body.name.trim()

      // Doublon de nom, en excluant la matière elle-même pour qu'un
      // renommage qui ne change que la casse reste possible.
      const duplicate = await prisma.subject.findFirst({
        where: {
          userId: user.id,
          id: { not: id },
          name: { equals: name, mode: "insensitive" },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "Une matière avec ce nom existe déjà" },
          { status: 400 }
        )
      }

      data.name = name
    }

    if (body.coefficient !== undefined) {
      const parsed = Number(body.coefficient)
      const normalized = Number.isFinite(parsed) ? Math.round(parsed) : NaN

      if (!Number.isFinite(normalized) || normalized < 1 || normalized > 6) {
        return NextResponse.json(
          { error: "Le coefficient doit être entre 1 et 6" },
          { status: 400 }
        )
      }

      data.coefficient = normalized
    }

    if (body.deadline !== undefined) {
      if (body.deadline === null) {
        data.deadline = null
      } else {
        const deadline = new Date(body.deadline)
        if (Number.isNaN(deadline.getTime())) {
          return NextResponse.json(
            { error: "La date d'examen est invalide" },
            { status: 400 }
          )
        }
        data.deadline = deadline
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification fournie" },
        { status: 400 }
      )
    }

    const updated = await prisma.subject.update({
      where: { id },
      data,
      include: {
        tasks: {
          where: { completed: false },
        },
      },
    })

    // Même forme de retour que POST /api/subjects, le mobile attend
    // estimatedTime et une priorité en libellé.
    return NextResponse.json({
      ...updated,
      tasks: updated.tasks.map(task => ({
        ...task,
        estimatedTime: task.estimatedMinutes || 30,
        priority: priorityIntToLabel(task.priority),
      })),
    })
  } catch (error) {
    console.error("[SUBJECTS_PATCH] Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la modification de la matière" },
      { status: 500 }
    )
  }
}

// DELETE /api/subjects/[id] - Supprimer une matière
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
