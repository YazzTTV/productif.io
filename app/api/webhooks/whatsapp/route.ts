import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDeepWorkCommand } from '@/lib/agent/handlers/deepwork.handler'
import { generateApiToken } from '@/lib/api-token'
import { handleJournalVoiceNote, handleJournalTextCommand } from '@/lib/agent/handlers/journal.handler'
import { handleBehaviorCheckInCommand } from '@/lib/agent/handlers/behavior.handler'
import { TrialService } from '@/lib/trial/TrialService'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

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

  const name = 'Agent IA (Deep Work + Journal + Behavior)'
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
      
      await sendWhatsAppMessage(phoneNumber, message)
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

    // 1) Audio → Journal
    if (messageType === 'audio' && audioId) {
      await handleJournalVoiceNote(audioId, user.id, phoneNumber, apiToken)
      return new NextResponse('OK', { status: 200 })
    }

    // 2) Text → Journal commands
    const journalHandled = await handleJournalTextCommand(messageText, user.id, phoneNumber, apiToken)
    if (journalHandled) return new NextResponse('OK', { status: 200 })

    // 3) Text → Behavior commands
    const behaviorHandled = await handleBehaviorCheckInCommand(messageText, user.id, phoneNumber, apiToken)
    if (behaviorHandled) return new NextResponse('OK', { status: 200 })

    // 4) Delegate to Deep Work conversational handler
    const handled = await handleDeepWorkCommand(messageText, user.id, phoneNumber, apiToken)
    if (handled) return new NextResponse('OK', { status: 200 })

    return NextResponse.json({ status: 'ignored', reason: 'no deepwork command' })
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message || 'Unknown' }, { status: 500 })
  }
}


