/**
 * API pour associer des tâches à des matières via IA
 * POST /api/tasks/associate-subjects
 * 
 * Analyse une transcription vocale ou texte et associe chaque tâche à une matière
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TaskAnalysisService } from '@/lib/ai/TaskAnalysisService'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { transcription } = await req.json()

    if (!transcription || typeof transcription !== 'string') {
      return NextResponse.json(
        { error: 'Transcription requise' },
        { status: 400 }
      )
    }

    // Récupérer toutes les matières de l'utilisateur
    const subjects = await (prisma as any).subject.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        coefficient: true,
      },
    })

    if (subjects.length === 0) {
      return NextResponse.json(
        { error: 'Aucune matière trouvée. Créez d\'abord des matières.' },
        { status: 400 }
      )
    }

    // Analyser la transcription pour extraire les tâches
    const analysis = await TaskAnalysisService.analyzeTasks(transcription)

    // Associer chaque tâche à une matière via IA
    const tasksWithSubjects = await Promise.all(
      analysis.tasks.map(async (task) => {
        const associatedSubject = await associateTaskToSubject(
          task.title,
          task.description || '',
          subjects
        )

        return {
          ...task,
          subjectId: associatedSubject?.id || null,
          subjectName: associatedSubject?.name || null,
          confidence: associatedSubject?.confidence || 0,
        }
      })
    )

    return NextResponse.json({
      success: true,
      tasks: tasksWithSubjects,
      summary: analysis.summary,
      targetDate: analysis.targetDate,
      subjects: subjects.map((s: any) => ({
        id: s.id,
        name: s.name,
        coefficient: s.coefficient,
      })),
    })

  } catch (error: any) {
    console.error('Erreur POST /api/tasks/associate-subjects:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Associe une tâche à une matière en utilisant l'IA
 */
async function associateTaskToSubject(
  taskTitle: string,
  taskDescription: string,
  subjects: Array<{ id: string; name: string; coefficient: number }>
): Promise<{ id: string; name: string; confidence: number } | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  const OpenAI = require('openai')
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const subjectsList = subjects.map((s) => `- ${s.name} (coef ${s.coefficient})`).join('\n')

  const prompt = `Tu es un assistant qui associe des tâches académiques à des matières.

Tâche à analyser:
Titre: "${taskTitle}"
Description: "${taskDescription || 'Aucune description'}"

Matières disponibles:
${subjectsList}

Associe cette tâche à UNE SEULE matière. Retourne UNIQUEMENT du JSON:
{
  "subjectName": "Nom exact de la matière",
  "confidence": 0.0-1.0
}

Si aucune matière ne correspond clairement, retourne:
{
  "subjectName": null,
  "confidence": 0.0
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant qui associe des tâches à des matières. Tu réponds uniquement en JSON valide.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' as any },
      max_tokens: 200,
    })

    const content = response.choices[0].message.content
    if (!content) return null

    const result = JSON.parse(content)
    const subjectName = result.subjectName

    if (!subjectName) return null

    // Trouver la matière correspondante
    const subject = subjects.find(
      (s) => s.name.toLowerCase().trim() === subjectName.toLowerCase().trim()
    )

    if (!subject) return null

    return {
      id: subject.id,
      name: subject.name,
      confidence: result.confidence || 0.5,
    }
  } catch (error) {
    console.error('Erreur association tâche-matière:', error)
    return null
  }
}

