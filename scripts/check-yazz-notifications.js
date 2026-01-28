#!/usr/bin/env node

// Script de diagnostic pour vérifier l'état des notifications pour yazz
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Diagnostic des notifications pour yazz\n');

  try {
    // Chercher l'utilisateur yazz
    const userIdentifier = process.argv[2] || 'yazz';
    
    let user = await prisma.user.findUnique({
      where: { email: userIdentifier.toLowerCase() },
      include: {
        notificationSettings: true
      }
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          name: {
            contains: userIdentifier,
            mode: 'insensitive'
          }
        },
        include: {
          notificationSettings: true
        }
      });
    }

    if (!user) {
      console.error(`❌ Utilisateur "${userIdentifier}" non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Nom: ${user.name || 'N/A'}`);
    console.log(`   - Email: ${user.email}\n`);

    // Vérifier les préférences de notification
    if (user.notificationSettings) {
      console.log(`📋 Préférences de notification:`);
      console.log(`   - Activées: ${user.notificationSettings.isEnabled ? '✅' : '❌'}`);
      console.log(`   - Push activé: ${user.notificationSettings.pushEnabled ? '✅' : '❌'}`);
      console.log(`   - Rappel matin: ${user.notificationSettings.morningReminder ? '✅' : '❌'}`);
      console.log(`   - Heure matin: ${user.notificationSettings.morningTime || 'N/A'}`);
      console.log(`   - Plage horaire: ${user.notificationSettings.startHour}h - ${user.notificationSettings.endHour}h`);
      console.log(`   - Jours autorisés: ${user.notificationSettings.allowedDays?.join(', ') || 'N/A'}`);
      console.log(`   - Timezone: ${user.notificationSettings.timezone || 'N/A'}\n`);
    } else {
      console.log(`⚠️  Aucune préférence de notification trouvée\n`);
    }

    // Vérifier les notifications MORNING_ANCHOR
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    console.log(`📅 Recherche des notifications MORNING_ANCHOR:`);
    console.log(`   - Aujourd'hui: ${today.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
    console.log(`   - Demain: ${tomorrow.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
    console.log(`   - Après-demain: ${dayAfterTomorrow.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n`);

    const notifications = await prisma.notificationHistory.findMany({
      where: {
        userId: user.id,
        type: 'MORNING_ANCHOR',
        scheduledFor: {
          gte: today
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    });

    if (notifications.length === 0) {
      console.log(`❌ Aucune notification MORNING_ANCHOR trouvée pour aujourd'hui et les jours suivants\n`);
    } else {
      console.log(`✅ ${notifications.length} notification(s) trouvée(s):\n`);
      notifications.forEach((notif, idx) => {
        const scheduledDate = new Date(notif.scheduledFor);
        const isPast = scheduledDate < now;
        console.log(`   ${idx + 1}. ID: ${notif.id}`);
        console.log(`      - Type: ${notif.type}`);
        console.log(`      - Statut: ${notif.status}`);
        console.log(`      - Programmée pour: ${scheduledDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
        console.log(`      - ${isPast ? '⚠️  PASSÉE' : '⏰ À VENIR'}`);
        console.log(`      - Titre push: ${notif.pushTitle || 'N/A'}`);
        console.log(`      - Corps push: ${notif.pushBody || 'N/A'}`);
        console.log('');
      });
    }

    // Vérifier la fenêtre de traitement du scheduler
    const schedulerWindowStart = new Date(now.getTime() - 12 * 60 * 1000); // 12 minutes avant
    const schedulerWindowEnd = new Date(now.getTime() + 12 * 60 * 1000); // 12 minutes après

    console.log(`🕐 Fenêtre de traitement du scheduler:`);
    console.log(`   - Début: ${schedulerWindowStart.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
    console.log(`   - Fin: ${schedulerWindowEnd.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
    console.log(`   - Maintenant: ${now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}\n`);

    const notificationsInWindow = notifications.filter(notif => {
      const scheduledDate = new Date(notif.scheduledFor);
      return scheduledDate >= schedulerWindowStart && scheduledDate <= schedulerWindowEnd && notif.status === 'pending';
    });

    if (notificationsInWindow.length === 0) {
      console.log(`❌ Aucune notification dans la fenêtre de traitement avec statut "pending"\n`);
    } else {
      console.log(`✅ ${notificationsInWindow.length} notification(s) dans la fenêtre de traitement:\n`);
      notificationsInWindow.forEach((notif, idx) => {
        const scheduledDate = new Date(notif.scheduledFor);
        console.log(`   ${idx + 1}. ID: ${notif.id} - ${scheduledDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
      });
    }

    // Vérifier les tokens Android
    const androidTokens = await prisma.pushToken.findMany({
      where: {
        userId: user.id,
        platform: 'android'
      }
    });

    console.log(`\n📱 Tokens Android: ${androidTokens.length}`);
    if (androidTokens.length > 0) {
      androidTokens.forEach((token, idx) => {
        console.log(`   ${idx + 1}. ${token.token.substring(0, 30)}... (créé: ${token.createdAt.toLocaleString('fr-FR')})`);
      });
    } else {
      console.log('   ⚠️  Aucun token Android trouvé');
    }

  } catch (error) {
    console.error('\n❌ Erreur:');
    console.error(error);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
