import { PrismaClient } from '@prisma/client';
import NotificationScheduler from '../src/services/NotificationScheduler.js';
import whatsappService from '../src/services/whatsappService.js';

    const prisma = new PrismaClient();
    
async function displayScheduledNotifications(userId) {
  console.log('\n📅 Notifications programmées pour aujourd\'hui :');
  
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const notifications = await prisma.notificationHistory.findMany({
    where: {
      userId: userId,
      scheduledFor: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    orderBy: {
      scheduledFor: 'asc'
    }
  });

  if (notifications.length === 0) {
    console.log('❌ Aucune notification programmée');
  } else {
    notifications.forEach(notif => {
      const time = notif.scheduledFor.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const status = notif.status === 'pending' ? '⏳' : notif.status === 'sent' ? '✅' : '❌';
      console.log(`${status} ${time} - ${notif.type}: ${notif.content}`);
    });
  }

  // Afficher les prochaines notifications programmées
  console.log('\n⏰ Horaires des prochaines notifications :');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationSettings: true }
  });

  if (user?.notificationSettings) {
    const settings = user.notificationSettings;
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const schedule = [
      { time: settings.morningTime, type: 'Rappel matinal' },
      { time: settings.noonTime, type: 'Vérification de midi' },
      { time: settings.afternoonTime, type: "Rappel de l'après-midi" },
      { time: settings.eveningTime, type: 'Planification du soir' },
      { time: settings.nightTime, type: 'Vérification des habitudes de nuit' }
    ];

    schedule.forEach(({ time, type }) => {
      const [hours, minutes] = time.split(':').map(Number);
      const isPast = hours < currentHour || (hours === currentHour && minutes <= currentMinutes);
      const status = isPast ? '✅' : '⏳';
      console.log(`${status} ${time} - ${type}`);
    });
  }
}

// Vérifier la configuration WhatsApp
console.log('Variables d\'environnement WhatsApp :');
const whatsappConfig = {
  WHATSAPP_APP_ID: process.env.WHATSAPP_APP_ID,
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
};

Object.entries(whatsappConfig).forEach(([key, value]) => {
  console.log(`${key}: ${value ? '✅' : '❌'}`);
});

// Afficher la configuration WhatsApp
console.log('Configuration WhatsApp :');
console.log('API_URL:', whatsappService.API_URL);
console.log('PHONE_NUMBER_ID:', whatsappService.PHONE_NUMBER_ID);

// Démarrer le planificateur
console.log('🚀 Démarrage du planificateur de notifications...');
const scheduler = new NotificationScheduler(whatsappService, prisma);

try {
  await scheduler.start();
  console.log('✨ Planificateur démarré avec succès !');

  // Afficher les notifications programmées pour l'utilisateur de test
  const testUser = await prisma.user.findFirst({
    where: {
      email: 'noah.lugagne@free.fr'
    }
  });

  if (testUser) {
    await displayScheduledNotifications(testUser.id);
  }
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du planificateur:', error);
        process.exit(1);
    }