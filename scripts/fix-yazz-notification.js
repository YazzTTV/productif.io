#!/usr/bin/env node

// Script pour corriger la notification MORNING_ANCHOR pour yazz
// - Trouve la notification failed
// - La reprogramme pour 17:50 (ou maintenant + 2 min si 17:50 est passé)
// - Change le statut à "pending"
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Correction de la notification MORNING_ANCHOR pour yazz\n');

  try {
    const userIdentifier = process.argv[2] || 'yazz';
    
    let user = await prisma.user.findUnique({
      where: { email: userIdentifier.toLowerCase() }
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          name: {
            contains: userIdentifier,
            mode: 'insensitive'
          }
        }
      });
    }

    if (!user) {
      console.error(`❌ Utilisateur "${userIdentifier}" non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.name || user.email} (ID: ${user.id})\n`);

    // Chercher toutes les notifications MORNING_ANCHOR (failed, pending, etc.)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const notifications = await prisma.notificationHistory.findMany({
      where: {
        userId: user.id,
        type: 'MORNING_ANCHOR',
        scheduledFor: {
          gte: today
        }
      },
      orderBy: {
        scheduledFor: 'desc'
      }
    });

    if (notifications.length === 0) {
      console.log('⚠️  Aucune notification trouvée. Création d\'une nouvelle notification...\n');
      
      // Créer une nouvelle notification
      const targetTime = new Date(now);
      targetTime.setHours(17, 50, 0, 0);
      
      // Si 17:50 est passé, programmer pour dans 2 minutes (pour test immédiat)
      if (targetTime < now) {
        targetTime.setTime(now.getTime() + 2 * 60 * 1000);
        console.log('   ⏰ 17h50 est passé, programmation pour dans 2 minutes (test immédiat).');
      }

      const newNotification = await prisma.notificationHistory.create({
        data: {
          userId: user.id,
          type: 'MORNING_ANCHOR',
          content: '🌅 Ta journée est prête',
          pushTitle: '🌅 Ta journée est prête',
          pushBody: 'Bonjour ! Voici un résumé de ta journée.',
          scheduledFor: targetTime,
          status: 'pending'
        }
      });

      console.log(`✅ Notification créée:`);
      console.log(`   - ID: ${newNotification.id}`);
      console.log(`   - Statut: ${newNotification.status}`);
      console.log(`   - Programmée pour: ${targetTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
      console.log(`   - (UTC: ${targetTime.toISOString()})\n`);
    } else {
      // Prendre la première notification (la plus récente)
      const notification = notifications[0];
      const currentScheduled = new Date(notification.scheduledFor);
      
      console.log(`📋 Notification trouvée:`);
      console.log(`   - ID: ${notification.id}`);
      console.log(`   - Statut actuel: ${notification.status}`);
      console.log(`   - Programmée pour: ${currentScheduled.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
      console.log(`   - (UTC: ${currentScheduled.toISOString()})\n`);

      // Calculer la nouvelle date/heure (17h50 aujourd'hui)
      const targetTime = new Date(now);
      targetTime.setHours(17, 50, 0, 0);
      
      // Si 17:50 est passé, programmer pour dans 2 minutes (pour test immédiat)
      if (targetTime < now) {
        targetTime.setTime(now.getTime() + 2 * 60 * 1000);
        console.log('   ⏰ 17h50 est passé, programmation pour dans 2 minutes (test immédiat).');
      } else {
        console.log(`   ⏰ Reprogrammation pour 17h50 aujourd'hui.`);
      }

      // Mettre à jour la notification
      const updatedNotification = await prisma.notificationHistory.update({
        where: { id: notification.id },
        data: {
          scheduledFor: targetTime,
          status: 'pending' // Remettre en pending
        }
      });

      console.log(`✅ Notification corrigée:`);
      console.log(`   - ID: ${updatedNotification.id}`);
      console.log(`   - Nouveau statut: ${updatedNotification.status}`);
      console.log(`   - Nouvelle heure: ${targetTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
      console.log(`   - (UTC: ${targetTime.toISOString()})\n`);
    }

    console.log(`⏰ Le scheduler traitera cette notification dans la prochaine fenêtre de traitement.\n`);

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
