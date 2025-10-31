import OpenAI from 'openai'

export interface AnalyzedTask {
  title: string
  description: string
  priority: number // 0-4
  energy: number // 0-3
  estimatedDuration?: number // en minutes
  reasoning: string // Explication du scoring
  suggestedTime?: string // morning, afternoon, evening
}

export interface TaskAnalysisResult {
  tasks: AnalyzedTask[]
  summary: string
  totalEstimatedTime: number
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export class TaskAnalysisService {
  /**
   * Analyser une liste de tâches en langage naturel
   */
  static async analyzeTasks(
    userInput: string, 
    userContext?: any
  ): Promise<TaskAnalysisResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const systemPrompt = `Tu es un assistant IA expert en productivité et gestion du temps.

Ton rôle : analyser une liste de tâches décrite en langage naturel et extraire des informations structurées.

**Échelle de PRIORITÉ (0-4)** :
- 4 : CRITIQUE - Deadline immédiate, bloquant, urgence maximale
- 3 : HAUTE - Important, deadline < 3 jours, impact fort
- 2 : MOYENNE - Contributif, deadline flexible, impact modéré
- 1 : BASSE - Nice-to-have, peut attendre, impact faible
- 0 : OPTIONNELLE - Si temps disponible

**Échelle d'ÉNERGIE (0-3)** :
- 3 : HAUTE - Tâche complexe, créative, longue (2h+), concentration intense
- 2 : MOYENNE - Modérée, attention requise, durée 30min-2h
- 1 : FAIBLE - Simple, répétitive, courte (< 30min)
- 0 : TRÈS FAIBLE - Quasi-automatique, ne demande rien

**Consignes** :
1. Découpe en tâches atomiques si nécessaire (1 tâche = 1 action claire)
2. Déduis la priorité et l'énergie des indices dans le texte
3. Estime une durée réaliste en minutes
4. Suggère un moment optimal (morning/afternoon/evening)
5. Explique ton raisonnement brièvement

**Indices à détecter** :
- Mots d'urgence : "urgent", "important", "deadline", "avant", "impératif"
- Mots de complexité : "analyser", "créer", "développer", "stratégie", "réfléchir"
- Mots de simplicité : "envoyer", "vérifier", "rappeler", "classer", "ranger"
- Durée : "rapide", "long", "2 heures", "toute la matinée"
- Contexte émotionnel : "stressant", "urgent", "tranquille"

**Détection des DEADLINES** :
- "avant 16h" → dueDate à 16h aujourd'hui/demain
- "en fin de journée" → dueDate à 18h
- "ce matin" → dueDate à 11h
- "cet après-midi" → dueDate à 16h
- "avant la réunion de 14h" → dueDate à 13h45

Si une deadline est mentionnée, augmente automatiquement la priorité de +1.

Réponds UNIQUEMENT au format JSON valide.`

    const userPrompt = `Voici ce que l'utilisateur doit faire demain :

"""
${userInput}
"""

${userContext ? `
Contexte utilisateur :
- Objectifs actuels : ${userContext.objectives || 'Non spécifié'}
- Projets en cours : ${userContext.projects || 'Non spécifié'}
` : ''}

Réponds UNIQUEMENT en JSON avec cette structure :
{
  "tasks": [
    {
      "title": "Titre court et clair",
      "description": "Description détaillée",
      "priority": 0-4,
      "energy": 0-3,
      "estimatedDuration": minutes,
      "reasoning": "Explication du scoring",
      "suggestedTime": "morning|afternoon|evening"
    }
  ],
  "summary": "Résumé de la journée planifiée",
  "totalEstimatedTime": minutes_totales}`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' as any }
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('Empty response from OpenAI')
      }

      const result = JSON.parse(content) as TaskAnalysisResult

      // Validation basique
      if (!result.tasks || !Array.isArray(result.tasks)) {
        throw new Error('Format de réponse invalide')
      }

      // Normaliser les valeurs
      result.tasks = result.tasks.map(task => ({
        ...task,
        priority: Math.max(0, Math.min(4, task.priority)),
        energy: Math.max(0, Math.min(3, task.energy)),
        estimatedDuration: task.estimatedDuration || 30
      }))

