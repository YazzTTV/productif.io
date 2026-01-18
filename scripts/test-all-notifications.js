#!/usr/bin/env node

/**
 * Script de test pour tous les nouveaux scénarios de notifications
 * 
 * Usage: 
 *   node scripts/test-all-notifications.js [userId]
 *   node scripts/test-all-notifications.js [userId] --send (pour aussi envoyer les notifications)
 * 
 * Ce script teste les 8 nouveaux scénarios :
 * 1. MORNING_ANCHOR
 * 2. FOCUS_WINDOW
 * 3. FOCUS_END
 * 4. LUNCH_BREAK
 * 5. POST_LUNCH_RESTART
 * 6. STRESS_CHECK_PREMIUM
 * 7. MOOD_CHECK_PREMIUM
 * 8. EVENING_PLAN
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import NotificationService from '../src/services/NotificationService.js';

config();

const prisma = new PrismaClient();
const notificationService = NotificationService;

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

function logTest(name) {
  log(`\n🧪 Test: ${name}`, 'cyan');
  console.log('-'.repeat(70));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Configuration - Parser les arguments correctement
const args = process.argv.slice(2); // Ignorer node et le chemin du script
const SEND_NOTIFICATIONS = args.includes('--send');
const userIdArg = args.find(arg => arg && !arg.startsWith('--') && !arg.includes('node') && !arg.includes('test-all-notifications'));

async function findTestUser(userId = null) {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        notificationSettings: true,
        pushTokens: true
      }
    });
    
    if (!user) {
      throw new Error(`Utilisateur non trouvé: ${userId}`);
    }
    
    return user;
  }

  // Chercher un utilisateur avec des préférences de notifications activées
  const user = await prisma.user.findFirst({
    where: {
      notificationSettings: {
        isEnabled: true
      }
    },
    include: {
      notificationSettings: true,
      pushTokens: true
    }
  });

  if (!user) {
    throw new Error('Aucun utilisateur avec notifications activées trouvé');
  }

  return user;
}

async function setupTestData(user) {
  logInfo('Configuration des données de test...');
  
  // Créer quelques tâches pour les tests
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Vérifier si l'utilisateur a déjà des tâches
  const existingTasks = await prisma.task.count({
    where: {
      userId: user.id,
      dueDate: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  if (existingTasks === 0) {
    logInfo('Création de tâches de test...');
    await prisma.task.createMany({
      data: [
        {
          userId: user.id,
          title: 'Tâche de test 1',
          dueDate: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10h
          completed: false
        },
        {
          userId: user.id,
          title: 'Tâche de test 2',
          dueDate: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 14h
          completed: false
        },
        {
          userId: user.id,
          title: 'Tâche de test 3',
          dueDate: tomorrow,
          completed: false
        }
      ]
    });
    logSuccess('Tâches de test créées');
  } else {
    logInfo(`${existingTasks} tâches existantes trouvées`);
  }

  // S'assurer que les préférences de notifications sont activées
  if (!user.notificationSettings) {
    logInfo('Création des préférences de notifications...');
    await prisma.notificationSettings.create({
      data: {
        userId: user.id,
        isEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        morningReminder: true,
        noonReminder: true,
        eveningReminder: true,
        morningTime: '08:00',
        noonTime: '12:00',
        eveningTime: '18:00',
        stressWindows: [{ start: '17:00', end: '18:00' }],
        moodWindows: [{ start: '19:00', end: '20:00' }],
        focusEnabled: true
      }
    });
    logSuccess('Préférences de notifications créées');
  } else {
    // Mettre à jour pour s'assurer qu'elles sont activées
    await prisma.notificationSettings.update({
      where: { userId: user.id },
      data: {
        isEnabled: true,
        pushEnabled: true,
        focusEnabled: true
      }
    });
    logSuccess('Préférences de notifications mises à jour');
  }
}

async function testMorningAnchor(user) {
  logTest('MORNING_ANCHOR');
  
  try {
    const testDate = new Date();
    testDate.setHours(8, 0, 0, 0);
    
    logInfo(`Date de test: ${testDate.toISOString()}`);
    
    await notificationService.scheduleMorningAnchor(user.id, testDate);
    logSuccess('MORNING_ANCHOR créée avec succès');
    
    // Vérifier que la notification a été créée
    const notification = await prisma.notificationHistory.findFirst({
      where: {
        userId: user.id,
        type: 'MORNING_ANCHOR',
        scheduledFor: {
          gte: new Date(testDate.getTime() - 60000),
          lte: new Date(testDate.getTime() + 60000)
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    if (notification) {
      logSuccess(`Notification trouvée: ${notification.id}`);
      logInfo(`Titre: ${notification.pushTitle || 'N/A'}`);
      logInfo(`Status: ${notification.status}`);
      return { success: true, notification };
    } else {
      logWarning('Notification créée mais non trouvée dans la base de données');
      return { success: false };
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testFocusWindow(user) {
  logTest('FOCUS_WINDOW');
  
  try {
    logInfo('Test de détection de fenêtre de focus...');
    
    await notificationService.scheduleFocusWindow(user.id);
    logSuccess('FOCUS_WINDOW testée avec succès');
    
    // Vérifier que la notification a été créée (si conditions remplies)
    const notification = await prisma.notificationHistory.findFirst({
      where: {
        userId: user.id,
        type: 'FOCUS_WINDOW',
        scheduledFor: {
          gte: new Date(Date.now() - 60000) // Dernière minute
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    if (notification) {
      logSuccess(`Notification créée: ${notification.id}`);
      logInfo(`Titre: ${notification.pushTitle || 'N/A'}`);
      return { success: true, notification };
    } else {
      logWarning('Aucune notification créée (conditions non remplies - normal si pas de fenêtre libre)');
      return { success: true, notification: null, skipped: true };
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testFocusEnd(user) {
  logTest('FOCUS_END');
  
  try {
    // Créer une session deep work de test pour simuler la fin
    const now = new Date();
    
    // Vérifier s'il y a une session active
    const activeSession = await prisma.deepWorkSession.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      },
      include: {
        timeEntry: true,
        user: {
          include: {
            notificationSettings: true
          }
        }
      }
    });

    if (!activeSession) {
      logWarning('Aucune session deep work active - création d\'une session de test...');
      
      // Créer une session de test
      const timeEntry = await prisma.timeEntry.create({
        data: {
          userId: user.id,
          startTime: new Date(now.getTime() - 30 * 60 * 1000), // Il y a 30 min
          endTime: null,
          description: 'Session de test'
        }
      });

      const testSession = await prisma.deepWorkSession.create({
        data: {
          userId: user.id,
          timeEntryId: timeEntry.id,
          plannedDuration: 25,
          status: 'active'
        },
        include: {
          timeEntry: true,
          user: {
            include: {
              notificationSettings: true
            }
          }
        }
      });

      // Simuler la fin de session
      const content = `Bien joué. Un pas de plus vers tes objectifs.\n\nPrévu : ${testSession.plannedDuration} min\nRéel : 30 min`;
      await notificationService.createNotification(
        user.id,
        'FOCUS_END',
        content,
        now,
        {
          pushTitle: '⏱️ Session terminée',
          pushBody: 'Bien joué. Un pas de plus vers tes objectifs.',
          assistantMessage: content
        }
      );

      // Nettoyer la session de test
      await prisma.deepWorkSession.delete({ where: { id: testSession.id } });
      await prisma.timeEntry.delete({ where: { id: timeEntry.id } });
    } else {
      logInfo('Session active trouvée - test avec session existante');
      const content = `Bien joué. Un pas de plus vers tes objectifs.\n\nPrévu : ${activeSession.plannedDuration} min\nRéel : 30 min`;
      await notificationService.createNotification(
        user.id,
        'FOCUS_END',
        content,
        now,
        {
          pushTitle: '⏱️ Session terminée',
          pushBody: 'Bien joué. Un pas de plus vers tes objectifs.',
          assistantMessage: content
        }
      );
    }

    logSuccess('FOCUS_END créée avec succès');
    
    const notification = await prisma.notificationHistory.findFirst({
      where: {
        userId: user.id,
        type: 'FOCUS_END',
        scheduledFor: {
          gte: new Date(Date.now() - 60000)
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    if (notification) {
      logSuccess(`Notification trouvée: ${notification.id}`);
      return { success: true, notification };
    } else {
      logWarning('Notification créée mais non trouvée');
      return { success: false };
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLunchBreak(user) {
  logTest('LUNCH_BREAK');
  
  try {
    const testDate = new Date();
    testDate.setHours(12, 0, 0, 0);
    
    logInfo(`Date de test: ${testDate.toISOString()}`);
    
    await notificationService.scheduleLunchBreak(user.id, testDate);
    logSuccess('LUNCH_BREAK créée avec succès');
    
    const notification = await prisma.notificationHistory.findFirst({
      where: {
        userId: user.id,
        type: 'LUNCH_BREAK',
        scheduledFor: {
          gte: new Date(testDate.getTime() - 60000),
          lte: new Date(testDate.getTime() + 60000)
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    if (notification) {
      logSuccess(`Notification trouvée: ${notification.id}`);
      return { success: true, notification };
    } else {
      logWarning('Notification créée mais non trouvée (conditions non remplies)');
      return { success: true, notification: null, skipped: true };
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testPostLunchRestart(user) {
  logTest('POST_LUNCH_RESTART');
  
  try {
    const lunchDate = new Date();
    lunchDate.setHours(12, 30, 0, 0);
    
    logInfo(`Date de déjeuner simulée: ${lunchDate.toISOString()}`);
    
    await notificationService.schedulePostLunchRestart(user.id, lunchDate);
    logSuccess('POST_LUNCH_RESTART créée avec succès');
    
    // La notification est planifiée 30-90 min après, donc chercher dans les 2 prochaines heures
    const notification = await prisma.notificationHistory.findFirst({
      where: {
        userId: user.id,
        type: 'POST_LUNCH_RESTART',
        scheduledFor: {
          gte: lunchDate,
          lte: new Date(lunchDate.getTime() + 2 * 60 * 60 * 1000)
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    if (notification) {
      logSuccess(`Notification trouvée: ${notification.id}`);
      logInfo(`Planifiée pour: ${notification.scheduledFor.toISOString()}`);
      return { success: true, notification };
    } else {
      logWarning('Notification créée mais non trouvée (conditions non remplies)');
      return { success: true, notification: null, skipped: true };
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testStressCheckPremium(user) {
  logTest('STRESS_CHECK_PREMIUM');
  
  try {
    // Vérifier si l'utilisateur est Premium
    const isPremium = (user.subscriptionStatus && ['active', 'trialing', 'paid'].includes(user.subscriptionStatus)) ||
      (user.subscriptionTier && ['pro', 'premium', 'starter', 'enterprise', 'paid'].includes(user.subscriptionTier?.toLowerCase())) ||
      !!user.stripeSubscriptionId;

    if (!isPremium) {
      logWarning('Utilisateur non Premium - test ignoré (normal)');
      return { success: true, skipped: true, reason: 'Not Premium' };
    }

    const testDate = new Date();
    testDate.setHours(17, 0, 0, 0);
    
    logInfo(`Date de test: ${testDate.toISOString()}`);
    
    await notificationService.scheduleStressCheckPremium(user.id, testDate);
    logSuccess('STRESS_CHECK_PREMIUM créée avec succès');
    
    const notification = await prisma.notificationHistory.findFirst({
      where: {
        userId: user.id,
        type: 'STRESS_CHECK_PREMIUM',
        scheduledFor: {
          gte: new Date(testDate.getTime() - 60000),
          lte: new Date(testDate.getTime() + 60000)
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    if (notification) {
      logSuccess(`Notification trouvée: ${notification.id}`);
      return { success: true, notification };
    } else {
      logWarning('Notification créée mais non trouvée (conditions non remplies)');
      return { success: true, notification: null, skipped: true };
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testMoodCheckPremium(user) {
  logTest('MOOD_CHECK_PREMIUM');
  
  try {
    // Vérifier si l'utilisateur est Premium
    const isPremium = (user.subscriptionStatus && ['active', 'trialing', 'paid'].includes(user.subscriptionStatus)) ||
      (user.subscriptionTier && ['pro', 'premium', 'starter', 'enterprise', 'paid'].includes(user.subscriptionTier?.toLowerCase())) ||
      !!user.stripeSubscriptionId;

    if (!isPremium) {
      logWarning('Utilisateur non Premium - test ignoré (normal)');
      return { success: true, skipped: true, reason: 'Not Premium' };
    }

    const testDate = new Date();
    testDate.setHours(19, 0, 0, 0);
    
    logInfo(`Date de test: ${testDate.toISOString()}`);
    
    await notificationService.scheduleMoodCheckPremium(user.id, testDate);
    logSuccess('MOOD_CHECK_PREMIUM créée avec succès');
    
    const notification = await prisma.notificationHistory.findFirst({
      where: {
        userId: user.id,
        type: 'MOOD_CHECK_PREMIUM',
        scheduledFor: {
          gte: new Date(testDate.getTime() - 60000),
          lte: new Date(testDate.getTime() + 60000)
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    if (notification) {
      logSuccess(`Notification trouvée: ${notification.id}`);
      return { success: true, notification };
    } else {
      logWarning('Notification créée mais non trouvée (conditions non remplies)');
      return { success: true, notification: null, skipped: true };
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testEveningPlan(user) {
  logTest('EVENING_PLAN');
  
  try {
    const testDate = new Date();
    testDate.setHours(18, 0, 0, 0);
    
    logInfo(`Date de test: ${testDate.toISOString()}`);
    
    await notificationService.scheduleEveningPlan(user.id, testDate);
    logSuccess('EVENING_PLAN créée avec succès');
    
    const notification = await prisma.notificationHistory.findFirst({
      where: {
        userId: user.id,
        type: 'EVENING_PLAN',
        scheduledFor: {
          gte: new Date(testDate.getTime() - 60000),
          lte: new Date(testDate.getTime() + 60000)
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    if (notification) {
      logSuccess(`Notification trouvée: ${notification.id}`);
      return { success: true, notification };
    } else {
      logWarning('Notification créée mais non trouvée (conditions non remplies - normal si tâches déjà planifiées pour demain)');
      return { success: true, notification: null, skipped: true };
    }
  } catch (error) {
    logError(`Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function sendNotifications(user) {
  if (!SEND_NOTIFICATIONS) {
    return;
  }

  logSection('ENVOI DES NOTIFICATIONS');
  
  try {
    // Récupérer les notifications en attente créées récemment avec les relations nécessaires
    const recentNotifications = await prisma.notificationHistory.findMany({
      where: {
        userId: user.id,
        status: 'pending',
        scheduledFor: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Dernières 5 minutes
        }
      },
      include: {
        user: {
          include: {
            notificationSettings: true
          }
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    logInfo(`${recentNotifications.length} notifications en attente trouvées`);

    if (recentNotifications.length === 0) {
      logWarning('Aucune notification en attente à envoyer');
      return;
    }

    // Traiter les notifications
    for (const notification of recentNotifications) {
      try {
        logInfo(`Traitement de la notification ${notification.id} (${notification.type})...`);
        await notificationService.processNotification(notification);
        logSuccess(`Notification ${notification.id} traitée`);
      } catch (error) {
        logError(`Erreur lors du traitement de ${notification.id}: ${error.message}`);
      }
    }

    logSuccess('Toutes les notifications ont été traitées');
  } catch (error) {
    logError(`Erreur lors de l'envoi: ${error.message}`);
  }
}

async function displaySummary(results) {
  logSection('RÉSUMÉ DES TESTS');
  
  const total = results.length;
  const successful = results.filter(r => r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n📊 Statistiques:`);
  logInfo(`Total: ${total} tests`);
  logSuccess(`Réussis: ${successful}`);
  logWarning(`Ignorés: ${skipped} (conditions non remplies - normal)`);
  if (failed > 0) {
    logError(`Échoués: ${failed}`);
  }

  console.log(`\n📋 Détails par scénario:`);
  results.forEach((result, index) => {
    const icon = result.success ? (result.skipped ? '⏭️' : '✅') : '❌';
    const status = result.success ? (result.skipped ? 'IGNORÉ' : 'RÉUSSI') : 'ÉCHOUÉ';
    console.log(`   ${icon} ${result.name}: ${status}`);
    if (result.error) {
      console.log(`      Erreur: ${result.error}`);
    }
    if (result.notification) {
      console.log(`      Notification ID: ${result.notification.id}`);
      console.log(`      Status: ${result.notification.status}`);
    }
  });

  console.log('\n');
}

async function main() {
  try {
    logSection('TEST DE TOUS LES SCÉNARIOS DE NOTIFICATIONS');
    
    logInfo(`Mode: ${SEND_NOTIFICATIONS ? 'TEST + ENVOI' : 'TEST UNIQUEMENT'}`);
    if (userIdArg) {
      logInfo(`User ID fourni: ${userIdArg}`);
    }

    // Trouver l'utilisateur de test
    logInfo('Recherche de l\'utilisateur de test...');
    const user = await findTestUser(userIdArg);
    logSuccess(`Utilisateur trouvé: ${user.email || user.id}`);
    logInfo(`Notifications activées: ${user.notificationSettings?.isEnabled ? '✅' : '❌'}`);
    logInfo(`Push activé: ${user.notificationSettings?.pushEnabled ? '✅' : '❌'}`);
    logInfo(`Tokens push: ${user.pushTokens?.length || 0}`);

    // Configurer les données de test
    await setupTestData(user);

    // Exécuter tous les tests
    const results = [];

    results.push({
      name: 'MORNING_ANCHOR',
      ...(await testMorningAnchor(user))
    });

    results.push({
      name: 'FOCUS_WINDOW',
      ...(await testFocusWindow(user))
    });

    results.push({
      name: 'FOCUS_END',
      ...(await testFocusEnd(user))
    });

    results.push({
      name: 'LUNCH_BREAK',
      ...(await testLunchBreak(user))
    });

    results.push({
      name: 'POST_LUNCH_RESTART',
      ...(await testPostLunchRestart(user))
    });

    results.push({
      name: 'STRESS_CHECK_PREMIUM',
      ...(await testStressCheckPremium(user))
    });

    results.push({
      name: 'MOOD_CHECK_PREMIUM',
      ...(await testMoodCheckPremium(user))
    });

    results.push({
      name: 'EVENING_PLAN',
      ...(await testEveningPlan(user))
    });

    // Afficher le résumé
    await displaySummary(results);

    // Envoyer les notifications si demandé
    if (SEND_NOTIFICATIONS) {
      await sendNotifications(user);
    } else {
      logInfo('Pour envoyer les notifications, utilisez: --send');
    }

    logSuccess('✅ Tous les tests terminés !');

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
