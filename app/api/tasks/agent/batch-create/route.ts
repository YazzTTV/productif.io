import { NextRequest, NextResponse } from 'next/server'
import { apiAuth } from '@/middleware/api-auth'
import { TaskAnalysisService } from '@/lib/ai/TaskAnalysisService'
import { prisma } from '@/lib/prisma'
import { calculateTaskOrder } from '@/lib/tasks'

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification API
    const authResponse = await apiAuth(req, {
      requiredScopes: ['tasks:write']
    })
    
    if (authResponse) {
      return authResponse
    }

    const { userInput, date, projectId } = await req.json()
    const userId = req.headers.get('x-api-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json({ 
        error: 'userInput requis (description des tâches en langage naturel)' 
      }, { status: 400 })
    }

    // Récupérer le contexte utilisateur (objectifs, projets)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        missions: {
          where: { 
            year: new Date().getFullYear(),
            quarter: Math.floor(new Date().getMonth() / 3) + 1
          },
          include: {
            objectives: {
              where: { 
                // On pourrait filtrer par status si ce champ existe
              },
              take: 3,
              select: { title: true }
            }
          },
          take: 1
        },
        projects: {
          where: { 
            // On pourrait filtrer par status si ce champ existe
          },
          take: 5,
          select: { name: true }
        }
      }
    })

    const userContext = {
      objectives: user?.missions[0]?.objectives.map(o => o.title).join(', ') || 'Non spécifié',
      projects: user?.projects.map(p => p.name).join(', ') || 'Non spécifié'
    }

    // Analyser avec l'IA
    console.log('🤖 Analyse IA en cours...')
    const analysis = await TaskAnalysisService.analyzeTasks(userInput, userContext)

    // Organiser par moment de la journée
    const organized = TaskAnalysisService.organizeTasks(analysis.tasks)

    // Date cible (demain par défaut)
    const targetDate = date ? new Date(date) : new Date()
    if (!date) {
      targetDate.setDate(targetDate.getDate() + 1)
    }
    targetDate.setHours(0, 0, 0, 0)

    // Créer toutes les tâches
    const createdTasks = []
    let currentOrder = 0

    // Matin : 8h-12h
    for (const task of organized.morning) {
      const dueDate = new Date(targetDate)
      // Répartir les tâches sur le matin (8h-11h)
      const hoursOffset = Math.floor((currentOrder * 60) / (organized.morning.length || 1))
      dueDate.setHours(8 + Math.floor(hoursOffset / 60), hoursOffset % 60, 0, 0)

      // Calculer l'ordre basé sur priority et energyLevel
      const priorityString = `P${task.priority}`
      const energyLevels: { [key: number]: string } = {
        0: "Faible",
        1: "Moyen",
        2: "Élevé",
        3: "Extrême"
      }
      const energyString = energyLevels[task.energy] || "Moyen"
      const order = calculateTaskOrder(priorityString, energyString)

      const createdTask = await prisma.task.create({
        data: {
          userId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          energyLevel: task.energy,
          dueDate,
          projectId: projectId || null,
          completed: false,
          order
        }
      })

      createdTasks.push({
        ...createdTask,
        reasoning: task.reasoning,
        suggestedTime: 'morning',
        estimatedDuration: task.estimatedDuration
      })
      
      currentOrder++
    }

    // Après-midi : 14h-17h
    for (const task of organized.afternoon) {
      const dueDate = new Date(targetDate)
      // Répartir les tâches sur l'après-midi (14h-16h)
      const afternoonIndex = currentOrder - organized.morning.length
      const hoursOffset = Math.floor((afternoonIndex * 60) / (organized.afternoon.length || 1))
      dueDate.setHours(14 + Math.floor(hoursOffset / 60), hoursOffset % 60, 0, 0)

      // Calculer l'ordre
      const priorityString = `P${task.priority}`
      const energyLevels: { [key: number]: string } = {
        0: "Faible",
        1: "Moyen",
        2: "Élevé",
        3: "Extrême"
      }
      const energyString = energyLevels[task.energy] || "Moyen"
      const order = calculateTaskOrder(priorityString, energyString)

      const createdTask = await prisma.task.create({
        data: {
          userId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          energyLevel: task.energy,
          dueDate,
          projectId: projectId || null,
          completed: false,
          order
        }
      })

      createdTasks.push({
        ...createdTask,
        reasoning: task.reasoning,
        suggestedTime: 'afternoon'
      })
      
      currentOrder++
    }

    // Soir : 17h-19h
    for (const task of organized.evening) {
      const dueDate = new Date(targetDate)
      // Répartir les tâches sur le soir (17h-18h)
      const eveningIndex = currentOrder - organized.morning.length - organized.afternoon.length
      const hoursOffset = Math.floor((eveningIndex * 30) / (organized.evening.length || 1))
      dueDate.setHours(17, hoursOffset, 0, 0)

      // Calculer l'ordre
      const priorityString = `P${task.priority}`
      const energyLevels: { [key: number]: string } = {
        0: "Faible",
        1: "Moyen",
        2: "Élevé",
        3: "Extrême"
      }
      const energyString = energyLevels[task.energy] || "Moyen"
      const order = calculateTaskOrder(priorityString, energyString)

      const createdTask = await prisma.task.create({
        data: {
          userId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          energyLevel: task.energy,
          dueDate,
          projectId: projectId || null,
          completed: false,
          order
        }
      })

      createdTasks.push({
        ...createdTask,
        reasoning: task.reasoning,
        suggestedTime: 'evening'
      })
      
      currentOrder++
    }

    // Générer le résumé
    const planSummary = TaskAnalysisService.generatePlanSummary(organized)

    return NextResponse.json({
      success: true,
      tasksCreated: createdTasks.length,
      tasks: createdTasks,
      analysis: {
        summary: analysis.summary,
        totalEstimatedTime: analysis.totalEstimatedTime,
        planSummary
      },
      organized: {
        morning: organized.morning.length,
        afternoon: organized.afternoon.length,
        evening: organized.evening.length
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erreur création tâches intelligentes:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

