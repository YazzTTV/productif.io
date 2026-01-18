#!/usr/bin/env node

/**
 * Script pour tester la notification MORNING_ANCHOR
 * Envoie uniquement en push mobile
 * 
 * Usage: node scripts/test-notification-morning-anchor.js [userId]
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { sendPushNotification } from '../lib/apns.js';

config();

const prisma = new PrismaClient();

async function main() {
  try {
    const userId = process.argv[2] || 'cma6li3j1000ca64sisjbjyfs';
    
    console.log('🌅 Test notification MORNING_ANCHOR\n');
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
      title: '🌅 Ta journée est prête',
      body: 'Ta journée est planifiée. Commence par le premier bloc.',
      sound: 'default',
      badge: 1,
      data: {
        notificationId: `test_morning_anchor_${Date.now()}`,
        type: 'MORNING_ANCHOR',
        action: 'open_assistant',
        message: 'Ta journée est prête.\n\nPlan du jour :\n• Tâche 1\n• Tâche 2\n• Tâche 3\n\nCommence par le premier bloc.',
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
