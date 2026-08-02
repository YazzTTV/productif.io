import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTaskOrder, priorityIntToLabel } from "@/lib/tasks"

// Garde-fous : une saisie collée peut contenir n'importe quoi, et cette route
// crée en masse. Sans plafond, un copier-coller d'un poly entier crée des
// milliers de lignes et rend l'écran Matières inutilisable.
const MAX_TITLES_PER_CALL = 200
const MAX_TITLE_LENGTH = 200

// POST /api/subjects/[id]/tasks/bulk - Créer plusieurs chapitres d'un coup
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // "no-subject" est une matière virtuelle construite dans GET /api/subjects,
    // elle n'existe pas en base.
    if (id === "no-subject") {
      return NextResponse.json(
        { error: "Impossible d'ajouter des chapitres dans cette matière" },
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
    const { titles, estimatedMinutes, priority } = body

    if (!Array.isArray(titles)) {
      return NextResponse.json(
        { error: "Le champ titles doit être une liste" },
        { status: 400 }
      )
    }

    // Nettoyage : lignes vides, puces collées depuis un PDF, doublons.
    const seen = new Set<string>()
    const cleanedTitles: string[] = []

    for (const raw of titles) {
      if (typeof raw !== "string") continue

      const cleaned = raw
        .replace(/^\s*(?:[-*•–—]|\d+[.)])\s*/, "") // puces et numérotation
        .trim()
        .slice(0, MAX_TITLE_LENGTH)

      if (!cleaned) continue

      const key = cleaned.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)

      cleanedTitles.push(cleaned)
    }

    if (cleanedTitles.length === 0) {
      return NextResponse.json(
        { error: "Aucun chapitre valide dans la liste" },
        { status: 400 }
      )
    }

    if (cleanedTitles.length > MAX_TITLES_PER_CALL) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TITLES_PER_CALL} chapitres par import` },
        { status: 400 }
      )
    }

    // Ne pas recréer un chapitre déjà présent dans la matière : l'import est
    // typiquement rejoué après une correction de la liste collée.
    const existing = await prisma.task.findMany({
      where: { subjectId: id, userId: user.id },
      select: { title: true },
    })
    const existingTitles = new Set(existing.map(t => t.title.trim().toLowerCase()))

    const titlesToCreate = cleanedTitles.filter(
      title => !existingTitles.has(title.toLowerCase())
    )
    const skippedCount = cleanedTitles.length - titlesToCreate.length

    if (titlesToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        createdCount: 0,
        skippedCount,
        tasks: [],
      })
    }

    const normalizedPriority =
      typeof priority === "number" && priority >= 0 && priority <= 4
        ? priority
        : 3 // medium, aligné sur le priorityMap du mobile

    const normalizedEstimatedMinutes =
      typeof estimatedMinutes === "number" &&
      estimatedMinutes > 0 &&
      estimatedMinutes <= 24 * 60
        ? Math.round(estimatedMinutes)
        : 30

    const order = calculateTaskOrder(`P${normalizedPriority}`, "Moyen")

    await prisma.task.createMany({
      data: titlesToCreate.map(title => ({
        title,
        description: "",
        priority: normalizedPriority,
        estimatedMinutes: normalizedEstimatedMinutes,
        subjectId: id,
        userId: user.id,
        completed: false,
        order,
      })),
    })

    // createMany ne retourne pas les lignes créées : on relit pour que le mobile
    // puisse afficher les chapitres sans un aller-retour supplémentaire.
    const createdTasks = await prisma.task.findMany({
      where: {
        subjectId: id,
        userId: user.id,
        title: { in: titlesToCreate },
      },
      select: {
        id: true,
        title: true,
        estimatedMinutes: true,
        priority: true,
        completed: true,
        dueDate: true,
      },
    })

    return NextResponse.json({
      success: true,
      createdCount: createdTasks.length,
      skippedCount,
      tasks: createdTasks.map(task => ({
        ...task,
        estimatedTime: task.estimatedMinutes || 30,
        priority: priorityIntToLabel(task.priority),
      })),
    })
  } catch (error) {
    console.error("[SUBJECTS_TASKS_BULK_POST] Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'import des chapitres" },
      { status: 500 }
    )
  }
}
