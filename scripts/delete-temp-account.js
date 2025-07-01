import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Recherche du compte temporaire...');
    
    // Suppression des entrées dans NotificationHistory
    await prisma.notificationHistory.deleteMany({
      where: {
        userId: '33783642205'
      }
    });
    console.log('✅ Historique des notifications supprimé');

    // Suppression des paramètres de notification
    await prisma.notificationSettings.deleteMany({
      where: {
        userId: '33783642205'
      }
    });
    console.log('✅ Paramètres de notification supprimés');

    // Suppression des conversations WhatsApp
    await prisma.whatsAppConversation.deleteMany({
      where: {
        userId: '33783642205'
      }
    });
    console.log('✅ Conversations WhatsApp supprimées');

    // Suppression du compte temporaire
    await prisma.user.delete({
      where: {
        id: '33783642205'
      }
    });
    console.log('✅ Compte temporaire supprimé avec succès');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 