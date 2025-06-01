import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'

// PATCH /api/objectives/agent/actions/[id]/progress - Mettre à jour la progression d'une action spécifique
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['objectives:write']
  })
  
  // Si l'authentification a échoué, retourner la réponse d'erreur
  if (authResponse) {
    return authResponse
  }
  
  // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
  const userId = req.headers.get('x-api-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }
  
  const { id } = params
  
  try {
    const { increment, setValue, current, note } = await req.json()
    
    // Vérifier que l'action appartient à l'utilisateur
    const action = await prisma.objectiveAction.findFirst({
      where: {
        id,
        objective: {
          mission: {
            userId
          }
        }
      },
      include: {
        objective: {
          include: {
            mission: true
          }
        }
      }
    })
    
    if (!action) {
      return NextResponse.json({ error: 'Action non trouvée ou n\'appartenant pas à l\'utilisateur' }, { status: 404 })
    }
    
    let newCurrent = action.current
    
    if (increment !== undefined) {
      // Mode incrémental : ajouter la valeur à la progression actuelle
      const incrementValue = parseFloat(increment)
      newCurrent = action.current + incrementValue
      
      console.log(`[OBJECTIVES_AGENT] Incrémentation de ${incrementValue} pour l'action "${action.title}": ${action.current} -> ${newCurrent}`)
    } else if (setValue !== undefined || current !== undefined) {
      // Mode absolu : définir la valeur exacte
      newCurrent = parseFloat(setValue || current)
      
      console.log(`[OBJECTIVES_AGENT] Définition de la valeur ${newCurrent} pour l'action "${action.title}"`)
    } else {
      return NextResponse.json({ error: 'Paramètre increment, setValue ou current requis' }, { status: 400 })
    }
    
    // S'assurer que la valeur ne dépasse pas la cible et n'est pas négative
    const clampedCurrent = Math.max(0, Math.min(newCurrent, action.target))
    
    // Calculer le nouveau pourcentage de progression
    const newProgress = action.target > 0 ? (clampedCurrent / action.target) * 100 : 0
    
    // Mettre à jour l'action
    const updatedAction = await prisma.objectiveAction.update({
      where: { id },
      data: {
        current: clampedCurrent,
        progress: newProgress,
        updatedAt: new Date()
      },
      include: {
        objective: {
          include: {
            mission: true
          }
        }
      }
    })
    
    // Mettre à jour la progression de l'objectif parent
    await updateObjectiveProgress(action.objectiveId)
    
    // Préparer la réponse avec des informations détaillées
    const response: any = {
      success: true,
      action: {
        id: updatedAction.id,
        title: updatedAction.title,
        current: updatedAction.current,
        target: updatedAction.target,
        progress: updatedAction.progress,
        objective: {
          id: updatedAction.objective.id,
          title: updatedAction.objective.title,
          progress: updatedAction.objective.progress
        },
        mission: {
          id: updatedAction.objective.mission.id,
          title: updatedAction.objective.mission.title,
          quarter: updatedAction.objective.mission.quarter,
          year: updatedAction.objective.mission.year
        }
      },
      message: `Progression mise à jour: ${clampedCurrent}/${action.target} (${newProgress.toFixed(1)}%)`,
      previousValue: action.current,
      newValue: clampedCurrent,
      change: clampedCurrent - action.current,
      completed: clampedCurrent >= action.target
    }
    
    // Ajouter une note si fournie
    if (note) {
      response.note = note
    }
    
    // Log pour le suivi
    console.log(`[OBJECTIVES_AGENT] Action "${action.title}" mise à jour: ${action.current} -> ${clampedCurrent} (${newProgress.toFixed(1)}%)`)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression de l\'action:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la progression de l\'action' },
      { status: 500 }
    )
  }
}

