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

    // Contexte date complet pour que l'IA interprète correctement les dates relatives
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    // Calculer demain explicitement (évite les erreurs de l'IA)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayOfWeek = today.toLocaleDateString('fr-FR', { weekday: 'long' }); // ex: "jeudi"
    const dayOfWeekEn = today.toLocaleDateString('en-US', { weekday: 'long' }); // ex: "Thursday"
    const monthName = today.toLocaleDateString('fr-FR', { month: 'long' }); // ex: "janvier"

    const prompt = `Tu es un assistant qui analyse des transcriptions vocales pour extraire des tâches académiques.

=== CONTEXTE TEMPOREL (OBLIGATOIRE - nous sommes le ${todayStr}) ===
- AUJOURD'HUI = ${todayStr} (${dayOfWeek} ${today.getDate()} ${monthName} ${today.getFullYear()})
- DEMAIN = ${tomorrowStr} (si l'utilisateur dit "demain", "Demain", "DEMAIN" → utilise ${tomorrowStr})
- L'année actuelle est ${today.getFullYear()}. N'utilise JAMAIS ${today.getFullYear() - 1} ou une année passée.
- Si l'utilisateur ne mentionne AUCUNE date: utilise ${todayStr}

=== Transcription de l'utilisateur ===
"${transcription}"

=== Instructions ===
Extrais toutes les tâches mentionnées. Pour chaque tâche:
- title: court et clair
- description: optionnel
- priority: 1-5 (5 = plus urgent)
- energy: 1-5 (5 = nécessite beaucoup de concentration, 1 = tâche simple)
- estimatedDuration: en minutes

=== ESTIMATION AUTOMATIQUE de la difficulté et de l'énergie ===
Si l'utilisateur NE PRÉCISE PAS explicitement la difficulté ou le niveau d'énergie dans sa transcription, ESTIME-les automatiquement selon le type de tâche:

**Niveau d'énergie (energy) - Estimation automatique:**
- Révision simple, lecture, exercices basiques → 1-2 (faible énergie)
- Exercices standards, devoirs maison → 2-3 (énergie modérée)
- Contrôle, examen blanc, projet complexe → 4-5 (haute énergie)
- Dissertation, mémoire, recherche approfondie → 5 (énergie maximale)

**Priorité (priority) - Estimation automatique:**
- Si l'utilisateur mentionne "urgent", "important", "prioritaire" → 4-5
- Si l'utilisateur mentionne "pas urgent", "peut attendre" → 1-2
- Sinon, estime selon le contexte: contrôle/examen proche → 4-5, révision générale → 2-3

**IMPORTANT:** Si l'utilisateur précise explicitement "facile", "difficile", "urgent", "pas urgent", etc., RESPECTE sa demande. Sinon, ESTIME intelligemment.

=== RÈGLES pour targetDate (YYYY-MM-DD) - TRÈS IMPORTANT ===
- "demain", "Demain", "DEMAIN" (au début ou dans la phrase) → ${tomorrowStr} (PAS ${todayStr})
- "aujourd'hui", "ce soir", "cet après-midi", pas de date mentionnée → ${todayStr}
- "après-demain" → 2 jours après ${todayStr}
- "lundi", "mardi", etc. → le prochain jour de ce nom (si aujourd'hui c'est ${dayOfWeek}, "lundi" = prochain lundi)
- "lundi prochain", "mardi prochain" → le jour indiqué dans la SEMAINE PROCHAINE
- "la semaine prochaine" → lundi de la semaine prochaine
- "dans X jours" → ${todayStr} + X jours
- Date précise "le 15 janvier", "le 20/01" → convertis en YYYY-MM-DD (année = ${today.getFullYear()} si non précisée)
- Si ambigu ou date passée détectée → ${todayStr}

targetDate est OBLIGATOIRE: retourne TOUJOURS une date au format YYYY-MM-DD, jamais null.

Retourne UNIQUEMENT ce JSON (pas de texte avant/après):
{
  "tasks": [{"title": "...", "description": "...", "priority": 1-5, "energy": 1-5, "estimatedDuration": 60}],
  "summary": "Résumé court",
  "targetDate": "YYYY-MM-DD"
}`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant qui extrait des tâches académiques depuis des transcriptions vocales. Tu réponds UNIQUEMENT avec un objet JSON valide. 

RÈGLES IMPORTANTES:
1. Pour targetDate: tu DOIS toujours retourner une date YYYY-MM-DD en te basant sur le contexte temporel fourni. Interprète correctement: aujourd'hui, demain, les jours de la semaine (lundi, mardi...), "la semaine prochaine", "dans X jours", etc.

2. Pour priority et energy: 
   - Si l'utilisateur précise explicitement "urgent", "important", "prioritaire", "facile", "difficile", "simple", "complexe", etc. → RESPECTE sa demande
   - Sinon, ESTIME intelligemment selon le type de tâche (révision simple = energy 1-2, contrôle = energy 4-5, etc.)

3. Analyse chaque tâche pour déterminer sa difficulté réelle et son besoin en concentration, même si l'utilisateur ne le précise pas explicitement.`,
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
