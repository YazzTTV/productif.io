import { whatsappService } from '@/lib/whatsapp'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Handler pour les demandes d'aide, de guidance et d'explication de processus
 */
export async function handleHelpRequest(
  message: string,
  userId: string,
  phoneNumber: string,
  userContext?: any
): Promise<boolean> {
  // Détecter si c'est une demande d'aide
  const lowerMessage = message.toLowerCase()
  
  // Patterns spécifiques pour les demandes d'aide (prioritaires)
  const helpPatterns = [
    /comment\s+(je\s+)?(peux|puis)[\s-]?(je)?\s+faire/i,
    /comment\s+faire\s+(la\s+)?(tâche|tache)/i,
    /(c\'?est\s+quoi|c\'?est\s+que)\s+(le\s+)?(processus|process)/i,
    /(processus|process|étapes|etapes|procédure)\s+(pour|de)/i,
    /comment\s+(procéder|proceder|réaliser|realiser|accomplir|effectuer)/i,
    /(explique|explique[\s-]?moi)\s+(le\s+)?(processus|process|comment)/i,
    /(guide|guidance|tutoriel|méthode|façon)\s+(pour|de|moi)/i,
    /(je\s+)?(ne\s+)?sais\s+pas\s+(comment|comment\s+faire)/i,
    /(je\s+)?(ne\s+)?comprends?\s+pas/i,
    /aide[\s-]?moi\s+(à|a)\s+(faire|comprendre|réaliser)/i,
    /peux[\s-]?tu\s+m\'?aider/i,
    /comment\s+faire\s+pour/i
  ]
  
  // Mots-clés simples
  const helpKeywords = [
    'comment faire', 'comment je peux', 'comment puis-je', 'comment puis je',
    'processus', 'process', 'étapes', 'étape', 'procédure',
    'aide-moi', 'aide moi', 'peux-tu m\'aider', 'peux tu m\'aider',
    'explique-moi', 'explique moi', 'comment procéder',
    'guide-moi', 'guidance', 'tutoriel', 'méthode', 'façon de faire',
    'je ne sais pas comment', 'je sais pas comment',
    'je comprends pas', 'je comprend pas',
    'c\'est quoi le', 'cest quoi le', 'qu\'est-ce que le'
  ]

  // Vérifier d'abord les patterns (plus précis)
  const matchesPattern = helpPatterns.some(pattern => pattern.test(message))
  
  // Vérifier ensuite les mots-clés
  const matchesKeyword = helpKeywords.some(keyword => lowerMessage.includes(keyword))
  
  // Si le message contient "comment" OU "processus" ET ne commence pas par un emoji de création de tâche
  const hasHelpIndicator = (lowerMessage.includes('comment') || lowerMessage.includes('processus') || lowerMessage.includes('process')) 
    && !message.match(/^[📝⚙️✅]/) // Exclure les messages qui commencent par des emojis de commande
  
  const isHelpRequest = matchesPattern || matchesKeyword || hasHelpIndicator
  
  if (!isHelpRequest) {
    return false
  }

  try {
    // Récupérer le contexte utilisateur si non fourni
    if (!userContext) {
      userContext = await getUserContext(userId)
    }

    // Générer une réponse d'aide contextuelle avec l'IA
    const helpResponse = await generateHelpResponse(message, userId, userContext)
    
    await whatsappService.sendMessage(phoneNumber, helpResponse)
    
    return true
  } catch (error) {
    console.error('Erreur dans handleHelpRequest:', error)
    // En cas d'erreur, envoyer une réponse de fallback
    await whatsappService.sendMessage(
      phoneNumber,
      "🤔 Je suis là pour t'aider ! Peux-tu préciser ce sur quoi tu as besoin d'aide ?\n\n" +
      "Par exemple :\n" +
      "• Comment planifier ma journée ?\n" +
      "• Comment utiliser le Deep Work ?\n" +
      "• Comment créer une tâche ?\n" +
      "• Comment être plus productif ?"
    )
    return true
  }
}

/**
 * Génère une réponse d'aide contextuelle et personnalisée
 */
async function generateHelpResponse(
  message: string,
  userId: string,
  userContext: any
): Promise<string> {
  const systemPrompt = `Tu es l'assistant IA personnel de productivité Productif.io.

Ton rôle : Aider l'utilisateur à comprendre comment faire quelque chose, lui expliquer un processus, ou le guider dans la réalisation d'une tâche.

**STYLE DE RÉPONSE** :
- Sois clair, concis et actionnable
- Utilise des emojis pertinents pour rendre la réponse agréable
- Structure ta réponse avec des étapes numérotées si c'est un processus
- Donne des exemples concrets quand c'est pertinent
- Sois encourageant et bienveillant
- Limite-toi à 300 mots maximum

**CONTEXTE UTILISATEUR** :
- ${userContext.pendingTasks || 0} tâche(s) en attente
- ${userContext.completedToday || 0} tâche(s) complétée(s) aujourd'hui
- Session Deep Work active : ${userContext.hasActiveSession ? 'Oui' : 'Non'}
- Niveau d'énergie : ${userContext.energyLevel || 'moyen'}

**FONCTIONNALITÉS DISPONIBLES DANS PRODUCTIF.IO** :
1. **Création de tâches** : L'utilisateur peut dire "j'ai à faire X" ou "créer une tâche X"
2. **Planification intelligente** : "planifie demain" ou "organise ma journée"
3. **Deep Work** : "je commence à travailler" pour démarrer une session de concentration
4. **Journaling** : "note de ma journée" pour enregistrer sa journée
5. **Habitudes** : Suivi des habitudes quotidiennes
6. **Statistiques** : Voir ses performances et progrès

**TYPES D'AIDE COURANTS** :
- Comment planifier efficacement sa journée
- Comment utiliser le Deep Work pour se concentrer
- Comment créer et gérer des tâches
- Comment être plus productif
- Comment organiser son temps
- Comment gérer ses priorités
- Comment suivre ses habitudes
- Comment utiliser les fonctionnalités de Productif.io

Si la demande est vague, pose des questions pour clarifier ou donne des exemples de ce que tu peux aider.

Réponds de manière naturelle et conversationnelle, comme un ami bienveillant qui veut vraiment aider.`;

  const userPrompt = `Demande de l'utilisateur : "${message}"

Génère une réponse d'aide utile, claire et actionnable. Si c'est un processus, décompose-le en étapes. Si c'est vague, propose des options ou pose des questions pour clarifier.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const helpText = response.choices[0].message.content || 
      "Je suis là pour t'aider ! Peux-tu préciser ce sur quoi tu as besoin d'aide ? 🤔"

    // Ajouter une suggestion de suivi si pertinent
    const followUpSuggestion = getFollowUpSuggestion(message, userContext)
    
    return helpText + (followUpSuggestion ? `\n\n${followUpSuggestion}` : '')
  } catch (error) {
    console.error('Erreur génération réponse d\'aide:', error)
    throw error
  }
}

/**
 * Génère une suggestion de suivi basée sur la demande
 */
function getFollowUpSuggestion(message: string, userContext: any): string {
  const lowerMessage = message.toLowerCase()
  
  // Suggestions contextuelles
  if (lowerMessage.includes('planif') || lowerMessage.includes('organis')) {
    return "💡 *Astuce :* Tu peux me dire \"planifie demain\" et je t'aiderai à organiser ta journée !"
  }
  
  if (lowerMessage.includes('tâche') || lowerMessage.includes('tache') || lowerMessage.includes('todo')) {
    if (userContext.pendingTasks > 0) {
      return `📋 Tu as ${userContext.pendingTasks} tâche(s) en attente. Dis-moi \"mes tâches\" pour les voir !`
    }
    return "💡 *Astuce :* Dis-moi simplement \"j'ai à faire X\" et je créerai la tâche pour toi !"
  }
  
  if (lowerMessage.includes('concentr') || lowerMessage.includes('travail') || lowerMessage.includes('productif')) {
    if (!userContext.hasActiveSession) {
      return "🚀 *Astuce :* Dis-moi \"je commence à travailler\" pour démarrer une session Deep Work !"
    }
  }
  
  if (lowerMessage.includes('habitude')) {
    return "💪 *Astuce :* Je peux t'aider à suivre tes habitudes quotidiennes. Dis-moi \"mes habitudes\" !"
  }
  
  return ""
}

/**
 * Récupère le contexte utilisateur
 */
async function getUserContext(userId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [pendingTasks, completedToday, activeSession, habits] = await Promise.all([
      prisma.task.count({
        where: {
          userId,
          completed: false
        }
      }),
      prisma.task.count({
        where: {
          userId,
          dueDate: { gte: today, lt: tomorrow },
          completed: true
        }
      }),
      prisma.deepWorkSession.findFirst({
        where: {
          userId,
          status: 'active'
        }
      }),
      prisma.habit.count({
        where: { userId }
      })
    ])

    // Estimer le niveau d'énergie basé sur l'heure
    const hour = new Date().getHours()
    let energyLevel = 'moyen'
    if (hour >= 8 && hour < 12) energyLevel = 'élevé'
    else if (hour >= 20 || hour < 7) energyLevel = 'faible'

    return {
      pendingTasks,
      completedToday,
      hasActiveSession: !!activeSession,
      todayHabits: habits,
      energyLevel
    }
  } catch (error) {
    console.error('Erreur récupération contexte utilisateur:', error)
    return {
      pendingTasks: 0,
      completedToday: 0,
      hasActiveSession: false,
      todayHabits: 0,
      energyLevel: 'moyen'
    }
  }
}

