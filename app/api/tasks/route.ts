import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTaskOrder } from "@/lib/tasks"
import { format, isEqual, isBefore } from "date-fns"
import { formatInTimezone, USER_TIMEZONE, localDateToUTC } from "@/lib/date-utils"
import { parse, parseISO, isWithinInterval } from "date-fns"
import { toZonedTime } from "date-fns-tz"

// Augmenter le timeout pour les requêtes complexes (30 secondes)
export const maxDuration = 30

// GET /api/tasks - Récupérer toutes les tâches de l'utilisateur
export async function GET(request: Request) {
  const startTime = Date.now()
  const routeName = "[TASKS]"
  
  try {
    console.log(`${routeName} ⏱️  DÉBUT - Route: /api/tasks - Timestamp: ${new Date().toISOString()}`)
    
    const user = await getAuthUser()
    if (!user) {
      console.log(`${routeName} ❌ ERREUR - Non authentifié après ${Date.now() - startTime}ms`)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    console.log(`${routeName} ✅ Utilisateur authentifié: ${user.id} - Temps: ${Date.now() - startTime}ms`)

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
    
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const companyIdParam = searchParams.get('companyId')
    const dateParam = searchParams.get('date')
    const debug = searchParams.get('debug') === '1'
    const userOnly = searchParams.get('userOnly') === 'true'
    
    // Pour le debug uniquement
    if (debug) {
      // Compter le nombre total de tâches
      const totalTasks = await prisma.task.count({
        where: {
          userId
        }
      })
      
      // Compter le nombre de projets
      const totalProjects = await prisma.project.count({
        where: {
          userId
        }
      })
      
      return NextResponse.json({
        debug: true,
        userId,
        userInfo: userInfo[0],
        counts: {
          tasks: totalTasks,
          projects: totalProjects
        }
      })
    }

    // Déterminer si on doit filtrer par entreprise
    let shouldFilterByCompany = false
    let targetCompanyId = null
    
    // Si userOnly est spécifié, forcer le filtrage par utilisateur uniquement
    if (userOnly) {
      shouldFilterByCompany = false
    }
    // Si l'utilisateur est ADMIN ou SUPER_ADMIN et qu'un ID d'entreprise est spécifié
    else if ((userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')) {
      if (companyIdParam && companyIdParam.trim() !== '') {
        // Utiliser l'ID d'entreprise spécifié dans la requête
        shouldFilterByCompany = true
        targetCompanyId = companyIdParam
      } else if (companyId) {
        // Par défaut, utiliser l'entreprise que l'admin gère
        shouldFilterByCompany = true
        targetCompanyId = companyId
      }
    } else {
      // Pour les membres normaux, récupérer leur entreprise
      const userCompany = await prisma.$queryRaw`
        SELECT "companyId" 
        FROM "UserCompany" 
        WHERE "userId" = ${userId}
        LIMIT 1
      `
      
      if (userCompany && Array.isArray(userCompany) && userCompany.length > 0) {
        shouldFilterByCompany = true
        targetCompanyId = userCompany[0].companyId
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
    // Construire le filtre de requête
    let whereClause: any = { userId };
    
    // Si une date est spécifiée, ajouter des conditions pour filtrer par date
    if (dateParam) {
      try {
        // Analyser la date fournie (format attendu: YYYY-MM-DD)
        const targetDate = new Date(dateParam);
        
        // Vérifier si la date est valide
        if (isNaN(targetDate.getTime())) {
          return NextResponse.json({ error: "Format de date invalide. Utilisez le format YYYY-MM-DD" }, { status: 400 });
        }
        
        // Importer les fonctions nécessaires pour le traitement des dates
        const { toZonedTime } = await import('date-fns-tz');
        const { format, parseISO } = await import('date-fns');
        
        // Créer le début et la fin de la journée pour la date demandée
        // Note: Pour une implémentation plus précise, vous pourriez vouloir utiliser
        // l'approche complète de date-utils.ts avec le fuseau horaire de l'utilisateur
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Ajouter la condition de date à la clause WHERE
        whereClause = {
          ...whereClause,
          OR: [
            { 
              dueDate: {
                gte: startOfDay,
                lte: endOfDay
              }
            },
            {
              scheduledFor: {
                gte: startOfDay,
                lte: endOfDay
              }
            },
            {
              AND: [
                { completed: true },
                { 
                  updatedAt: {
                    gte: startOfDay,
                    lte: endOfDay
                  }
                }
              ]
            }
          ]
        };
        
        console.log(`[TASKS_GET] Filtrage par date: ${format(startOfDay, 'yyyy-MM-dd')}`);
      } catch (error) {
        console.error("[TASKS_GET] Erreur lors du traitement de la date:", error);
        return NextResponse.json({ error: "Erreur lors du traitement de la date" }, { status: 500 });
      }
    }
    
    const tasks = await prisma.task.findMany({
      where: whereClause,
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
    
    const totalTime = Date.now() - startTime
    console.log(`${routeName} ✅ SUCCÈS - Route terminée en ${totalTime}ms - Tâches: ${tasks.length} - Timestamp: ${new Date().toISOString()}`)
    
    return NextResponse.json({ 
      tasks,
      isCompanyFiltered: false
    })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`${routeName} ❌ ERREUR - Route échouée après ${totalTime}ms - Timestamp: ${new Date().toISOString()}`)
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
    const { title, description, priority, energyLevel, dueDate, projectId, userId, processDescription, processId } = await request.json()
    
    // Si un userId est fourni (différent de l'utilisateur authentifié), vérifier les droits
    let targetUserId = authUserId
    
    if (userId && userId !== authUserId) {
      // Vérifier si l'utilisateur authentifié est un administrateur ou membre de la même entreprise
      const userInfo: any[] = await prisma.$queryRaw`
        SELECT 
          "role", 
          "managedCompanyId"
        FROM "User" 
        WHERE "id" = ${authUserId}
      `
      
      const userRole = userInfo?.[0]?.role
      const managedCompanyId = userInfo?.[0]?.managedCompanyId
      
      // Si c'est un administrateur
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        // Vérifier que l'utilisateur cible appartient à l'entreprise gérée par l'admin
        if (managedCompanyId) {
          const userBelongsToCompany: any[] = await prisma.$queryRaw`
            SELECT EXISTS(
              SELECT 1 FROM "UserCompany"
              WHERE "userId" = ${userId} AND "companyId" = ${managedCompanyId}
            ) as "belongs"
          `
          
          if (!userBelongsToCompany?.[0]?.belongs) {
            return NextResponse.json({ 
              error: "L'utilisateur cible n'appartient pas à votre entreprise" 
            }, { status: 403 })
          }
        }
      } 
      // Si c'est un utilisateur normal, vérifier qu'il appartient à la même entreprise que l'utilisateur cible
      else {
        // Obtenir l'entreprise de l'utilisateur authentifié
        const userCompany: any[] = await prisma.$queryRaw`
          SELECT "companyId" 
          FROM "UserCompany" 
          WHERE "userId" = ${authUserId}
          LIMIT 1
        `
        
        if (!userCompany || userCompany.length === 0) {
          return NextResponse.json({ 
            error: "Vous n'appartenez à aucune entreprise" 
          }, { status: 403 })
        }
        
        const companyId = userCompany[0].companyId
        
        // Vérifier que l'utilisateur cible appartient à la même entreprise
        const userBelongsToCompany: any[] = await prisma.$queryRaw`
          SELECT EXISTS(
            SELECT 1 FROM "UserCompany"
            WHERE "userId" = ${userId} AND "companyId" = ${companyId}
          ) as "belongs"
        `
        
        if (!userBelongsToCompany?.[0]?.belongs) {
          return NextResponse.json({ 
            error: "Vous ne pouvez pas assigner de tâches à des utilisateurs d'autres entreprises" 
          }, { status: 403 })
        }
      }
      
      // Si toutes les vérifications sont passées, utiliser l'userId fourni
      targetUserId = userId
    }

    // Convertir les valeurs numériques en chaînes pour le calcul de l'ordre
    const priorityString = priority !== null ? `P${priority}` : "P2"
    
    // Définir les niveaux d'énergie pour le mapping
    const energyLevels: { [key: number]: string } = {
      0: "Faible",
      1: "Moyen",
      2: "Élevé",
      3: "Extrême"
    }
    
    const energyString = energyLevel !== null && typeof energyLevel === 'number' 
      ? energyLevels[energyLevel] || "Moyen" 
      : "Moyen"

    // Calculer l'ordre
    const order = calculateTaskOrder(priorityString, energyString)

    // Utiliser un processus existant ou en créer un nouveau si nécessaire
    let finalProcessId = processId || null;
    
    // Créer un nouveau processus uniquement si:
    // 1. Aucun processId n'est fourni
    // 2. Une description de processus est fournie
    if (!finalProcessId && processDescription) {
      try {
        const process = await prisma.process.create({
          data: {
            name: title, // Utiliser le titre de la tâche comme nom du processus
            description: processDescription,
            userId: targetUserId
          }
        });
        finalProcessId = process.id;
      } catch (err) {
        console.error("Erreur lors de la création du processus:", err);
        // Continuer sans processus en cas d'erreur
      }
    }

    // Créer la tâche
    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        priority,
        energyLevel,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        processId: finalProcessId,
        completed: false,
        userId: targetUserId,
        order,
      }
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
    
    // Convertir les valeurs numériques en chaînes pour le calcul de l'ordre
    const priorityString = priority !== null ? `P${priority}` : "P2"
    
    // Définir les niveaux d'énergie pour le mapping
    const energyLevels: { [key: number]: string } = {
      0: "Faible",
      1: "Moyen",
      2: "Élevé",
      3: "Extrême"
    }
    
    const energyString = energyLevel !== null && typeof energyLevel === 'number' 
      ? energyLevels[energyLevel] || "Moyen" 
      : "Moyen"

    // Calculer l'ordre
    const order = calculateTaskOrder(priorityString, energyString)
    
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



