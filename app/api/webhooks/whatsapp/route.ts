import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDeepWorkCommand } from '@/lib/agent/handlers/deepwork.handler'
import { generateApiToken } from '@/lib/api-token'
import { handleJournalTextCommand, transcribeVoiceMessage } from '@/lib/agent/handlers/journal.handler'
import { handleBehaviorCheckInCommand } from '@/lib/agent/handlers/behavior.handler'
import { handleTaskPlanningCommand } from '@/lib/agent/handlers/task-planning.handler'
import { handleHelpRequest } from '@/lib/agent/handlers/help.handler'
import { TrialService } from '@/lib/trial/TrialService'
import { whatsappService } from '@/lib/whatsapp'
import { IntentDetectionService } from '@/lib/ai/IntentDetectionService'
import { IntelligentActionRouter } from '@/lib/agent/IntelligentActionRouter'

// GET: Verification endpoint for WhatsApp webhook (optional)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge || '', { status: 200 })
  }
  return NextResponse.json({ status: 'ok' })
}

// Helper: get or create an API token for the user with required scopes
async function getOrCreateApiTokenForUser(userId: string): Promise<string> {
  const required = ['deepwork:read', 'deepwork:write', 'tasks:read', 'tasks:write', 'journal:read', 'journal:write', 'behavior:read', 'behavior:write']
  const existing = await prisma.apiToken.findFirst({
    where: { userId, scopes: { hasEvery: required } },
    orderBy: { createdAt: 'desc' }
  })
  if (existing?.token) return existing.token

  const name = 'Agent IA (Deep Work + Journal + Behavior + Task Planning)'
  const { token } = await generateApiToken({ name, userId, scopes: required })
  return token
}

