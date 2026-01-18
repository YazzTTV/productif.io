#!/usr/bin/env node

/**
 * Script pour envoyer les notifications une par une, uniquement en push mobile
 * 
 * Usage: 
 *   node scripts/send-notifications-one-by-one.js [userId]
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { sendPushNotification } from '../lib/apns.js';

config();

const prisma = new PrismaClient();

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logTest(name) {
  log(`\n🧪 Test: ${name}`, 'cyan');
  console.log('-'.repeat(70));
}

// Notifications à tester
const notifications = [
  {
    name: 'MORNING_ANCHOR',
    title: '🌅 Ta journée est prête',
    body: 'Ta journée est planifiée. Commence par le premier bloc.',
    message: 'Ta journée est prête.\n\nPlan du jour :\n• Tâche 1\n• Tâche 2\n• Tâche 3\n\nCommence par le premier bloc.'
  },
  {
    name: 'FOCUS_WINDOW',
    title: '🎯 Tu as du temps pour te concentrer',
    body: 'Créneau libre détecté. Moment parfait pour te concentrer.',
    message: 'Tu as un créneau libre. Moment parfait pour te concentrer sur une tâche planifiée.'
  },
  {
    name: 'FOCUS_END',
    title: '⏱️ Session terminée',
    body: 'Bien joué. Un pas de plus vers tes objectifs.',
    message: 'Bien joué. Un pas de plus vers tes objectifs.\n\nPrévu : 25 min\nRéel : 30 min'
  },
  {
    name: 'LUNCH_BREAK',
    title: '🍽️ Temps de faire une pause',
    body: 'Prends une pause. La récupération fait partie de la performance.',
    message: 'Prends une pause. La récupération fait partie de la performance.'
  },
  {
    name: 'POST_LUNCH_RESTART',
    title: '🔁 Prêt à reprendre ?',
    body: 'Un peu de concentration maintenant vaut mieux qu\'un stress intense plus tard.',
    message: 'Un peu de concentration maintenant vaut mieux qu\'un stress intense plus tard.'
  },
  {
    name: 'STRESS_CHECK_PREMIUM',
    title: '🧠 Check-in stress',
    body: 'Check-in rapide. À quel point te sens-tu stressé(e) en ce moment ?',
    message: 'Check-in rapide. À quel point te sens-tu stressé(e) en ce moment ?'
  },
  {
    name: 'MOOD_CHECK_PREMIUM',
    title: '🙂 Check-in humeur',
    body: 'Comment s\'est passée ta journée dans l\'ensemble ?',
    message: 'Comment s\'est passée ta journée dans l\'ensemble ?'
  },
  {
    name: 'EVENING_PLAN',
    title: '🌙 Planifie demain',
    body: 'Planifier demain prend 2 minutes.',
    message: 'Planifier demain prend 2 minutes. Ton esprit te remerciera.'
  }
];

async function findUser(userId = null) {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        pushTokens: {
          where: { platform: 'ios' }
        }
      }
    });
    
    if (!user) {
      throw new Error(`Utilisateur non trouvé: ${userId}`);
    }
    
    return user;
  }

  // Chercher un utilisateur avec token push iOS
  const user = await prisma.user.findFirst({
    where: {
      pushTokens: {
        some: {
          platform: 'ios'
        }
      }
    },
    include: {
      pushTokens: {
        where: { platform: 'ios' }
      }
    }
  });

  if (!user) {
    throw new Error('Aucun utilisateur avec token push iOS trouvé');
  }

  return user;
}

async function sendNotification(user, notification, index) {
  logTest(`${index + 1}/${notifications.length} - ${notification.name}`);
  
  try {
    logInfo(`Envoi de la notification push...`);
    logInfo(`Titre: ${notification.title}`);
    logInfo(`Corps: ${notification.body}`);
    
    const payload = {
      title: notification.title,
      body: notification.body,
      sound: 'default',
      badge: 1,
      data: {
        notificationId: `test_${Date.now()}_${index}`,
        type: notification.name,
        action: 'open_assistant',
        message: notification.message,
        checkInType: null
      }
    };

    const result = await sendPushNotification(user.id, payload);

    if (result.success && result.sent > 0) {
      logSuccess(`Notification envoyée avec succès à ${result.sent} appareil(s)`);
      return { success: true, sent: result.sent };
    } else {
      logError(`Échec de l'envoi: ${result.failed} échec(s)`);
      if (result.errors) {
        result.errors.forEach(err => {
          logError(`  - ${err.error || JSON.stringify(err)}`);
        });
      }
      return { success: false, failed: result.failed, errors: result.errors };
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function waitForUserInput() {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\n⏸️  Appuyez sur Entrée pour envoyer la notification suivante (ou Ctrl+C pour arrêter)...\n', () => {
      readline.close();
      resolve();
    });
  });
}

async function main() {
  try {
    logSection('ENVOI DES NOTIFICATIONS UNE PAR UNE (PUSH MOBILE UNIQUEMENT)');
    
    const userIdArg = process.argv[2] || null;
    
    // Trouver l'utilisateur
    logInfo('Recherche de l\'utilisateur...');
    const user = await findUser(userIdArg);
    logSuccess(`Utilisateur trouvé: ${user.email || user.id}`);
    logInfo(`Tokens push iOS: ${user.pushTokens?.length || 0}`);
    
    if (!user.pushTokens || user.pushTokens.length === 0) {
      logError('Aucun token push iOS trouvé pour cet utilisateur');
      logInfo('Ouvrez l\'app mobile et activez les notifications pour enregistrer un token');
      process.exit(1);
    }

    // Afficher les tokens
    user.pushTokens.forEach((token, index) => {
      const masked = token.token.substring(0, 20) + '...' + token.token.substring(token.token.length - 10);
      logInfo(`Token ${index + 1}: ${masked} (créé le ${token.createdAt.toLocaleString('fr-FR')})`);
    });

    logSection(`ENVOI DE ${notifications.length} NOTIFICATIONS`);
    logInfo('Les notifications seront envoyées une par une avec une pause entre chaque');
    logInfo('Appuyez sur Entrée après chaque notification pour continuer\n');

    const results = [];

    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const result = await sendNotification(user, notification, i);
      results.push({
        name: notification.name,
        ...result
      });

      // Attendre l'input utilisateur avant de continuer (sauf pour la dernière)
      if (i < notifications.length - 1) {
        await waitForUserInput();
      }
    }

    // Résumé
    logSection('RÉSUMÉ');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    logInfo(`Total: ${results.length} notifications`);
    logSuccess(`Réussies: ${successful}`);
    if (failed > 0) {
      logError(`Échouées: ${failed}`);
    }

    console.log('\n📋 Détails:');
    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      const status = result.success ? `Envoyée (${result.sent} appareil(s))` : 'Échouée';
      console.log(`   ${icon} ${notifications[index].name}: ${status}`);
    });

    logSuccess('\n✅ Test terminé !');

  } catch (error) {
    logError(`Erreur fatale: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
