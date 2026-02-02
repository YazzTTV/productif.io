import { NextRequest, NextResponse } from 'next/server'
import { apiAuth } from '@/middleware/api-auth'
import { getAuthUserFromRequest, getAuthUser } from '@/lib/auth'
import { verifyApiToken, hasRequiredScopes } from '@/lib/api-token'
import { TaskAnalysisService } from '@/lib/ai/TaskAnalysisService'
import { prisma } from '@/lib/prisma'
import { calculateTaskOrder } from '@/lib/tasks'

// Configuration pour augmenter le timeout sur Vercel
export const maxDuration = 60 // 60 secondes
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
    
    let userId: string | null = null

    // 1) Essayer d'abord via l'utilisateur authentifié (cookies ou header)
    const webUser = await getAuthUserFromRequest(req)
    if (webUser) {
      userId = webUser.id
    } else {
      const cookieUser = await getAuthUser()
      if (cookieUser) {
        userId = cookieUser.id
      }
    }
    
    // 2) Si pas d'utilisateur web, essayer avec un token API explicite
    if (!userId && token) {
      try {
        const payload = await verifyApiToken(token)
        if (payload) {
          // Vérifier les scopes pour les tokens API
          if (!hasRequiredScopes(payload.scopes, ['tasks:write'])) {
            return NextResponse.json({ error: 'Permissions insuffisantes', requiredScopes: ['tasks:write'] }, { status: 403 })
          }
          userId = payload.userId
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token API:', error)
      }
    }
    
    // 3) Si toujours pas d'utilisateur, essayer avec apiAuth (compatibilité anciens appels machine-to-machine)
    if (!userId) {
      const authResponse = await apiAuth(req, {
        requiredScopes: ['tasks:write']
      })
      
      if (authResponse) {
        return authResponse
      }
      
      userId = req.headers.get('x-api-user-id')
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    const { userInput, date, projectId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json({ 
        error: 'userInput requis (description des tâches en langage naturel)' 
      }, { status: 400 })
    }

    // Analyser avec l'IA
    console.log('🤖 Analyse IA en cours...')
    const analysis = await TaskAnalysisService.analyzeTasks(userInput)
    console.log(`📅 Date détectée par l'IA : ${analysis.targetDate || 'Non détectée (demain par défaut)'}`)

    // Organiser par moment de la journée
    const organized = TaskAnalysisService.organizeTasks(analysis.tasks)

    // Date cible (détectée par l'IA ou spécifiée par le paramètre, ou demain par défaut)
    let targetDate: Date
    if (date) {
      // Date explicitement fournie dans les paramètres
      targetDate = new Date(date)
    } else if (analysis.targetDate) {
      // Date détectée par l'IA depuis le langage naturel
      targetDate = new Date(analysis.targetDate)
    } else {
      // Par défaut : demain
      targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 1)
    }
    targetDate.setHours(0, 0, 0, 0)

    // Créer toutes les tâches
    const createdTasks = []
    let currentOrder = 0

    // Matin : 8h-12h
    for (const task of organized.morning) {
      // Utiliser la date spécifique de la tâche si elle existe, sinon la targetDate globale
      let taskDate = targetDate
      if (task.dueDate) {
        taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
      }
      const dueDate = new Date(taskDate)
      // Répartir les tâches sur le matin (8h-11h)
      const hoursOffset = Math.floor((currentOrder * 60) / (organized.morning.length || 1))
      dueDate.setHours(8 + Math.floor(hoursOffset / 60), hoursOffset % 60, 0, 0)

      // Convertir priority de 1-5 vers 0-4 pour la base de données
      // 1 -> 0, 2 -> 1, 3 -> 2, 4 -> 3, 5 -> 4
      const dbPriority = Math.max(0, Math.min(4, task.priority - 1))
      
      // Convertir energy de 1-5 vers 0-3 pour la base de données
      // 1 -> 0 (très faible), 2 -> 1 (faible), 3 -> 2 (moyen), 4-5 -> 3 (élevé/extrême)
      const dbEnergyLevel = task.energy <= 1 ? 0 : task.energy <= 2 ? 1 : task.energy <= 3 ? 2 : 3
      
      // Calculer l'ordre basé sur priority et energyLevel
      const priorityString = `P${dbPriority}`
      const energyLevels: { [key: number]: string } = {
        0: "Faible",
        1: "Moyen",
        2: "Élevé",
        3: "Extrême"
      }
      const energyString = energyLevels[dbEnergyLevel] || "Moyen"
      const order = calculateTaskOrder(priorityString, energyString)

      const createdTask = await prisma.task.create({
        data: {
          userId,
          title: task.title,
          description: task.description,
          priority: dbPriority,
          energyLevel: dbEnergyLevel,
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
      // Utiliser la date spécifique de la tâche si elle existe, sinon la targetDate globale
      let taskDate = targetDate
      if (task.dueDate) {
        taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
      }
      const dueDate = new Date(taskDate)
      // Répartir les tâches sur l'après-midi (14h-16h)
      const afternoonIndex = currentOrder - organized.morning.length
      const hoursOffset = Math.floor((afternoonIndex * 60) / (organized.afternoon.length || 1))
      dueDate.setHours(14 + Math.floor(hoursOffset / 60), hoursOffset % 60, 0, 0)

      // Convertir priority de 1-5 vers 0-4 pour la base de données
      const dbPriority = Math.max(0, Math.min(4, task.priority - 1))
      
      // Convertir energy de 1-5 vers 0-3 pour la base de données
      const dbEnergyLevel = Math.max(0, Math.min(3, Math.floor((task.energy - 1) * 3 / 4)))
      
      // Calculer l'ordre
      const priorityString = `P${dbPriority}`
      const energyLevels: { [key: number]: string } = {
        0: "Faible",
        1: "Moyen",
        2: "Élevé",
        3: "Extrême"
      }
      const energyString = energyLevels[dbEnergyLevel] || "Moyen"
      const order = calculateTaskOrder(priorityString, energyString)

      const createdTask = await prisma.task.create({
        data: {
          userId,
          title: task.title,
          description: task.description,
          priority: dbPriority,
          energyLevel: dbEnergyLevel,
          dueDate,
          projectId: projectId || null,
          completed: false,
          order
        }
      })

      createdTasks.push({
        ...createdTask,
        reasoning: task.reasoning,
        suggestedTime: 'afternoon',
        estimatedDuration: task.estimatedDuration
      })
      
      currentOrder++
    }

    // Soir : 17h-19h
    for (const task of organized.evening) {
      // Utiliser la date spécifique de la tâche si elle existe, sinon la targetDate globale
      let taskDate = targetDate
      if (task.dueDate) {
        taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
      }
      const dueDate = new Date(taskDate)
      // Répartir les tâches sur le soir (17h-18h)
      const eveningIndex = currentOrder - organized.morning.length - organized.afternoon.length
      const hoursOffset = Math.floor((eveningIndex * 30) / (organized.evening.length || 1))
      dueDate.setHours(17, hoursOffset, 0, 0)

      // Convertir priority de 1-5 vers 0-4 pour la base de données
      const dbPriority = Math.max(0, Math.min(4, task.priority - 1))
      
      // Convertir energy de 1-5 vers 0-3 pour la base de données
      const dbEnergyLevel = Math.max(0, Math.min(3, Math.floor((task.energy - 1) * 3 / 4)))
      
      // Calculer l'ordre
      const priorityString = `P${dbPriority}`
      const energyLevels: { [key: number]: string } = {
        0: "Faible",
        1: "Moyen",
        2: "Élevé",
        3: "Extrême"
      }
      const energyString = energyLevels[dbEnergyLevel] || "Moyen"
      const order = calculateTaskOrder(priorityString, energyString)

      const createdTask = await prisma.task.create({
        data: {
          userId,
          title: task.title,
          description: task.description,
          priority: dbPriority,
          energyLevel: dbEnergyLevel,
          dueDate,
          projectId: projectId || null,
          completed: false,
          order
        }
      })

      createdTasks.push({
        ...createdTask,
        reasoning: task.reasoning,
        suggestedTime: 'evening',
        estimatedDuration: task.estimatedDuration
      })
      
      currentOrder++
    }

    // Générer le résumé
    const planSummary = TaskAnalysisService.generatePlanSummary(organized)
    
    // Calculer le temps total estimé si non fourni
    const totalEstimatedTime = analysis.totalEstimatedTime || 
      createdTasks.reduce((sum, task) => sum + (task.estimatedDuration || 30), 0)

    return NextResponse.json({
      success: true,
      tasksCreated: createdTasks.length,
      tasks: createdTasks,
      analysis: {
        summary: analysis.summary,
        totalEstimatedTime,
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
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

