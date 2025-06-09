import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { verifyApiToken } from "@/lib/api-token"
import { prisma } from "@/lib/prisma"

const VALID_TYPES = [
  'tasks', 'habits', 'habit-entries', 'projects', 'missions', 
  'objectives', 'actions', 'processes', 'time-entries',
  'achievements', 'user-achievements'
] as const

type ValidType = typeof VALID_TYPES[number]

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    let userId: string | null = null

    // Vérifier d'abord l'authentification par token API
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = await verifyApiToken(token)
      if (decoded) {
        userId = decoded.userId
      } else {
        return NextResponse.json(
          { error: "Token API invalide ou expiré" }, 
          { status: 401 }
        )
      }
    } else {
      // Sinon, utiliser l'authentification par cookie de session
      const user = await getAuthUser()
      if (!user) {
        return NextResponse.json(
          { error: "Non authentifié" }, 
          { status: 401 }
        )
      }
      userId = user.id
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      )
    }

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" }, 
        { status: 404 }
      )
    }

    const type = params.type as ValidType

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { 
          error: "Type invalide", 
          validTypes: VALID_TYPES,
          receivedType: params.type
        }, 
        { status: 400 }
      )
    }

    let data: any[] = []
    let entityName = ""

    try {
      switch (type) {
        case 'tasks':
          data = await prisma.task.findMany({
            where: { userId: user.id },
            select: { 
              id: true, 
              title: true, 
              completed: true, 
              dueDate: true,
              projectId: true,
              processId: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          })
          entityName = "tâches"
          break

        case 'habits':
          data = await prisma.habit.findMany({
            where: { userId: user.id },
            select: { 
              id: true, 
              name: true, 
              frequency: true,
              daysOfWeek: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          })
          entityName = "habitudes"
          break

        case 'habit-entries':
          // D'abord récupérer les habitudes de l'utilisateur
          const userHabits = await prisma.habit.findMany({
            where: { userId: user.id },
            select: { id: true }
          })
          
          if (userHabits.length > 0) {
            data = await prisma.habitEntry.findMany({
              where: { 
                habitId: { in: userHabits.map(h => h.id) }
              },
              select: {
                id: true,
                habitId: true,
                date: true,
                completed: true,
                rating: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 50 // Limiter car il peut y en avoir beaucoup
            })
          }
          entityName = "entrées d'habitudes"
          break

        case 'projects':
          data = await prisma.project.findMany({
            where: { userId: user.id },
            select: { 
              id: true, 
              name: true, 
              description: true,
              color: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          })
          entityName = "projets"
          break

        case 'missions':
          data = await prisma.mission.findMany({
            where: { userId: user.id },
            select: { 
              id: true, 
              title: true, 
              year: true, 
              quarter: true,
              progress: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          })
          entityName = "missions"
          break

        case 'objectives':
          data = await prisma.objective.findMany({
            where: { 
              mission: { userId: user.id }
            },
            select: { 
              id: true, 
              title: true, 
              missionId: true, 
              progress: true,
              target: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          })
          entityName = "objectifs"
          break

        case 'actions':
          // D'abord récupérer les objectifs de l'utilisateur
          const userObjectives = await prisma.objective.findMany({
            where: { mission: { userId: user.id } },
            select: { id: true }
          })
          
          if (userObjectives.length > 0) {
            data = await prisma.objectiveAction.findMany({
              where: {
                objectiveId: { in: userObjectives.map(o => o.id) }
              },
              select: {
                id: true,
                title: true,
                objectiveId: true,
                progress: true,
                target: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' }
            })
          }
          entityName = "actions d'objectifs"
          break

        case 'processes':
          data = await prisma.process.findMany({
            where: { userId: user.id },
            select: { 
              id: true, 
              name: true, 
              description: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          })
          entityName = "processus"
          break

        case 'time-entries':
          data = await prisma.timeEntry.findMany({
            where: { userId: user.id },
            select: { 
              id: true, 
              description: true, 
              startTime: true,
              endTime: true,
              taskId: true,
              projectId: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 30 // Limiter car il peut y en avoir beaucoup
          })
          entityName = "entrées de temps"
          break

        case 'achievements':
          // Pas besoin de filtrer par utilisateur pour les achievements généraux
          data = await prisma.achievement.findMany({
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              rarity: true,
              points: true,
              createdAt: true
            },
            orderBy: { name: 'asc' }
          })
          entityName = "achievements disponibles"
          break

        case 'user-achievements':
          data = await prisma.userAchievement.findMany({
            where: { userId: user.id },
            include: {
              achievement: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  points: true
                }
              }
            },
            orderBy: { unlockedAt: 'desc' }
          })
          entityName = "achievements débloqués"
          break

        default:
          return NextResponse.json(
            { error: "Type non implémenté", type }, 
            { status: 400 }
          )
      }
    } catch (queryError: any) {
      console.error(`Erreur lors de la requête pour ${type}:`, queryError)
      return NextResponse.json(
        { 
          error: `Erreur lors de la requête ${type}`, 
          details: queryError.message,
          type 
        },
        { status: 500 }
      )
    }

    const response = {
      type,
      entityName,
      count: data.length,
      ids: data.map((item: any) => item.id),
      items: data,
      
      // Statistiques utiles
      stats: {
        total: data.length,
        ...(type === 'tasks' && {
          completed: data.filter((item: any) => item.completed).length,
          incomplete: data.filter((item: any) => !item.completed).length
        }),
        ...(type === 'habit-entries' && {
          completed: data.filter((item: any) => item.completed).length,
          incomplete: data.filter((item: any) => !item.completed).length
        })
      },
      
      meta: {
        timestamp: new Date().toISOString(),
        userId: user.id,
        requestedType: type,
        authMethod: authHeader ? 'api-token' : 'session-cookie',
        success: true
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error(`Erreur générale lors de la récupération des IDs ${params.type}:`, error)
    return NextResponse.json(
      { 
        error: `Erreur lors de la récupération des IDs ${params.type}`,
        details: error.message,
        type: params.type,
        success: false
      },
      { status: 500 }
    )
  }
} 