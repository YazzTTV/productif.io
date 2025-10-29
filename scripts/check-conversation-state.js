import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkState() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        whatsappNumber: { contains: '33783642205' }
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      process.exit(1)
    }

    const state = await prisma.userConversationState.findUnique({
      where: { userId: user.id }
    })

    console.log('👤 Utilisateur:', user.email)
    console.log('\n💬 État conversationnel:')
    
    if (state) {
      console.log(`✅ État actif: ${state.state}`)
      console.log(`📅 Créé: ${new Date(state.createdAt).toLocaleString('fr-FR')}`)
      console.log(`🔄 Mis à jour: ${new Date(state.updatedAt).toLocaleString('fr-FR')}`)
      console.log(`📊 Données:`, JSON.stringify(state.data, null, 2))
      
      if (state.expiresAt) {
        console.log(`⏱️  Expire: ${new Date(state.expiresAt).toLocaleString('fr-FR')}`)
      }
      
      console.log('\n💡 Le système attend une réponse de type:', state.state.replace('awaiting_checkin_', ''))
    } else {
      console.log('ℹ️  Aucun état actif (l\'utilisateur n\'a pas de question en attente)')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

checkState()

