#!/usr/bin/env node

/**
 * Script pour tester la notification POST_LUNCH_RESTART
 * Envoie uniquement en push mobile
 * 
 * Usage: node scripts/test-notification-post-lunch-restart.js [userId]
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { sendPushNotification } from '../lib/apns.js';

config();

const prisma = new PrismaClient();

async function main() {
  try {
    const userId = process.argv[2] || 'cma6li3j1000ca64sisjbjyfs';
    
    console.log('🔁 Test notification POST_LUNCH_RESTART\n');
    console.log(`User ID: ${userId}\n`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pushTokens: { where: { platform: 'ios' } } }
    });

    if (!user) {
      console.error('❌ Utilisateur non trouvé');
      process.exit(1);
    }

    if (!user.pushTokens || user.pushTokens.length === 0) {
      console.error('❌ Aucun token push iOS trouvé');
      process.exit(1);
    }

    console.log(`✅ Utilisateur: ${user.email}`);
    console.log(`✅ Tokens push: ${user.pushTokens.length}\n`);

    const payload = {
      title: '🔁 Prêt à reprendre ?',
      body: 'Un peu de concentration maintenant vaut mieux qu\'un stress intense plus tard.',
      sound: 'default',
      badge: 1,
      data: {
        notificationId: `test_post_lunch_restart_${Date.now()}`,
        type: 'POST_LUNCH_RESTART',
        action: 'open_assistant',
        message: 'Un peu de concentration maintenant vaut mieux qu\'un stress intense plus tard.',
        checkInType: null
      }
    };

    console.log('📤 Envoi de la notification...\n');
    const result = await sendPushNotification(userId, payload);

    if (result.success && result.sent > 0) {
      console.log(`✅ Notification envoyée avec succès à ${result.sent} appareil(s)`);
    } else {
      console.error(`❌ Échec: ${result.failed} échec(s)`);
      if (result.errors) {
        result.errors.forEach(err => console.error(`   - ${err.error || JSON.stringify(err)}`));
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
