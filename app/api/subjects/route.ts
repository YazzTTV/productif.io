import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
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
    // ou les ajouter à la première matière si elle existe
    let subjectsWithAllTasks = [...subjects]
    
    if (tasksWithoutSubject.length > 0) {
      // Si on a des matières, ajouter les tâches sans matière à la première
      // Sinon, créer une matière virtuelle "Autres tâches"
      if (subjects.length > 0) {
        // Ajouter les tâches sans matière à la première matière
        subjectsWithAllTasks[0] = {
          ...subjectsWithAllTasks[0],
          tasks: [
            ...subjectsWithAllTasks[0].tasks,
            ...tasksWithoutSubject,
          ],
        }
      } else {
        // Créer une matière virtuelle "Autres tâches"
        subjectsWithAllTasks.push({
          id: 'no-subject',
          name: 'Autres tâches',
          coefficient: 1,
          deadline: null,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: tasksWithoutSubject,
        })
      }
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