      // Calculer le temps total estimé si non fourni
      if (!result.totalEstimatedTime) {
        result.totalEstimatedTime = result.tasks.reduce(
          (sum, task) => sum + (task.estimatedDuration || 30), 
          0
        )
      }

      return result

    } catch (error) {
      console.error('Erreur analyse tâches:', error)
      throw error
    }
  }

  /**
   * Calculer le score de priorisation pour l'ordre des tâches
   */
  static calculatePriorityScore(task: AnalyzedTask): number {
    const priorityWeight = 3
    const energyWeight = 1.5
    
    // Bonus pour les tâches haute énergie (à faire le matin)
    const morningBonus = task.energy === 3 ? 2 : 0

    return (task.priority * priorityWeight) + (task.energy * energyWeight) + morningBonus
  }

  /**
   * Organiser les tâches par moment de la journée
   */
  static organizeTasks(tasks: AnalyzedTask[]): {
    morning: AnalyzedTask[]
    afternoon: AnalyzedTask[]
    evening: AnalyzedTask[]
  } {
    const morning: AnalyzedTask[] = []
    const afternoon: AnalyzedTask[] = []
    const evening: AnalyzedTask[] = []

    // Calculer les scores et trier
    const tasksWithScore = tasks.map(task => ({
      task,
      score: this.calculatePriorityScore(task)
    })).sort((a, b) => b.score - a.score)

    // Répartir intelligemment
    tasksWithScore.forEach(({ task }) => {
      if (task.suggestedTime === 'morning' || (task.energy >= 2 && task.priority >= 3)) {
        morning.push(task)
      } else if (task.suggestedTime === 'evening' || (task.energy <= 1 && task.priority <= 1)) {
        evening.push(task)
      } else {
        afternoon.push(task)
      }
    })

    return { morning, afternoon, evening }
  }

  /**
   * Générer un résumé textuel de la planification
   */
  static generatePlanSummary(organized: {
    morning: AnalyzedTask[]
    afternoon: AnalyzedTask[]
    evening: AnalyzedTask[]
  }): string {
    let summary = '📅 *Voici ta journée optimisée :*\n\n'

    if (organized.morning.length > 0) {
      summary += '🌅 *Matin (pic d\'énergie)* :\n'
      organized.morning.forEach((task, idx) => {
        summary += `${idx + 1}. ${task.title} (${this.getPriorityEmoji(task.priority)} ${this.getEnergyLabel(task.energy)})\n`
      })
      summary += '\n'
    }

    if (organized.afternoon.length > 0) {
      summary += '☀️ *Après-midi* :\n'
      organized.afternoon.forEach((task, idx) => {
        summary += `${idx + 1}. ${task.title} (${this.getPriorityEmoji(task.priority)} ${this.getEnergyLabel(task.energy)})\n`
      })
      summary += '\n'
    }

    if (organized.evening.length > 0) {
      summary += '🌆 *Fin de journée (tâches légères)* :\n'
      organized.evening.forEach((task, idx) => {
        summary += `${idx + 1}. ${task.title} (${this.getPriorityEmoji(task.priority)} ${this.getEnergyLabel(task.energy)})\n`
      })
      summary += '\n'
    }

    const totalTasks = organized.morning.length + organized.afternoon.length + organized.evening.length
    summary += `\n✨ *${totalTasks} tâche${totalTasks > 1 ? 's' : ''} planifiée${totalTasks > 1 ? 's' : ''}*`

    return summary
  }

  // Helpers
  private static getPriorityEmoji(priority: number): string {
    const emojis = ['⚪', '🔵', '🟡', '🟠', '🔴']
    return emojis[priority] || '⚪'
  }

  private static getEnergyLabel(energy: number): string {
    const labels = ['⚡ Facile', '⚡⚡ Modéré', '⚡⚡⚡ Intense', '⚡⚡⚡⚡ Très intense']
    return labels[energy] || 'Facile'
  }
}

