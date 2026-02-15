import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer les matières avec leurs tâches
    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      orderBy: { coefficient: 'desc' },
      include: {
        tasks: {
          where: {
            completed: false, // Seulement les tâches non complétées
          },
          orderBy: [
            { priority: 'desc' },
            { order: 'desc' },
          ],
          select: {
            id: true,
            title: true,
            description: true,
            estimatedMinutes: true,
            priority: true,
            completed: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })

    // Récupérer aussi les tâches sans matière (subjectId = null)
    // pour les inclure dans les résultats
    const tasksWithoutSubject = await prisma.task.findMany({
      where: {
        userId: user.id,
        completed: false,
        subjectId: null, // Tâches sans matière
      },
      orderBy: [
        { priority: 'desc' },
        { order: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        estimatedMinutes: true,
        priority: true,
        completed: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Créer une matière virtuelle "Autres tâches" pour les tâches sans matière
    // (ne pas les injecter dans une matière existante pour éviter la confusion)
    let subjectsWithAllTasks = [...subjects]

    if (tasksWithoutSubject.length > 0) {
      subjectsWithAllTasks.push({
        id: 'no-subject',
        name: 'Autres tâches',
        coefficient: 0,
        deadline: null,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: tasksWithoutSubject,
      })
    }

    // Transformer les données pour correspondre au format attendu par le mobile
    const transformedSubjects = subjectsWithAllTasks.map(subject => ({
      ...subject,
      tasks: subject.tasks.map(task => ({
        ...task,
        // Convertir estimatedMinutes en estimatedTime
        estimatedTime: task.estimatedMinutes || 30,
        // Convertir priority (Int) en 'high' | 'medium' | 'low'
        priority: task.priority === null || task.priority === undefined
          ? 'medium'
          : task.priority >= 8
          ? 'high'
          : task.priority >= 5
          ? 'medium'
          : 'low',
      })),
    }))

    return NextResponse.json({ subjects: transformedSubjects })
  } catch (error) {
    console.error("Erreur lors de la récupération des sujets:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sujets" },
      { status: 500 }
    )
  }
}

// POST /api/subjects - Créer une nouvelle matière
export async function POST(req: NextRequest) {
  try {
    console.log("[SUBJECTS_POST] Début de la requête")
    
    const user = await getAuthUserFromRequest(req)
    if (!user) {
      console.log("[SUBJECTS_POST] Utilisateur non authentifié")
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
    
    console.log("[SUBJECTS_POST] Utilisateur authentifié:", user.id)
    
    const body = await req.json()
    const { name, coefficient, deadline } = body
    
    console.log("[SUBJECTS_POST] Données reçues:", { name, coefficient, deadline })
    
    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom de la matière est requis" },
        { status: 400 }
      )
    }
    
    const parsedCoefficient = Number(coefficient)
    const normalizedCoefficient = Number.isFinite(parsedCoefficient)
      ? Math.round(parsedCoefficient)
      : NaN

    if (!Number.isFinite(normalizedCoefficient) || normalizedCoefficient < 1 || normalizedCoefficient > 6) {
      return NextResponse.json(
        { error: "Le coefficient doit être entre 1 et 6" },
        { status: 400 }
      )
    }
    
    // Vérifier si une matière avec le même nom existe déjà pour cet utilisateur
    const existingSubject = await prisma.subject.findFirst({
      where: {
        userId: user.id,
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    })
    
    if (existingSubject) {
      return NextResponse.json(
        { error: "Une matière avec ce nom existe déjà" },
        { status: 400 }
      )
    }
    
    // Créer la matière
    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        coefficient: normalizedCoefficient,
        deadline: deadline ? new Date(deadline) : null,
        userId: user.id,
      },
      include: {
        tasks: {
          where: {
            completed: false,
          },
        },
      },
    })
    
    console.log("[SUBJECTS_POST] Matière créée avec succès:", subject.id)
    
    // Transformer pour correspondre au format attendu par le mobile
    const transformedSubject = {
      ...subject,
      tasks: subject.tasks.map(task => ({
        ...task,
        estimatedTime: task.estimatedMinutes || 30,
        priority: task.priority === null || task.priority === undefined
          ? 'medium'
          : task.priority >= 8
          ? 'high'
          : task.priority >= 5
          ? 'medium'
          : 'low',
      })),
    }
    
    return NextResponse.json(transformedSubject)
  } catch (error) {
    console.error("[SUBJECTS_POST] Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la matière" },
      { status: 500 }
    )
  }
}