// POST: Receive WhatsApp messages and dispatch Deep Work commands
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // Try to parse WhatsApp Cloud API format
    // See: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples/ 
    let messageText = ''
    let phoneNumber = ''
    let messageType: string | undefined
    let audioId: string | undefined

    const entry = Array.isArray(body?.entry) ? body.entry[0] : undefined
    const change = Array.isArray(entry?.changes) ? entry.changes[0] : undefined
    const value = change?.value
    const messages = Array.isArray(value?.messages) ? value.messages : []
    if (messages.length > 0) {
      const msg = messages[0]
      messageType = msg?.type
      messageText = msg?.text?.body || ''
      phoneNumber = msg?.from || ''
      if (messageType === 'audio') {
        audioId = msg?.audio?.id
      }
    } else {
      // Fallback simple body shape for tests
      messageText = body?.messageText || body?.text || ''
      phoneNumber = body?.phoneNumber || body?.from || ''
    }

    if (!messageText || !phoneNumber) {
      return NextResponse.json({ status: 'ignored', reason: 'no message or phone' })
    }

    // Find user by whatsappNumber
    const user = await prisma.user.findFirst({ where: { whatsappNumber: { equals: phoneNumber.replace(/\D/g, '') } } })
    if (!user) {
      return NextResponse.json({ status: 'ignored', reason: 'user not found for phone' })
    }

    // Vérifier l'accès (trial ou subscription)
    const accessCheck = await TrialService.hasAccess(user.id)
    
    if (!accessCheck.hasAccess) {
      // Message personnalisé selon le statut
      let message = '🚨 *Ton essai gratuit est terminé !*\n\n'
      message += 'Pour continuer à utiliser Productif.io :\n\n'
      message += `👉 ${process.env.NEXT_PUBLIC_APP_URL}/upgrade\n\n`
      message += '💡 *Offre spéciale :* Commencez maintenant et profitez de toutes les fonctionnalités.\n\n'
      message += 'À très bientôt ! 💙'
      
      await whatsappService.sendMessage(phoneNumber, message)
      return new NextResponse('OK', { status: 200 })
    }
    
    // Afficher un rappel si trial actif avec peu de jours restants
    if (accessCheck.status === 'trial_active' && accessCheck.trialDaysLeft !== undefined && accessCheck.trialDaysLeft <= 2) {
      // Vérifier si un rappel a déjà été envoyé aujourd'hui
      const today = new Date().toDateString()
      const alreadyReminded = await TrialService.hasNotificationBeenSent(user.id, `whatsapp-reminder-${today}`)
      
      if (!alreadyReminded) {
        let reminderMessage = `⏰ *Rappel :* Plus que ${accessCheck.trialDaysLeft} jour${accessCheck.trialDaysLeft > 1 ? 's' : ''} d'essai gratuit !\n\n`
        reminderMessage += `Pense à t'abonner : ${process.env.NEXT_PUBLIC_APP_URL}/upgrade`
        
        await sendWhatsAppMessage(phoneNumber, reminderMessage)
        await TrialService.recordNotificationSent(user.id, `whatsapp-reminder-${today}`, 'whatsapp')
      }
    }

    // Ensure we have an API token for calling internal Deep Work API
    const apiToken = await getOrCreateApiTokenForUser(user.id)

    // 1) Audio → Transcrire et traiter comme conversation normale
    // Le journaling sera géré automatiquement par SpecialHabitsHandler lors de la complétion de "note de sa journée"
    if (messageType === 'audio' && audioId) {
      const transcriptionResult = await transcribeVoiceMessage(audioId, phoneNumber)
      
      if (transcriptionResult.success && transcriptionResult.text) {
        // Traiter comme une conversation normale avec l'agent IA
        // Le journaling sera enregistré uniquement quand l'utilisateur complète "note de sa journée" via SpecialHabitsHandler
        messageText = transcriptionResult.text
        console.log('🎙️ Message vocal transcrit traité comme conversation:', messageText)
      } else {
        // Erreur de transcription, répondre avec un message d'erreur
        await sendWhatsAppMessage(
          phoneNumber,
          "❌ Je n'ai pas pu transcrire ton message vocal. Réessaye dans quelques instants."
        )
        return new NextResponse('OK', { status: 200 })
      }
    }

    // 1.5) Text → Help requests (doit être AVANT task planning pour éviter les faux positifs)
    // Détecter les demandes d'aide en priorité pour éviter qu'elles soient traitées comme des créations de tâches
    const userContext = await getUserContext(user.id)
    const helpHandled = await handleHelpRequest(messageText, user.id, phoneNumber, userContext)
    if (helpHandled) return new NextResponse('OK', { status: 200 })

    // 2) Text → Task Planning commands (doit être avant les autres pour intercepter les demandes de planification)
    const planningHandled = await handleTaskPlanningCommand(messageText, user.id, phoneNumber, apiToken)
    if (planningHandled) return new NextResponse('OK', { status: 200 })

    // 3) Text → Journal commands
    const journalHandled = await handleJournalTextCommand(messageText, user.id, phoneNumber, apiToken)
    if (journalHandled) return new NextResponse('OK', { status: 200 })

    // 4) Text → Behavior commands
    const behaviorHandled = await handleBehaviorCheckInCommand(messageText, user.id, phoneNumber, apiToken)
    if (behaviorHandled) return new NextResponse('OK', { status: 200 })

    // 5) Delegate to Deep Work conversational handler
    const handled = await handleDeepWorkCommand(messageText, user.id, phoneNumber, apiToken)
    if (handled) return new NextResponse('OK', { status: 200 })

    // 6) NOUVEAU SYSTÈME INTELLIGENT : Détection d'intention par IA (fallback)
    // Si aucun handler existant n'a géré le message, utiliser le système intelligent
    try {
      console.log(`📨 Message non géré par handlers existants: "${messageText}"`)
      console.log('🤖 Détection d\'intention avec IA...')

      const startTime = Date.now()

      // Récupérer le contexte utilisateur (déjà récupéré plus haut, réutiliser)
      // const userContext = await getUserContext(user.id)

      // Détecter l'intention avec l'IA
      const intent = await IntentDetectionService.detectIntent(messageText, userContext)
      const intentTime = Date.now() - startTime

      console.log(`🎯 Intention détectée: ${intent.category} (confiance: ${(intent.confidence * 100).toFixed(0)}%)`)

      // Router vers l'action appropriée
      const result = await IntelligentActionRouter.routeIntent(
        intent,
        user.id,
        phoneNumber,
        apiToken,
        messageText
      )

      const totalTime = Date.now() - startTime

      // Si action non gérée, générer réponse conversationnelle
      if (!result.handled || result.response.includes("pas compris")) {
        console.log('💬 Génération réponse conversationnelle...')
        
        const conversationalResponse = await IntentDetectionService.generateConversationalResponse(
          messageText,
          intent,
          userContext
        )

        await sendWhatsAppMessage(phoneNumber, conversationalResponse)

        // Log de l'interaction
        await logInteraction(user.id, messageText, intent, {
          ...result,
          responseTime: totalTime
        })

        return new NextResponse('OK', { status: 200 })
      } else {
        // Envoyer la réponse générée par l'action (seulement si elle n'est pas vide)
        // Certains handlers (comme help.handler) envoient déjà le message directement
        if (result.response && result.response.trim().length > 0) {
          await sendWhatsAppMessage(phoneNumber, result.response)
        }

        // Log de l'interaction
        await logInteraction(user.id, messageText, intent, {
          ...result,
          responseTime: totalTime
        })

        return new NextResponse('OK', { status: 200 })
      }
    } catch (error) {
      console.error('❌ Erreur système intelligent:', error)
      // En cas d'erreur, ne pas bloquer - retourner OK pour éviter les retries
      return new NextResponse('OK', { status: 200 })
    }
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message || 'Unknown' }, { status: 500 })
  }
}

// ===== FONCTIONS HELPERS =====

async function getUserContext(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
    ]);

    // Estimer le niveau d'énergie basé sur l'heure
    const hour = new Date().getHours();
    let energyLevel = 'moyen';
    if (hour >= 8 && hour < 12) energyLevel = 'élevé';
    else if (hour >= 20 || hour < 7) energyLevel = 'faible';

    return {
      pendingTasks,
      completedToday,
      hasActiveSession: !!activeSession,
      todayHabits: habits,
      energyLevel
    };
  } catch (error) {
    console.error('Erreur récupération contexte utilisateur:', error);
    return {};
  }
}

async function logInteraction(
  userId: string,
  message: string,
  intent: any,
  result: any
) {
  try {
    await prisma.agentInteraction.create({
      data: {
        userId,
        message,
        intentType: intent.type,
        intentCategory: intent.category,
        confidence: intent.confidence,
        actionExecuted: result.actionExecuted || 'none',
        handled: result.handled,
        emotionalContext: intent.emotionalContext,
        responseTime: result.responseTime
      }
    });
  } catch (error) {
    console.error('Erreur log interaction:', error);
  }
}


