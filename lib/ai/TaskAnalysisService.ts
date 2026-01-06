/**
 * Service pour analyser des transcriptions et extraire des tâches structurées
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface Task {
  title: string
  description?: string
  priority: number // 1-5
  energy: number // 1-5 (1 = low energy, 5 = high energy)
  estimatedDuration: number // en minutes
}

export interface TaskAnalysisResult {
  tasks: Task[]
  summary: string
  targetDate: string | null
}

export class TaskAnalysisService {
  /**
   * Analyse une transcription et extrait les tâches structurées
   */
  static async analyzeTasks(transcription: string): Promise<TaskAnalysisResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY non configurée')
    }

    const prompt = `Tu es un assistant qui analyse des transcriptions vocales pour extraire des tâches académiques.

Transcription:
"${transcription}"

Extrais toutes les tâches mentionnées et structure-les. Pour chaque tâche, détermine:
- Le titre (court et clair)
- La description (optionnelle, si des détails sont donnés)
- La priorité (1-5, où 5 est le plus urgent/important)
- Le niveau d'énergie requis (1-5, où 1 = tâche simple, 5 = tâche complexe nécessitant beaucoup de concentration)
- La durée estimée en minutes (basée sur ce qui est mentionné ou une estimation raisonnable)

Si une date est mentionnée, extrais-la au format ISO (YYYY-MM-DD).

Retourne UNIQUEMENT du JSON valide:
{
  "tasks": [
    {
      "title": "Titre de la tâche",
      "description": "Description optionnelle",
      "priority": 1-5,
      "energy": 1-5,
      "estimatedDuration": nombre en minutes
    }
  ],
  "summary": "Résumé en une phrase de ce qui doit être fait",
  "targetDate": "YYYY-MM-DD" ou null
}`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui extrait des tâches académiques depuis des transcriptions. Tu réponds uniquement en JSON valide.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' as any },
        max_tokens: 2000,
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('Réponse vide de l\'IA')
      }

      const result = JSON.parse(content)

      // Validation et normalisation
      const tasks: Task[] = (result.tasks || []).map((task: any) => ({
        title: String(task.title || 'Tâche sans titre').trim(),
        description: task.description ? String(task.description).trim() : undefined,
        priority: Math.max(1, Math.min(5, Number(task.priority) || 3)),
        energy: Math.max(1, Math.min(5, Number(task.energy) || 3)),
        estimatedDuration: Math.max(15, Number(task.estimatedDuration) || 30),
      }))

      return {
        tasks,
        summary: String(result.summary || 'Tâches extraites de la transcription'),
        targetDate: result.targetDate || null,
      }
    } catch (error: any) {
      console.error('Erreur analyse tâches:', error)
      throw new Error(`Erreur lors de l'analyse: ${error.message}`)
    }
  }
}
