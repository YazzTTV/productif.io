import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTaskOrder } from "@/lib/tasks"

// GET /api/tasks - Récupérer toutes les tâches de l'utilisateur
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = user.id
    
    // Récupérer les informations de l'utilisateur
    const userInfo: any[] = await prisma.$queryRaw`
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
      const companyUsers: any[] = await prisma.$queryRaw`
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
    return NextResponse.json({ error: "Erreur lors du chargement des tâches" }, { status: 500 })
  }
}

// POST /api/tasks - Créer une nouvelle tâche
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const authUserId = user.id
    
    // Récupérer le body de la requête
    const { title, description, priority, energyLevel, dueDate, projectId, userId } = await request.json()
    
    // Si un userId est fourni (différent de l'utilisateur authentifié), vérifier les droits d'admin
    let targetUserId = authUserId
    
    if (userId && userId !== authUserId) {
      // Vérifier si l'utilisateur authentifié est un administrateur
      const userInfo: any[] = await prisma.$queryRaw`
        SELECT 
          "role", 
          "managedCompanyId"
        FROM "User" 
        WHERE "id" = ${authUserId}
      `
      
      const userRole = userInfo?.[0]?.role
      const managedCompanyId = userInfo?.[0]?.managedCompanyId
      
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: "Vous n'avez pas les droits pour créer des tâches pour d'autres utilisateurs" }, { status: 403 })
      }
      
      // Vérifier que l'utilisateur cible appartient à l'entreprise gérée par l'admin
      if (userRole === 'ADMIN' && managedCompanyId) {
        const userBelongsToCompany: any[] = await prisma.$queryRaw`
          SELECT EXISTS(
            SELECT 1 FROM "UserCompany"
            WHERE "userId" = ${userId} AND "companyId" = ${managedCompanyId}
          ) as "belongs"
        `
        
        if (!userBelongsToCompany?.[0]?.belongs) {
          return NextResponse.json({ error: "L'utilisateur n'appartient pas à votre entreprise" }, { status: 403 })
        }
      }
      
      // Si toutes les vérifications sont passées, utiliser l'userId fourni
      targetUserId = userId
    }

    // Convertir les valeurs numériques en chaînes pour le calcul de l'ordre
    const priorityString = priority !== null ? `P${priority}` : "P3"
    const energyLevels: Record<number, string> = {
      0: "Extrême",
      1: "Élevé",
      2: "Moyen",
      3: "Faible"
    }
    const energyString = energyLevel !== null && energyLevel in energyLevels 
      ? energyLevels[energyLevel] 
      : "Moyen"

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

    return NextResponse.json(task)
  } catch (error) {
    console.error("[TASKS_POST] Error", error)
    return NextResponse.json({ error: "Erreur lors de la création de la tâche" }, { status: 500 })
  }
}

// PATCH /api/tasks - Mettre à jour une tâche existante
export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id, completed, title, description, priority, energyLevel, dueDate, projectId } = await req.json()
    
    if (!id) {
      return NextResponse.json({ error: "ID de tâche manquant" }, { status: 400 })
    }
    
    // Vérifier que la tâche existe et appartient à l'utilisateur
    const task = await prisma.task.findUnique({
      where: { id }
    })
    
    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 })
    }
    
    // Vérifier que l'utilisateur a le droit de modifier cette tâche
    if (task.userId !== user.id) {
      // Vérifier si l'utilisateur est un admin qui peut modifier les tâches d'autres utilisateurs
      const userInfo = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, managedCompanyId: true }
      })
      
      if (!userInfo || (userInfo.role !== 'ADMIN' && userInfo.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: "Vous n'êtes pas autorisé à modifier cette tâche" }, { status: 403 })
      }
      
      // Si l'utilisateur est admin, vérifier que la tâche appartient à un utilisateur de son entreprise
      if (userInfo.role === 'ADMIN' && userInfo.managedCompanyId) {
        const userBelongsToCompany = await prisma.userCompany.findFirst({
          where: {
            userId: task.userId,
            companyId: userInfo.managedCompanyId
          }
        })
        
        if (!userBelongsToCompany) {
          return NextResponse.json({ error: "Cette tâche n'appartient pas à un utilisateur de votre entreprise" }, { status: 403 })
        }
      }
    }
    
    // Recalculer l'ordre si la priorité ou le niveau d'énergie a changé
    let order = task.order
    if ((priority !== undefined && priority !== task.priority) || 
        (energyLevel !== undefined && energyLevel !== task.energyLevel)) {
      const priorityString = priority !== undefined ? `P${priority}` : task.priority !== null ? `P${task.priority}` : "P3"
      
      const energyLevels: Record<number, string> = {
        0: "Extrême",
        1: "Élevé",
        2: "Moyen",
        3: "Faible"
      }
      
      const newEnergyLevel = energyLevel !== undefined ? energyLevel : task.energyLevel
      const energyString = newEnergyLevel !== null && typeof newEnergyLevel === 'number' && newEnergyLevel in energyLevels
        ? energyLevels[newEnergyLevel]
        : "Moyen"
      
      order = calculateTaskOrder(priorityString, energyString)
    }
    
    // Mettre à jour la tâche
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        completed: completed !== undefined ? completed : task.completed,
        title: title !== undefined ? title : task.title,
        description: description !== undefined ? description : task.description,
        priority: priority !== undefined ? priority : task.priority,
        energyLevel: energyLevel !== undefined ? energyLevel : task.energyLevel,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        projectId: projectId !== undefined ? (projectId || null) : task.projectId,
        order,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("[TASKS_PATCH] Error", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de la tâche" }, { status: 500 })
  }
}

// DELETE /api/tasks - Supprimer une tâche
export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await req.json()
    
    if (!id) {
      return NextResponse.json({ error: "ID de tâche manquant" }, { status: 400 })
    }
    
    // Vérifier que la tâche existe et appartient à l'utilisateur
    const task = await prisma.task.findUnique({
      where: { id }
    })
    
    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 })
    }
    
    // Vérifier que l'utilisateur a le droit de supprimer cette tâche
    if (task.userId !== user.id) {
      // Vérifier si l'utilisateur est un admin qui peut supprimer les tâches d'autres utilisateurs
      const userInfo = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, managedCompanyId: true }
      })
      
      if (!userInfo || (userInfo.role !== 'ADMIN' && userInfo.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: "Vous n'êtes pas autorisé à supprimer cette tâche" }, { status: 403 })
      }
      
      // Si l'utilisateur est admin, vérifier que la tâche appartient à un utilisateur de son entreprise
      if (userInfo.role === 'ADMIN' && userInfo.managedCompanyId) {
        const userBelongsToCompany = await prisma.userCompany.findFirst({
          where: {
            userId: task.userId,
            companyId: userInfo.managedCompanyId
          }
        })
        
        if (!userBelongsToCompany) {
          return NextResponse.json({ error: "Cette tâche n'appartient pas à un utilisateur de votre entreprise" }, { status: 403 })
        }
      }
    }
    
    // Supprimer la tâche
    await prisma.task.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[TASKS_DELETE] Error", error)
    return NextResponse.json({ error: "Erreur lors de la suppression de la tâche" }, { status: 500 })
  }
}



