import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Recherche des utilisateurs...');
    const users = await prisma.user.findMany({
      include: {
        notificationSettings: true
      }
    });

    console.log('\n📊 Utilisateurs trouvés:', users.length);
    users.forEach(user => {
      console.log(`\n👤 Utilisateur: ${user.email}`);
      console.log(`ID: ${user.id}`);
      console.log(`Téléphone: ${user.phoneNumber || 'Non défini'}`);
      console.log(`Notifications: ${user.notificationSettings ? 'Configurées ✅' : 'Non configurées ❌'}`);
      if (user.notificationSettings) {
        console.log('Canaux activés:');
        console.log(`- Email: ${user.notificationSettings.emailEnabled ? '✅' : '❌'}`);
        console.log(`- Push: ${user.notificationSettings.pushEnabled ? '✅' : '❌'}`);
        console.log(`- WhatsApp: ${user.notificationSettings.whatsappEnabled ? '✅' : '❌'}`);
      }
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 