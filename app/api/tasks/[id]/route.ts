import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
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

    // Récupérer la tâche sans restriction d'userId pour les admins
    const task = await prisma.task.findUnique({
      where: {
        id,
        ...(isAdmin ? {} : { userId }) // Ajouter la restriction userId uniquement pour les non-admins
      },
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

    // Si l'utilisateur est admin et ce n'est pas sa tâche, vérifier qu'il a le droit de la voir
    if (isAdmin && task.userId !== userId) {
      // Pour les admins, vérifier que l'utilisateur assigné à la tâche appartient à son entreprise gérée
      if (user?.managedCompanyId) {
        const userBelongsToManagedCompany = await prisma.userCompany.findFirst({
          where: {
            userId: task.userId,
            companyId: user.managedCompanyId
          }
        })

        if (!userBelongsToManagedCompany) {
          return new Response("Non autorisé - L'utilisateur n'appartient pas à votre entreprise", { status: 403 })
        }
      }
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("[TASK_GET]", error)
    return new Response("Erreur lors de la récupération de la tâche", { status: 500 })
  }
}

// PATCH /api/tasks/[id] - Mettre à jour une tâche
export async function PATCH(
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
    const { title, description, priority, energyLevel, dueDate, projectId, completed } = await request.json()

    // Récupérer les informations de l'utilisateur pour vérifier son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, managedCompanyId: true }
    })

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    // Récupérer la tâche pour vérification
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return new Response("Tâche non trouvée", { status: 404 })
    }

    // Vérifier si l'utilisateur a le droit de modifier cette tâche
    if (!isAdmin && existingTask.userId !== userId) {
      return new Response("Non autorisé à modifier cette tâche", { status: 403 })
    }

    // Pour les admins, vérifier que l'utilisateur assigné à la tâche appartient à son entreprise gérée
    if (isAdmin && existingTask.userId !== userId && user?.managedCompanyId) {
      const userBelongsToManagedCompany = await prisma.userCompany.findFirst({
        where: {
          userId: existingTask.userId,
          companyId: user.managedCompanyId
        }
      })

      if (!userBelongsToManagedCompany) {
        return new Response("Non autorisé - L'utilisateur n'appartient pas à votre entreprise", { status: 403 })
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'ID de la tâche
    const { id } = params

    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // Récupérer les informations de l'utilisateur pour vérifier son rôle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, managedCompanyId: true }
    })

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

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
    
    if (isAdmin && user?.managedCompanyId) {
      userCompanyId = user.managedCompanyId;
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