// GET /api/objectives/agent/actions/[id]/progress - Récupérer les détails d'une action
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Vérifier l'authentification API
  const authResponse = await apiAuth(req, {
    requiredScopes: ['objectives:read']
  })
  
  // Si l'authentification a échoué, retourner la réponse d'erreur
  if (authResponse) {
    return authResponse
  }
  
  // Extraire l'ID de l'utilisateur à partir de l'en-tête (ajouté par le middleware)
  const userId = req.headers.get('x-api-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }
  
  const { id } = params
  
  try {
    // Récupérer l'action avec ses relations
    const action = await prisma.objectiveAction.findFirst({
      where: {
        id,
        objective: {
          mission: {
            userId
          }
        }
      },
      include: {
        objective: {
          include: {
            mission: true,
            actions: {
              select: {
                id: true,
                title: true,
                current: true,
                target: true,
                progress: true
              }
            }
          }
        },
        initiative: true
      }
    })
    
    if (!action) {
      return NextResponse.json({ error: 'Action non trouvée ou n\'appartenant pas à l\'utilisateur' }, { status: 404 })
    }
    
    // Calculer des statistiques supplémentaires
    const remainingToTarget = Math.max(0, action.target - action.current)
    const isCompleted = action.current >= action.target
    const progressPercentage = action.target > 0 ? (action.current / action.target) * 100 : 0
    
    const response = {
      action: {
        id: action.id,
        title: action.title,
        current: action.current,
        target: action.target,
        progress: action.progress,
        remaining: remainingToTarget,
        completed: isCompleted,
        progressPercentage: progressPercentage,
        createdAt: action.createdAt,
        updatedAt: action.updatedAt
      },
      objective: {
        id: action.objective.id,
        title: action.objective.title,
        current: action.objective.current,
        target: action.objective.target,
        progress: action.objective.progress,
        totalActions: action.objective.actions.length,
        completedActions: action.objective.actions.filter(a => a.current >= a.target).length
      },
      mission: {
        id: action.objective.mission.id,
        title: action.objective.mission.title,
        quarter: action.objective.mission.quarter,
        year: action.objective.mission.year,
        progress: action.objective.mission.progress
      },
      initiative: action.initiative
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'action:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des détails de l\'action' },
      { status: 500 }
    )
  }
}

// Fonction utilitaire pour mettre à jour la progression d'un objectif
async function updateObjectiveProgress(objectiveId: string) {
  try {
    // Récupérer toutes les actions de l'objectif
    const actions = await prisma.objectiveAction.findMany({
      where: { objectiveId }
    })
    
    if (actions.length === 0) return
    
    // Calculer la progression moyenne des actions
    const totalProgress = actions.reduce((sum, action) => sum + action.progress, 0)
    const averageProgress = totalProgress / actions.length
    
    // Calculer les valeurs current et target totales
    const totalCurrent = actions.reduce((sum, action) => sum + action.current, 0)
    const totalTarget = actions.reduce((sum, action) => sum + action.target, 0)
    
    // Mettre à jour l'objectif
    const updatedObjective = await prisma.objective.update({
      where: { id: objectiveId },
      data: {
        current: totalCurrent,
        target: totalTarget,
        progress: averageProgress,
        updatedAt: new Date()
      }
    })
    
    // Mettre à jour la progression de la mission parent
    const mission = await prisma.mission.findUnique({
      where: { id: updatedObjective.missionId },
      include: {
        objectives: true
      }
    })
    
    if (mission && mission.objectives.length > 0) {
      const missionProgress = mission.objectives.reduce((sum, obj) => sum + obj.progress, 0) / mission.objectives.length
      
      await prisma.mission.update({
        where: { id: mission.id },
        data: {
          progress: missionProgress,
          updatedAt: new Date()
        }
      })
    }
    
    console.log(`[OBJECTIVES_AGENT] Objectif ${objectiveId} mis à jour: progression ${averageProgress.toFixed(1)}%`)
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression de l\'objectif:', error)
  }
} 