import { NextRequest, NextResponse } from 'next/server'
import { TaskAnalysisService } from '@/lib/ai/TaskAnalysisService'

// Configuration pour augmenter le timeout sur Vercel
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * API publique pour analyser des tâches en langage naturel
 * Ne crée pas de tâches en base de données (pour les utilisateurs non authentifiés)
 */
export async function POST(req: NextRequest) {
  try {
    const { userInput } = await req.json()

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json({ 
        error: 'userInput requis (description des tâches en langage naturel)' 
      }, { status: 400 })
    }

    // Analyser avec l'IA
    console.log('🤖 Analyse IA en cours (scan public)...')
    const analysis = await TaskAnalysisService.analyzeTasks(userInput)
    console.log(`📅 Date détectée par l'IA : ${analysis.targetDate || 'Non détectée (demain par défaut)'}`)

    // Organiser par moment de la journée
    const organized = TaskAnalysisService.organizeTasks(analysis.tasks)

    // Date cible (détectée par l'IA ou demain par défaut)
    let targetDate: Date
    if (analysis.targetDate) {
      targetDate = new Date(analysis.targetDate)
    } else {
      targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 1)
    }
    targetDate.setHours(0, 0, 0, 0)

    // Créer les tâches formatées (sans les sauvegarder en base)
    const formattedTasks: Array<{
      id: string
      title: string
      description?: string
      category: string
      priority: number
      energyLevel: number
      dueDate: string
      suggestedTime: string
      estimatedDuration: number
    }> = []

    let taskIndex = 0

    // Fonction helper pour formater les tâches
    const formatTask = (task: any, suggestedTime: string, baseHour: number, index: number, total: number) => {
      let taskDate = targetDate
      if (task.dueDate) {
        taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
      }
      
      const dueDate = new Date(taskDate)
      const hoursOffset = Math.floor((index * 60) / (total || 1))
      dueDate.setHours(baseHour + Math.floor(hoursOffset / 60), hoursOffset % 60, 0, 0)

      // Convertir priority de 1-5 vers 0-4
      const dbPriority = Math.max(0, Math.min(4, task.priority - 1))
      
      // Convertir energy de 1-5 vers 0-3
      const dbEnergyLevel = task.energy <= 1 ? 0 : task.energy <= 2 ? 1 : task.energy <= 3 ? 2 : 3

      return {
        id: `task-${taskIndex++}`,
        title: task.title,
        description: task.description,
        category: task.category || suggestedTime.charAt(0).toUpperCase() + suggestedTime.slice(1),
        priority: dbPriority,
        energyLevel: dbEnergyLevel,
        dueDate: dueDate.toISOString(),
        suggestedTime,
        estimatedDuration: task.estimatedDuration || 30
      }
    }

    // Matin : 8h-12h
    organized.morning.forEach((task, index) => {
      formattedTasks.push(formatTask(task, 'morning', 8, index, organized.morning.length))
    })

    // Après-midi : 14h-17h
    organized.afternoon.forEach((task, index) => {
      formattedTasks.push(formatTask(task, 'afternoon', 14, index, organized.afternoon.length))
    })

    // Soir : 17h-19h
    organized.evening.forEach((task, index) => {
      formattedTasks.push(formatTask(task, 'evening', 17, index, organized.evening.length))
    })

    // Générer le résumé
    const planSummary = TaskAnalysisService.generatePlanSummary(organized)
    
    // Calculer le temps total estimé
    const totalEstimatedTime = analysis.totalEstimatedTime || 
      formattedTasks.reduce((sum, task) => sum + (task.estimatedDuration || 30), 0)

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
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
    })

  } catch (error) {
    console.error('❌ Erreur analyse tâches (scan):', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
