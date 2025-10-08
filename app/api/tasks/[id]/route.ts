import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAuthUserFromRequest, verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTaskOrder } from "@/lib/tasks"
import { localDateToUTC } from "@/lib/date-utils"

// GET /api/tasks/[id] - Récupérer une tâche spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'ID de la tâche
    const { id } = params

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

    // Récupérer les informations de l'utilisateur pour vérifier son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, managedCompanyId: true }
    })

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    // Récupérer la tâche
    const task = await prisma.task.findUnique({
      where: { id },
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

    if (!task) {
      return new Response("Tâche non trouvée", { status: 404 })
    }

    // Vérifier si l'utilisateur peut accéder à cette tâche
    // Cas 1: C'est sa propre tâche -> OK
    if (task.userId === userId) {
      return NextResponse.json(task)
    }
    
    // Cas 2: L'utilisateur est admin et gère une entreprise
    if (isAdmin && user?.managedCompanyId) {
      // Vérifier que l'utilisateur assigné à la tâche appartient à l'entreprise gérée par l'admin
      const userBelongsToManagedCompany = await prisma.userCompany.findFirst({
        where: {
          userId: task.userId,
          companyId: user.managedCompanyId
        }
      })

      if (userBelongsToManagedCompany) {
        return NextResponse.json(task)
      }
    }
    
    // Cas 3: Utilisateur normal - vérifier qu'il appartient à la même entreprise que le propriétaire de la tâche
    // Obtenir l'entreprise de l'utilisateur actuel
    const userCompany = await prisma.userCompany.findFirst({
      where: { userId },
      select: { companyId: true }
    })
    
    if (!userCompany) {
      return new Response("Utilisateur non associé à une entreprise", { status: 403 })
    }
    
    // Vérifier que le propriétaire de la tâche appartient à la même entreprise
    const taskOwnerCompany = await prisma.userCompany.findFirst({
      where: {
        userId: task.userId,
        companyId: userCompany.companyId
      }
    })
    
    if (!taskOwnerCompany) {
      return new Response("Non autorisé - Cette tâche n'appartient pas à un membre de votre entreprise", { status: 403 })
    }
    
    // Si on arrive ici, l'utilisateur et le propriétaire de la tâche sont dans la même entreprise
    return NextResponse.json(task)
  } catch (error) {
    console.error("[TASK_GET]", error)
    return new Response("Erreur lors de la récupération de la tâche", { status: 500 })
  }
}

// PATCH /api/tasks/[id] - Mettre à jour une tâche
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'ID de la tâche
    const { id } = params

    // Authentification (supporte cookies ET Authorization header)
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return new Response("Non authentifié", { status: 401 })
    }

    const userId = user.id
    const { title, description, priority, energyLevel, dueDate, projectId, completed } = await request.json()

    // Récupérer les informations de l'utilisateur pour vérifier son rôle
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, managedCompanyId: true }
    })

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN'

    // Récupérer la tâche pour vérification
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return new Response("Tâche non trouvée", { status: 404 })
    }

    // Vérifier si l'utilisateur peut modifier cette tâche
    // Cas 1: C'est sa propre tâche -> OK
    if (existingTask.userId === userId) {
      // Autorisation OK
    }
    // Cas 2: L'utilisateur est admin et gère une entreprise
    else if (isAdmin && userInfo?.managedCompanyId) {
      // Vérifier que l'utilisateur assigné à la tâche appartient à l'entreprise gérée par l'admin
      const userBelongsToManagedCompany = await prisma.userCompany.findFirst({
        where: {
          userId: existingTask.userId,
          companyId: userInfo.managedCompanyId
        }
      })

      if (!userBelongsToManagedCompany) {
        return new Response("Non autorisé - L'utilisateur n'appartient pas à votre entreprise", { status: 403 })
      }
    }
    // Cas 3: Utilisateur normal - vérifier qu'il appartient à la même entreprise que le propriétaire de la tâche
    else {
      // Obtenir l'entreprise de l'utilisateur actuel
      const userCompany = await prisma.userCompany.findFirst({
        where: { userId },
        select: { companyId: true }
      })
      
      if (!userCompany) {
        return new Response("Utilisateur non associé à une entreprise", { status: 403 })
      }
      
      // Vérifier que le propriétaire de la tâche appartient à la même entreprise
      const taskOwnerCompany = await prisma.userCompany.findFirst({
        where: {
          userId: existingTask.userId,
          companyId: userCompany.companyId
        }
      })
      
      if (!taskOwnerCompany) {
        return new Response("Non autorisé - Cette tâche n'appartient pas à un membre de votre entreprise", { status: 403 })
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

    const task = await prisma.task.update({
      where: {
        id
      },
      data: {
        title,
        description,
        priority,
        energyLevel,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        completed,
        order
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("[TASK_PATCH]", error)
    return new Response("Erreur lors de la modification de la tâche", { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Supprimer une tâche
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'ID de la tâche
    const { id } = params

    // Authentification (supporte cookies ET Authorization header)
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userId = user.id

    // Récupérer les informations de l'utilisateur pour vérifier son rôle
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, managedCompanyId: true }
    })

    const isAdmin = userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN'

    const task = await prisma.task.findUnique({
      where: {
        id,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      )
    }

    // Obtenir l'entreprise de l'utilisateur
    let userCompanyId: string | null = null;
    
    if (isAdmin && userInfo?.managedCompanyId) {
      userCompanyId = userInfo.managedCompanyId;
    } else {
      // Pour les utilisateurs normaux
      const userCompany = await prisma.userCompany.findFirst({
        where: { userId },
        select: { companyId: true }
      });
      
      userCompanyId = userCompany?.companyId || null;
    }
    
    if (!userCompanyId) {
      return NextResponse.json(
        { error: "Utilisateur non associé à une entreprise" },
        { status: 403 }
      )
    }
    
    // Vérifier que la tâche appartient à un utilisateur de la même entreprise
    const taskUserCompany = await prisma.userCompany.findFirst({
      where: {
        userId: task.userId,
        companyId: userCompanyId
      }
    });
    
    if (!taskUserCompany) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer les tâches d'utilisateurs d'autres entreprises" },
        { status: 403 }
      )
    }
    
    // Rechercher et supprimer toutes les tâches similaires pour tous les utilisateurs de l'entreprise (y compris les admins)
    // Récupérer tous les utilisateurs de l'entreprise
    const companyUsers = await prisma.userCompany.findMany({
      where: {
        companyId: userCompanyId,
        isActive: true
      },
      select: {
        userId: true
      }
    });
    
    const userIds = companyUsers.map(u => u.userId);
    
    // Trouver toutes les tâches avec le même titre, description, priorité, etc.
    // Sans restriction sur le rôle de l'utilisateur
    const similarTasks = await prisma.task.findMany({
      where: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        energyLevel: task.energyLevel,
        dueDate: task.dueDate,
        userId: {
          in: userIds
        }
      }
    });
    
    // Supprimer toutes les tâches similaires
    if (similarTasks.length > 0) {
      console.log(`Suppression de ${similarTasks.length} tâches identiques`);
      await prisma.task.deleteMany({
        where: {
          id: {
            in: similarTasks.map(t => t.id)
          }
        }
      });
      
      return NextResponse.json({ 
        success: true,
        message: `${similarTasks.length} tâches similaires ont été supprimées`
      });
    } else {
      // Si aucune tâche similaire trouvée, supprimer uniquement cette tâche (ne devrait jamais arriver)
      await prisma.task.delete({
        where: {
          id,
        },
      });
      
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("[TASK_DELETE]", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la tâche" },
      { status: 500 }
    )
  }
}

