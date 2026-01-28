#!/usr/bin/env node

// Script pour modifier manuellement l'heure d'une notification "Rappel début de journée" à 17h50
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🕐 Modification de l\'heure de la notification "Rappel début de journée"\n');

  try {
    // Chercher l'utilisateur (par défaut "yazz", peut être changé via argument)
    const userIdentifier = process.argv[2] || 'yazz';
    console.log(`🔍 Recherche de l'utilisateur: "${userIdentifier}"\n`);

    // Essayer par email d'abord
    let user = await prisma.user.findUnique({
      where: { email: userIdentifier.toLowerCase() },
    });

    // Si pas trouvé par email, essayer par nom
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
      console.log('\n💡 Utilisation: node scripts/modify-morning-notification.js [email|nom]');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Nom: ${user.name || 'N/A'}`);
    console.log(`   - Email: ${user.email}\n`);

    // Chercher la notification MORNING_ANCHOR en attente
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Chercher les notifications MORNING_ANCHOR en attente pour aujourd'hui et demain
    const notifications = await prisma.notificationHistory.findMany({
      where: {
        userId: user.id,
        type: 'MORNING_ANCHOR',
        status: 'pending',
        scheduledFor: {
          gte: today
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    });

    if (notifications.length === 0) {
      console.log('⚠️  Aucune notification MORNING_ANCHOR en attente trouvée.');
      console.log('   Création d\'une nouvelle notification pour aujourd\'hui à 17h50...\n');
      
      // Créer une nouvelle notification pour aujourd'hui à 17h50
      const targetTime = new Date(now);
      targetTime.setHours(17, 50, 0, 0);
      
      // Si l'heure est déjà passée aujourd'hui, programmer pour demain
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
        console.log('   ⏰ L\'heure 17h50 est déjà passée aujourd\'hui, programmation pour demain.');
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
      console.log(`   - Type: ${newNotification.type}`);
      console.log(`   - Programmée pour: ${targetTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
      console.log(`   - Statut: ${newNotification.status}`);
    } else {
      // Modifier la première notification trouvée
      const notification = notifications[0];
      const currentScheduled = new Date(notification.scheduledFor);
      
      console.log(`📋 Notification trouvée:`);
      console.log(`   - ID: ${notification.id}`);
      console.log(`   - Type: ${notification.type}`);
      console.log(`   - Actuellement programmée pour: ${currentScheduled.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
      console.log(`   - Statut: ${notification.status}\n`);

      // Calculer la nouvelle date/heure (17h50)
      const targetTime = new Date(now);
      targetTime.setHours(17, 50, 0, 0);
      
      // Si l'heure est déjà passée aujourd'hui, programmer pour demain
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
        console.log('   ⏰ L\'heure 17h50 est déjà passée aujourd\'hui, programmation pour demain.');
      }

      // Mettre à jour la notification
      const updatedNotification = await prisma.notificationHistory.update({
        where: { id: notification.id },
        data: {
          scheduledFor: targetTime
        }
      });

      console.log(`✅ Notification modifiée:`);
      console.log(`   - ID: ${updatedNotification.id}`);
      console.log(`   - Nouvelle heure: ${targetTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
      console.log(`   - Statut: ${updatedNotification.status}`);
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de la modification:');
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
