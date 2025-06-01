import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiAuth } from '@/middleware/api-auth'

// GET /api/objectives/agent - Récupérer toutes les missions et objectifs via token API
export async function GET(req: NextRequest) {
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
  
  try {
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(req.url)
    const quarter = searchParams.get('quarter')
    const year = searchParams.get('year')
    const includeCurrent = searchParams.get('current') === 'true'
    
    let whereClause: any = { userId }
    
    // Filtrer par trimestre et année si spécifiés
    if (quarter && year) {
      whereClause.quarter = parseInt(quarter)
      whereClause.year = parseInt(year)
    } else if (includeCurrent) {
      // Récupérer la mission actuelle (la plus récente)
      const currentDate = new Date()
      const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3)
      const currentYear = currentDate.getFullYear()
      
      whereClause.quarter = currentQuarter
      whereClause.year = currentYear
    }
    
    const missions = await prisma.mission.findMany({
      where: whereClause,
      include: {
        objectives: {
          include: {
            actions: {
              include: {
                initiative: true
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { quarter: 'desc' }
      ]
    })
    
    return NextResponse.json(missions)
  } catch (error) {
    console.error('Erreur lors de la récupération des objectifs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des objectifs' },
      { status: 500 }
    )
  }
}

// POST /api/objectives/agent - Créer une mission, objectif ou action via token API
export async function POST(req: NextRequest) {
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
  
  try {
    const { type, ...data } = await req.json()
    
    if (type === 'mission') {
      // Créer une nouvelle mission
      const { title, quarter, year, target } = data
      
      if (!title || !quarter || !year) {
        return NextResponse.json({ error: 'Titre, trimestre et année requis pour une mission' }, { status: 400 })
      }
      
      // Vérifier qu'il n'y a pas déjà une mission pour ce trimestre/année
      const existingMission = await prisma.mission.findFirst({
        where: {
          userId,
          quarter: parseInt(quarter),
          year: parseInt(year)
        }
      })
      
      if (existingMission) {
        return NextResponse.json({ error: 'Une mission existe déjà pour ce trimestre' }, { status: 409 })
      }
      
      const mission = await prisma.mission.create({
        data: {
          title: title.trim(),
          quarter: parseInt(quarter),
          year: parseInt(year),
          target: target ? parseFloat(target) : 100,
          userId
        }
      })
      
      return NextResponse.json(mission)
    }
    
    else if (type === 'objective') {
      // Créer un nouvel objectif
      const { title, missionId, target } = data
      
      if (!title || !missionId) {
        return NextResponse.json({ error: 'Titre et ID de mission requis pour un objectif' }, { status: 400 })
      }
      
      // Vérifier que la mission appartient à l'utilisateur
      const mission = await prisma.mission.findFirst({
        where: {
          id: missionId,
          userId
        }
      })
      
      if (!mission) {
        return NextResponse.json({ error: 'Mission non trouvée ou n\'appartenant pas à l\'utilisateur' }, { status: 404 })
      }
      
      const objective = await prisma.objective.create({
        data: {
          title: title.trim(),
          missionId,
          target: target ? parseFloat(target) : 100
        }
      })
      
      return NextResponse.json(objective)
    }
    
    else if (type === 'action') {
      // Créer une nouvelle action
      const { title, objectiveId, target, current } = data
      
      if (!title || !objectiveId) {
        return NextResponse.json({ error: 'Titre et ID d\'objectif requis pour une action' }, { status: 400 })
      }
      
      // Vérifier que l'objectif appartient à l'utilisateur
      const objective = await prisma.objective.findFirst({
        where: {
          id: objectiveId,
          mission: {
            userId
          }
        }
      })
      
      if (!objective) {
        return NextResponse.json({ error: 'Objectif non trouvé ou n\'appartenant pas à l\'utilisateur' }, { status: 404 })
      }
      
      const targetValue = target ? parseFloat(target) : 100
      const currentValue = current ? parseFloat(current) : 0
      const progress = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0
      
      const action = await prisma.objectiveAction.create({
        data: {
          title: title.trim(),
          objectiveId,
          target: targetValue,
          current: currentValue,
          progress
        }
      })
      
      // Mettre à jour la progression de l'objectif parent
      await updateObjectiveProgress(objectiveId)
      
      return NextResponse.json(action)
    }
    
    else {
      return NextResponse.json({ error: 'Type non supporté. Utilisez: mission, objective, ou action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}

// PATCH /api/objectives/agent - Mettre à jour la progression d'une action via token API
export async function PATCH(req: NextRequest) {
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
  
  try {
    const { actionId, increment, setValue, current } = await req.json()
    
    if (!actionId) {
      return NextResponse.json({ error: 'ID d\'action requis' }, { status: 400 })
    }
    
    // Vérifier que l'action appartient à l'utilisateur
    const action = await prisma.objectiveAction.findFirst({
      where: {
        id: actionId,
        objective: {
          mission: {
            userId
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
      newCurrent = action.current + parseFloat(increment)
    } else if (setValue !== undefined || current !== undefined) {
      // Mode absolu : définir la valeur exacte
      newCurrent = parseFloat(setValue || current)
    } else {
      return NextResponse.json({ error: 'Paramètre increment, setValue ou current requis' }, { status: 400 })
    }
    
    // S'assurer que la valeur ne dépasse pas la cible et n'est pas négative
    newCurrent = Math.max(0, Math.min(newCurrent, action.target))
    
    // Calculer le nouveau pourcentage de progression
    const newProgress = action.target > 0 ? (newCurrent / action.target) * 100 : 0
    
    // Mettre à jour l'action
    const updatedAction = await prisma.objectiveAction.update({
      where: { id: actionId },
      data: {
        current: newCurrent,
        progress: newProgress,
        updatedAt: new Date()
      }
    })
    
    // Mettre à jour la progression de l'objectif parent
    await updateObjectiveProgress(action.objectiveId)
    
    return NextResponse.json({
      success: true,
      action: updatedAction,
      message: `Progression mise à jour: ${newCurrent}/${action.target} (${newProgress.toFixed(1)}%)`
    })
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la progression' },
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
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression de l\'objectif:', error)
  }
} 