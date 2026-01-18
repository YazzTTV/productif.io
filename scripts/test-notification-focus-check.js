#!/usr/bin/env node

/**
 * Script pour tester la notification FOCUS_CHECK_PREMIUM
 * Envoie uniquement en push mobile
 * 
 * Usage: node scripts/test-notification-focus-check.js [userId]
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { sendPushNotification } from '../lib/apns.js';

config();

const prisma = new PrismaClient();

async function main() {
  try {
    const userId = process.argv[2] || 'cma6li3j1000ca64sisjbjyfs';
    
    console.log('🎯 Test notification FOCUS_CHECK_PREMIUM\n');
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
      title: '🎯 Check-in focus',
      body: 'Focus actuel sur 1-10 ? Quelle est la prochaine tâche à faire en 25 minutes ?',
      sound: 'default',
      badge: 1,
      data: {
        notificationId: `test_focus_check_premium_${Date.now()}`,
        type: 'FOCUS_CHECK_PREMIUM',
        action: 'open_assistant',
        message: '🎯 Focus actuel sur 1-10 ?\n\nQuelle est la prochaine tâche à faire en 25 minutes ? (une seule, claire).',
        checkInType: 'focus'
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
