import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { verifyApiToken } from "@/lib/api-token"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

// Types pour les entreprises
interface Company {
  id: string
  name: string
}

interface UserCompany {
  company: Company
  role: UserRole
  isActive: boolean
}

interface UserWithCompanies {
  id: string
  name: string | null
  email: string
  companies: UserCompany[]
}

const VALID_TYPES = [
  'tasks', 'habits', 'habit-entries', 'projects', 'missions', 
  'objectives', 'actions', 'processes', 'time-entries',
  'achievements', 'user-achievements', 'user-team'
] as const

type ValidType = typeof VALID_TYPES[number]

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type as ValidType
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { 
          error: `Type invalide: ${type}`,
          validTypes: VALID_TYPES
        },
        { status: 400 }
      )
    }

    // Authentification de l'utilisateur
    let userId: string | null = null
    let authMethod = 'session-cookie'

    // Vérifier d'abord l'authentification par token API
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = await verifyApiToken(token)
      if (decoded) {
        userId = decoded.userId
        authMethod = 'api-token'
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

    let data: any[] = []
    let entityName: ValidType = type

    // Récupération des données selon le type
    if (type === 'user-team') {
      // Récupérer l'utilisateur avec ses informations d'entreprise
      const userWithCompanies = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          companies: {
            include: {
              company: true
            }
          }
        }
      })

      if (!userWithCompanies) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        )
      }

      // Formater les données pour inclure l'utilisateur et ses entreprises
      data = [{
        user: {
          id: userWithCompanies.id,
          name: userWithCompanies.name,
          email: userWithCompanies.email
        },
        companies: userWithCompanies.companies.map(userCompany => ({
          id: userCompany.company.id,
          name: userCompany.company.name,
          role: userCompany.isActive ? 'ACTIVE' : 'INACTIVE'
        }))
      }]
    } else {
      switch (type) {
        case 'tasks':
          data = await prisma.task.findMany({
            where: { userId },
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
          break

        case 'habits':
          data = await prisma.habit.findMany({
            where: { userId },
            select: { 
              id: true, 
              name: true, 
              frequency: true,
              daysOfWeek: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          })
          break

        case 'habit-entries':
          const userHabits = await prisma.habit.findMany({
            where: { userId },
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
              take: 50
            })
          }
          break

        case 'projects':
          data = await prisma.project.findMany({
            where: { userId },
            select: { 
              id: true, 
              name: true, 
              description: true,
              color: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          })
          break

        case 'missions':
          data = await prisma.mission.findMany({
            where: { userId },
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
          break

        case 'objectives':
          data = await prisma.objective.findMany({
            where: { 
              mission: { userId }
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
          break

        case 'actions':
          const userObjectives = await prisma.objective.findMany({
            where: { mission: { userId } },
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
          break

        case 'processes':
          data = await prisma.process.findMany({
            where: { userId },
            select: { 
              id: true, 
              name: true, 
              description: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          })
          break

        case 'time-entries':
          data = await prisma.timeEntry.findMany({
            where: { userId },
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
            take: 30
          })
          break

        case 'achievements':
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
          break

        case 'user-achievements':
          data = await prisma.userAchievement.findMany({
            where: { userId },
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
          break

        default:
          return NextResponse.json(
            { error: "Type non implémenté", type }, 
            { status: 400 }
          )
      }
    }

    const response = {
      type,
      entityName,
      count: data.length,
      ids: type === 'user-team' 
        ? {
            userId: data[0]?.user?.id,
            companyIds: data[0]?.companies?.map((c: { id: string }) => c.id) || []
          }
        : data.map((item: any) => item.id),
      items: data,
      
      meta: {
        timestamp: new Date().toISOString(),
        userId,
        requestedType: type,
        authMethod,
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