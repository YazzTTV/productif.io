import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTaskOrder } from "@/lib/tasks"
import { verify } from "jsonwebtoken"

// Fonction utilitaire pour vérifier l'authentification
const JWT_SECRET = process.env.JWT_SECRET || "un_secret_tres_securise_pour_jwt_tokens"

async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verifyToken(token)
    return { id: (decoded as any).id }
  } catch {
    return null
  }
}

// GET /api/tasks - Récupérer toutes les tâches de l'utilisateur
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return new Response("Non authentifié", { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return new Response("Non authentifié", { status: 401 })
    }

    const userId = decoded.userId
    
    // Récupérer les informations de l'utilisateur
    const userInfo = await prisma.$queryRaw`
      SELECT 
        "role", 
        "managedCompanyId",
        "name",
        "email"
      FROM "User" 
      WHERE "id" = ${userId}
    `
    
    const userRole = userInfo?.[0]?.role
    const companyId = userInfo?.[0]?.managedCompanyId
    
    // Récupérer le paramètre de requête companyId
    const { searchParams } = new URL(request.url)
    const companyIdParam = searchParams.get('companyId')

    // Déterminer si on doit filtrer par entreprise
    let shouldFilterByCompany = false
    let targetCompanyId = null
    
    // Si l'utilisateur est ADMIN ou SUPER_ADMIN et qu'un ID d'entreprise est spécifié
    if ((userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')) {
      if (companyIdParam && companyIdParam.trim() !== '') {
        // Utiliser l'ID d'entreprise spécifié dans la requête
        shouldFilterByCompany = true
        targetCompanyId = companyIdParam
      } else if (companyId) {
        // Par défaut, utiliser l'entreprise que l'admin gère
        shouldFilterByCompany = true
        targetCompanyId = companyId
      }
    }
    
    if (shouldFilterByCompany && targetCompanyId) {
      // Récupérer les utilisateurs de l'entreprise
      const companyUsers = await prisma.$queryRaw`
        SELECT 
          uc."userId",
          u."name",
          u."email"
        FROM "UserCompany" uc
        JOIN "User" u ON uc."userId" = u."id"
        WHERE uc."companyId" = ${targetCompanyId}
      `
      
      const userIds = Array.isArray(companyUsers) ? companyUsers.map((user: any) => user.userId) : []
      
      if (userIds.length > 0) {
        // Récupérer les tâches pour tous les utilisateurs de l'entreprise
        const tasks = await prisma.task.findMany({
          where: {
            userId: { in: userIds }
          },
          orderBy: [
            { order: 'desc' }
          ],
          include: {
            project: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        })
        
        // Ajouter les informations de l'utilisateur à chaque tâche
        const tasksWithUserInfo = tasks.map(task => {
          const user = companyUsers.find((u: any) => u.userId === task.userId)
          return {
            ...task,
            userName: user ? user.name : null,
            userEmail: user ? user.email : 'Inconnu'
          }
        })
        
        return NextResponse.json({ 
          tasks: tasksWithUserInfo,
          isCompanyFiltered: true,
          companyId: targetCompanyId
        })
      }
    }
    
    // Par défaut, récupérer uniquement les tâches de l'utilisateur
    const tasks = await prisma.task.findMany({
      where: {
        userId
      },
      orderBy: [
        { order: 'desc' }
      ],
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })
    
    return NextResponse.json({ 
      tasks,
      isCompanyFiltered: false
    })
  } catch (error) {
    console.error("[TASKS_GET]", error)
    return new Response("Erreur interne du serveur", { status: 500 })
  }
}

// POST /api/tasks - Créer une nouvelle tâche
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return new Response("Non authentifié", { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return new Response("Non authentifié", { status: 401 })
    }

    const authUserId = decoded.userId
    
    // Récupérer le body de la requête
    const { title, description, priority, energyLevel, dueDate, projectId, userId } = await request.json()
    
    // Si un userId est fourni (différent de l'utilisateur authentifié), vérifier les droits d'admin
    let targetUserId = authUserId
    
    if (userId && userId !== authUserId) {
      // Vérifier si l'utilisateur authentifié est un administrateur
      const userInfo = await prisma.$queryRaw`
        SELECT 
          "role", 
          "managedCompanyId"
        FROM "User" 
        WHERE "id" = ${authUserId}
      `
      
      const userRole = userInfo?.[0]?.role
      const managedCompanyId = userInfo?.[0]?.managedCompanyId
      
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return new Response("Vous n'avez pas les droits pour créer des tâches pour d'autres utilisateurs", { status: 403 })
      }
      
      // Vérifier que l'utilisateur cible appartient à l'entreprise gérée par l'admin
      if (userRole === 'ADMIN' && managedCompanyId) {
        const userBelongsToCompany = await prisma.$queryRaw`
          SELECT EXISTS(
            SELECT 1 FROM "UserCompany"
            WHERE "userId" = ${userId} AND "companyId" = ${managedCompanyId}
          ) as "belongs"
        `
        
        if (!userBelongsToCompany?.[0]?.belongs) {
          return new Response("L'utilisateur n'appartient pas à votre entreprise", { status: 403 })
        }
      }
      
      // Si toutes les vérifications sont passées, utiliser l'userId fourni
      targetUserId = userId
    }

    // Convertir les valeurs numériques en chaînes pour le calcul de l'ordre
    const priorityString = priority !== null ? `P${priority}` : "P3"
    const energyString = energyLevel !== null ? {
      0: "Extrême",
      1: "Élevé",
      2: "Moyen",
      3: "Faible"
    }[energyLevel] : "Moyen"

    // Calculer l'ordre
    const order = calculateTaskOrder(priorityString, energyString)

    // Créer la tâche
    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        priority,
        energyLevel,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        completed: false,
        userId: targetUserId,
        order,
      },
    })

    return Response.json(task)
  } catch (error) {
    console.error("[TASKS_POST] Error", error)
    return new Response("Erreur lors de la création de la tâche", { status: 500 })
  }
}

// PATCH /api/tasks - Mettre à jour une tâche
export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await req.json()
    const { id, title, description, priority, energyLevel, dueDate, projectId, completed } = body

    // Convertir les valeurs numériques en chaînes pour le calcul de l'ordre
    const priorityString = priority !== null ? `P${priority}` : "P3"
    const energyString = energyLevel !== null ? {
      0: "Extrême",
      1: "Élevé",
      2: "Moyen",
      3: "Faible"
    }[energyLevel] : "Moyen"

    // Calculer l'ordre
    const order = calculateTaskOrder(priorityString, energyString)

    const task = await prisma.task.update({
      where: {
        id,
        userId: user.id
      },
      data: {
        title,
        description,
        priority,
        energyLevel,
        dueDate,
        projectId,
        completed,
        order,
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("[TASKS_PATCH]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return new NextResponse("ID de tâche requis", { status: 400 })
    }

    await prisma.task.delete({
      where: {
        id,
        userId: user.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[TASKS_DELETE]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
}



