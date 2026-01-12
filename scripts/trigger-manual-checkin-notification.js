#!/usr/bin/env node

/**
 * Script pour déclencher manuellement une notification mood/stress/focus
 * Usage: node scripts/trigger-manual-checkin-notification.js <userId> <type>
 * Exemple: node scripts/trigger-manual-checkin-notification.js cma6li3j1000ca64sisjbjyfs mood
 */

import { PrismaClient } from '@prisma/client';
import NotificationService from '../src/services/NotificationService.js';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

async function triggerManualCheckInNotification() {
  try {
    // Récupérer les arguments
    const userIdentifier = process.argv[2]; // userId ou email
    const type = process.argv[3]?.toLowerCase(); // mood, stress, ou focus

    if (!userIdentifier) {
      console.error('❌ Usage: node scripts/trigger-manual-checkin-notification.js <userId|email> <type>');
      console.error('   type: mood, stress, ou focus');
      console.error('');
      console.error('Exemples:');
      console.error('   node scripts/trigger-manual-checkin-notification.js cma6li3j1000ca64sisjbjyfs mood');
      console.error('   node scripts/trigger-manual-checkin-notification.js noah@example.com stress');
      process.exit(1);
    }

    if (!type || !['mood', 'stress', 'focus'].includes(type)) {
      console.error('❌ Type invalide. Doit être: mood, stress, ou focus');
      process.exit(1);
    }

    console.log('\n🧪 DÉCLENCHEMENT MANUEL D\'UNE NOTIFICATION DE CHECK-IN');
    console.log('='.repeat(60));
    console.log(`🔍 Identifiant: ${userIdentifier}`);
    console.log(`📊 Type: ${type}`);
    console.log('');

    // Chercher l'utilisateur par ID ou email
    let user;
    if (userIdentifier.includes('@')) {
      // C'est un email
      user = await prisma.user.findUnique({
        where: { email: userIdentifier.toLowerCase() },
        include: {
          notificationSettings: true,
          pushTokens: true,
        },
      });
    } else {
      // C'est un userId
      user = await prisma.user.findUnique({
        where: { id: userIdentifier },
        include: {
          notificationSettings: true,
          pushTokens: true,
        },
      });
    }

    if (!user) {
      console.error(`❌ Utilisateur non trouvé (${userIdentifier})`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`);
    console.log(`📱 Tokens push: ${user.pushTokens?.length || 0}`);
    console.log(`🔔 Push activé: ${user.notificationSettings?.pushEnabled || false}`);
    console.log('');

    // Créer une date dans 1 minute pour que la notification soit traitée rapidement
    const scheduledDate = new Date(Date.now() + 1 * 60 * 1000); // +1 minute
    console.log(`⏰ Notification programmée pour: ${scheduledDate.toISOString()}`);
    console.log('');

    // Déclencher la notification selon le type
    switch (type) {
      case 'mood':
        console.log('🙂 Déclenchement notification MOOD_CHECK...');
        await notificationService.scheduleMoodCheckNotification(userId, scheduledDate);
        break;
      case 'stress':
        console.log('😌 Déclenchement notification STRESS_CHECK...');
        await notificationService.scheduleStressCheckNotification(userId, scheduledDate);
        break;
      case 'focus':
        console.log('🎯 Déclenchement notification FOCUS_CHECK...');
        await notificationService.scheduleFocusCheckNotification(userId, scheduledDate);
        break;
    }

    console.log('');
    console.log('✅ Notification créée avec succès !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Attendre ~1 minute pour que le scheduler traite la notification');
    console.log('   2. Vérifier les logs du scheduler');
    console.log('   3. Vérifier votre téléphone pour la notification push');
    console.log('   4. Cliquer sur la notification pour tester la redirection vers Analytics');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

triggerManualCheckInNotification();
