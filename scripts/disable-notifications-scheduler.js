#!/usr/bin/env node

/**
 * Script pour désactiver les notifications via le scheduler sur Railway
 * 
 * Usage:
 *   node scripts/disable-notifications-scheduler.js [email|userId|all]
 * 
 * Exemples:
 *   node scripts/disable-notifications-scheduler.js noah@example.com
 *   node scripts/disable-notifications-scheduler.js clx123abc456
 *   node scripts/disable-notifications-scheduler.js all
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// URL du scheduler - prioriser SCHEDULER_URL, sinon utiliser une URL par défaut
const SCHEDULER_URL = process.env.SCHEDULER_URL || 'https://scheduler-production-70cc.up.railway.app';

async function disableNotificationsForUser(userId, userEmail) {
  try {
    console.log(`\n🔄 Désactivation des notifications pour l'utilisateur: ${userEmail || userId}\n`);

    // Récupérer les préférences actuelles
    const oldPreferences = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    if (!oldPreferences) {
      console.log(`⚠️  Aucune préférence trouvée pour cet utilisateur. Création d'une entrée désactivée...`);
      
      // Créer des préférences avec seulement les notifications essentielles activées
      const newPrefs = await prisma.notificationSettings.create({
        data: {
          userId,
          isEnabled: true, // Activé car on garde les notifications essentielles
          emailEnabled: oldPreferences?.emailEnabled ?? true,
          pushEnabled: oldPreferences?.pushEnabled ?? true,
          whatsappEnabled: false,
          // GARDER les notifications essentielles activées
          morningReminder: true,  // Début de journée
          noonReminder: true,     // Pause
          recapReminder: true,   // Récap fin de journée
          // DÉSACTIVER les notifications non souhaitées
          afternoonReminder: false,
          eveningReminder: false,
          nightReminder: false,
          improvementReminder: false,
          taskReminder: false,
          habitReminder: false,
          motivation: false,
          dailySummary: false,
        }
      });

      // Notifier le scheduler
      await notifyScheduler(userId, null, newPrefs);
      console.log(`✅ Notifications désactivées pour ${userEmail || userId}`);
      return;
    }

    console.log(`📋 Préférences actuelles:`);
    console.log(`   - Notifications activées: ${oldPreferences.isEnabled ? '✅' : '❌'}`);
    console.log(`   - Rappel matin: ${oldPreferences.morningReminder ? '✅' : '❌'}`);
    console.log(`   - Rappel midi: ${oldPreferences.noonReminder ? '✅' : '❌'}`);
    console.log(`   - Récap soir: ${oldPreferences.recapReminder ? '✅' : '❌'}`);
    console.log(`   - Après-midi: ${oldPreferences.afternoonReminder ? '✅' : '❌'}`);
    console.log(`   - Soir: ${oldPreferences.eveningReminder ? '✅' : '❌'}`);
    console.log(`   - Amélioration: ${oldPreferences.improvementReminder ? '✅' : '❌'}\n`);
    
    console.log(`🎯 Désactivation des notifications non souhaitées:`);
    console.log(`   ❌ Après-midi ("L'après-midi commence")`);
    console.log(`   ❌ Soir ("Planifie demain", "Préparer demain")`);
    console.log(`   ❌ Nuit, amélioration, tâches, habitudes, motivation, résumés\n`);
    
    console.log(`✅ Notifications conservées:`);
    console.log(`   ✅ Matin ("Nouvelle journée")`);
    console.log(`   ✅ Midi (pause)`);
    console.log(`   ✅ Récap soir ("Bilan du soir")\n`);

    // Désactiver seulement les notifications non souhaitées
    // GARDER: morningReminder (début de journée), noonReminder (pause), recapReminder (récap fin de journée)
    // DÉSACTIVER: afternoonReminder, eveningReminder, improvementReminder, et autres notifications non essentielles
    
    // Créer les nouvelles préférences en conservant les notifications essentielles
    const newPreferences = {
      ...oldPreferences,
      // Désactiver seulement les notifications non souhaitées
      afternoonReminder: false,  // "L'après-midi commence"
      eveningReminder: false,    // "Planifie demain", "Préparer demain"
      nightReminder: false,      // Notifications de nuit
      improvementReminder: false, // Rappels d'amélioration
      taskReminder: false,       // Rappels de tâches
      habitReminder: false,      // Rappels d'habitudes
      motivation: false,         // Messages de motivation
      dailySummary: false,       // Résumés quotidiens
      // GARDER activés (conservent leurs valeurs actuelles):
      // morningReminder: reste tel quel (début de journée)
      // noonReminder: reste tel quel (pause)
      // recapReminder: reste tel quel (récap fin de journée)
    };

    // Vérifier si au moins une notification essentielle est activée
    const hasEssentialNotifications = 
      oldPreferences.morningReminder ||
      oldPreferences.noonReminder ||
      oldPreferences.recapReminder;

    // Mettre à jour dans la base de données
    const updated = await prisma.notificationSettings.update({
      where: { userId },
      data: {
        // Garder isEnabled à true si des notifications essentielles sont activées
        isEnabled: hasEssentialNotifications ? true : oldPreferences.isEnabled,
        // Désactiver seulement les notifications non souhaitées
        afternoonReminder: false,
        eveningReminder: false,
        nightReminder: false,
        improvementReminder: false,
        taskReminder: false,
        habitReminder: false,
        motivation: false,
        dailySummary: false,
        // Les autres (morningReminder, noonReminder, recapReminder) restent inchangés
        // (ne pas les inclure dans data pour qu'ils conservent leurs valeurs)
      }
    });

    console.log(`✅ Base de données mise à jour`);

    // Notifier le scheduler sur Railway
    console.log(`\n📡 Notification du scheduler sur Railway...`);
    await notifyScheduler(userId, oldPreferences, newPreferences);

    console.log(`\n✅ Notifications mises à jour avec succès pour ${userEmail || userId}`);
    console.log(`   Le scheduler a été notifié et va arrêter les tâches non souhaitées.`);
    console.log(`   Les notifications essentielles (matin, pause, récap) restent actives.\n`);

  } catch (error) {
    console.error(`\n❌ Erreur lors de la désactivation pour ${userEmail || userId}:`);
    console.error(error);
    throw error;
  }
}

async function notifyScheduler(userId, oldPreferences, newPreferences) {
  const url = `${SCHEDULER_URL}/api/update-user`;
  
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        oldPreferences: oldPreferences || null,
        newPreferences,
        timestamp: new Date().toISOString()
      }),
      // Timeout de 30 secondes
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Scheduler a répondu avec ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`   ✅ Scheduler notifié avec succès`);
    console.log(`   📊 Jobs actifs après mise à jour: ${result.activeJobs || 0}`);
    
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Timeout lors de la connexion au scheduler (${url})`);
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Impossible de se connecter au scheduler (${url}). Vérifiez que SCHEDULER_URL est correct.`);
    }
    throw error;
  }
}

async function disableAllNotifications() {
  try {
    console.log(`\n🔄 Désactivation des notifications non souhaitées pour TOUS les utilisateurs...\n`);
    console.log(`⚠️  Cette opération va désactiver:`);
    console.log(`   ❌ Après-midi, Soir, Nuit, Amélioration, Tâches, Habitudes, Motivation, Résumés`);
    console.log(`✅ Et conserver:`);
    console.log(`   ✅ Matin, Midi (pause), Récap soir\n`);

    // Récupérer tous les utilisateurs avec des préférences
    const usersWithNotifications = await prisma.user.findMany({
      where: {
        notificationSettings: {
          OR: [
            { afternoonReminder: true },
            { eveningReminder: true },
            { nightReminder: true },
            { improvementReminder: true },
            { taskReminder: true },
            { habitReminder: true },
            { motivation: true },
            { dailySummary: true },
          ]
        }
      },
      include: {
        notificationSettings: true
      }
    });

    console.log(`📊 ${usersWithNotifications.length} utilisateur(s) avec notifications non souhaitées trouvé(s)\n`);

    if (usersWithNotifications.length === 0) {
      console.log(`✅ Aucun utilisateur avec notifications non souhaitées. Rien à faire.\n`);
      return;
    }

    // Désactiver pour chaque utilisateur
    for (const user of usersWithNotifications) {
      try {
        await disableNotificationsForUser(user.id, user.email);
      } catch (error) {
        console.error(`❌ Erreur pour ${user.email}:`, error.message);
        // Continuer avec les autres utilisateurs
      }
    }

    console.log(`\n✅ Mise à jour terminée pour ${usersWithNotifications.length} utilisateur(s)\n`);

  } catch (error) {
    console.error(`\n❌ Erreur lors de la désactivation globale:`);
    console.error(error);
    throw error;
  }
}

async function main() {
  const identifier = process.argv[2];

  if (!identifier) {
    console.error('❌ Usage: node scripts/disable-notifications-scheduler.js [email|userId|all]');
    console.error('\nExemples:');
    console.error('  node scripts/disable-notifications-scheduler.js noah@example.com');
    console.error('  node scripts/disable-notifications-scheduler.js clx123abc456');
    console.error('  node scripts/disable-notifications-scheduler.js all');
    console.error(`\n📡 Scheduler URL: ${SCHEDULER_URL}`);
    process.exit(1);
  }

  console.log('🚫 Script de désactivation des notifications via scheduler Railway');
  console.log(`📡 Scheduler URL: ${SCHEDULER_URL}\n`);

  try {
    if (identifier.toLowerCase() === 'all') {
      await disableAllNotifications();
    } else {
      // Chercher l'utilisateur
      console.log(`🔍 Recherche de l'utilisateur: "${identifier}"\n`);

      // Essayer par email d'abord
      let user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase() },
        include: {
          notificationSettings: true
        }
      });

      // Si pas trouvé par email, essayer par ID
      if (!user) {
        user = await prisma.user.findUnique({
          where: { id: identifier },
          include: {
            notificationSettings: true
          }
        });
      }

      // Si toujours pas trouvé, essayer par nom
      if (!user) {
        user = await prisma.user.findFirst({
          where: {
            name: {
              contains: identifier,
              mode: 'insensitive'
            }
          },
          include: {
            notificationSettings: true
          }
        });
      }

      if (!user) {
        console.error(`❌ Utilisateur "${identifier}" non trouvé`);
        process.exit(1);
      }

      console.log(`✅ Utilisateur trouvé:`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Nom: ${user.name || 'N/A'}`);
      console.log(`   - Email: ${user.email}\n`);

      await disableNotificationsForUser(user.id, user.email);
    }

  } catch (error) {
    console.error('\n❌ Erreur fatale:');
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
