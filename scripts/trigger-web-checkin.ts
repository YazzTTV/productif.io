import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const QUESTION_TEMPLATES = {
  mood: [
    '😊 Comment te sens-tu en ce moment ? (1-10)',
    '😊 Quelle est ton humeur actuellement ? (1-10)',
    '🌟 Comment évalues-tu ton humeur ? (1-10)'
  ],
  focus: [
    '🎯 Quel est ton niveau de concentration ? (1-10)',
    '🎯 Es-tu concentré en ce moment ? (1-10)',
    '🔍 Comment évalues-tu ta capacité de focus actuelle ? (1-10)'
  ],
  motivation: [
    '🔥 Quel est ton niveau de motivation ? (1-10)',
    '💪 Te sens-tu motivé(e) en ce moment ? (1-10)',
    '🚀 Comment est ta motivation aujourd\'hui ? (1-10)'
  ],
  energy: [
    '⚡ Quel est ton niveau d\'énergie ? (1-10)',
    '⚡ Comment te sens-tu niveau énergie ? (1-10)',
    '🔋 Évalue ton niveau d\'énergie actuel (1-10)'
  ],
  stress: [
    '😰 Quel est ton niveau de stress ? (1-10)',
    '😌 Te sens-tu stressé(e) ? (1-10)',
    '💆 Comment évalues-tu ton stress actuellement ? (1-10)'
  ]
}

async function triggerWebCheckIn() {
  try {
    console.log('🧪 Test de question de check-in pour l\'assistant IA web...\n')
    
    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'noah.lugagne@free.fr' }
    })
    
    if (!user) {
      console.log('❌ Utilisateur noah.lugagne@free.fr non trouvé')
      return
    }
    
    console.log(`👤 Utilisateur trouvé: ${user.email} (ID: ${user.id})`)
    
    // Choisir un type aléatoire
    const types = ['mood', 'focus', 'motivation', 'energy', 'stress']
    const randomType = types[Math.floor(Math.random() * types.length)]
    
    // Choisir une question aléatoire pour ce type
    const questions = QUESTION_TEMPLATES[randomType as keyof typeof QUESTION_TEMPLATES]
    const question = questions[Math.floor(Math.random() * questions.length)]
    
    console.log(`📝 Type choisi: ${randomType}`)
    console.log(`❓ Question: ${question}`)
    
    // Enregistrer l'état conversationnel pour l'assistant web
    await prisma.userConversationState.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        state: `awaiting_checkin_${randomType}`,
        data: { 
          type: randomType, 
          timestamp: new Date().toISOString(),
          platform: 'web' // Marquer que c'est pour le web
        }
      },
      update: {
        state: `awaiting_checkin_${randomType}`,
        data: { 
          type: randomType, 
          timestamp: new Date().toISOString(),
          platform: 'web'
        }
      }
    })
    
    // Simuler l'envoi du message dans le chat web en l'ajoutant directement
    // (normalement ce serait fait par le système automatique)
    console.log('\n✅ État conversationnel enregistré.')
    console.log('📱 Va sur /dashboard/assistant-ia et tu devrais voir la question apparaître automatiquement.')
    console.log(`💡 Réponds simplement avec un chiffre de 1 à 10 pour enregistrer ton ${randomType}.`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

triggerWebCheckIn()


