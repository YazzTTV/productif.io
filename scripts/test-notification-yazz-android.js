#!/usr/bin/env node

/**
 * Script pour créer une notification de test pour l'utilisateur "yazz" sur Android
 * Usage: node scripts/test-notification-yazz-android.js
 */

import { PrismaClient } from '@prisma/client';
import notificationService from '../src/services/NotificationService.js';

const prisma = new PrismaClient();

async function createTestNotificationForYazz() {
  try {
    console.log('🧪 Création d\'une notification de test pour yazz\n');

    // Rechercher l'utilisateur "yazz"
    console.log('🔍 Recherche de l\'utilisateur "yazz"...');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'yazz', mode: 'insensitive' } },
          { name: { contains: 'yazz', mode: 'insensitive' } }
        ]
      },
      include: {
        pushTokens: {
          where: { platform: 'android' }
        },
        notificationSettings: true
      }
    });

    if (!user) {
      console.error('❌ Utilisateur "yazz" non trouvé');
      console.log('\n💡 Vérifiez que l\'utilisateur existe dans la base de données');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email || user.name || user.id}`);
    console.log(`📱 Tokens Android: ${user.pushTokens.length}`);

    if (user.pushTokens.length === 0) {
      console.warn('⚠️ Aucun token Android trouvé pour cet utilisateur');
      console.log('💡 Assurez-vous que l\'app Android est ouverte et que les notifications sont activées');
    } else {
      user.pushTokens.forEach((token, index) => {
        const masked = token.token.substring(0, 20) + '...' + token.token.substring(token.token.length - 10);
        console.log(`   Token ${index + 1}: ${masked}`);
      });
    }

    // Vérifier les préférences de notifications
    if (!user.notificationSettings) {
      console.warn('⚠️ Aucune préférence de notification trouvée');
    } else {
      console.log(`\n📋 Préférences de notifications:`);
      console.log(`   - Activées: ${user.notificationSettings.isEnabled || false}`);
      console.log(`   - Push activé: ${user.notificationSettings.pushEnabled || false}`);
    }

    // Créer une notification de test programmée pour maintenant + 10 secondes
    const scheduledFor = new Date(Date.now() + 10000); // Dans 10 secondes
    console.log(`\n📅 Création de la notification pour: ${scheduledFor.toLocaleString('fr-FR')}`);

    const notification = await notificationService.createNotification(
      user.id,
      'TEST_NOTIFICATION',
      '🧪 Ceci est une notification de test Android envoyée via le scheduler. Si vous voyez ce message, les notifications Android fonctionnent correctement !',
      scheduledFor,
      {
        pushTitle: '🧪 Test Android',
        pushBody: 'Notification de test envoyée via le scheduler'
      }
    );

    console.log(`✅ Notification créée avec succès !`);
    console.log(`   ID: ${notification.id}`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Statut: ${notification.status}`);
    console.log(`   Programmée pour: ${notification.scheduledFor.toLocaleString('fr-FR')}`);

    console.log(`\n⏳ Le scheduler va traiter cette notification dans les prochaines minutes...`);
    console.log(`📱 Vérifiez votre appareil Android pour voir la notification !`);

  } catch (error) {
    console.error('\n❌ Erreur lors de la création de la notification:', error);
    if (error.message && error.message.includes('Can\'t reach database server')) {
      console.error('\n💡 La base de données n\'est pas accessible depuis votre machine locale.');
      console.error('   Le script doit être exécuté sur le serveur où la base de données est accessible.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createTestNotificationForYazz()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
