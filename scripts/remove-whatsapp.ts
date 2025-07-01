import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Recherche de l\'utilisateur...');
    
    // Mise à jour de l'utilisateur
    const user = await prisma.user.update({
      where: {
        email: 'arthur.balerna@gmail.com'
      },
      data: {
        whatsappNumber: null
      }
    });

    console.log('✅ Association WhatsApp supprimée pour l\'utilisateur:', user.email);

    // Suppression des conversations WhatsApp
    await prisma.whatsAppConversation.deleteMany({
      where: {
        userId: user.id
      }
    });
    console.log('✅ Conversations WhatsApp supprimées');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 