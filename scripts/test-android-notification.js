#!/usr/bin/env node

// Script pour tester l'envoi d'une notification push Android à un utilisateur
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../lib/fcm.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Test d\'envoi de notification push Android\n');

  try {
    // Chercher l'utilisateur "yazz" par email ou nom
    const userIdentifier = process.argv[2] || 'yazz';
    console.log(`🔍 Recherche de l'utilisateur: "${userIdentifier}"\n`);

    // Essayer par email d'abord
    let user = await prisma.user.findUnique({
      where: { email: userIdentifier.toLowerCase() },
      include: {
        pushTokens: {
          where: {
            platform: 'android'
          }
        }
      }
    });

    // Si pas trouvé par email, essayer par nom
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          name: {
            contains: userIdentifier,
            mode: 'insensitive'
          }
        },
        include: {
          pushTokens: {
            where: {
              platform: 'android'
            }
          }
        }
      });
    }

    if (!user) {
      console.error(`❌ Utilisateur "${userIdentifier}" non trouvé`);
      console.log('\n💡 Utilisation: node scripts/test-android-notification.js [email|nom]');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Nom: ${user.name || 'N/A'}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Tokens Android: ${user.pushTokens.length}\n`);

    if (user.pushTokens.length === 0) {
      console.warn('⚠️  Aucun token Android trouvé pour cet utilisateur.');
      console.warn('   L\'utilisateur doit d\'abord activer les notifications dans l\'app Android.');
      console.log('\n📱 Pour enregistrer un token:');
      console.log('   1. Ouvrir l\'app Android');
      console.log('   2. Aller dans Paramètres > Notifications');
      console.log('   3. Activer les notifications');
      process.exit(1);
    }

    // Afficher les tokens (partiellement masqués)
    console.log('📱 Tokens Android trouvés:');
    user.pushTokens.forEach((token, idx) => {
      console.log(`   ${idx + 1}. ${token.token.substring(0, 20)}...${token.token.substring(token.token.length - 10)}`);
      console.log(`      Créé le: ${token.createdAt.toISOString()}`);
    });
    console.log('');

    // Préparer la notification de test
    const testNotification = {
      title: '🧪 Notification de test Android',
      body: `Bonjour ${user.name || 'yazz'} ! Ceci est une notification de test depuis le scheduler.`,
      sound: 'default',
      data: {
        type: 'TEST',
        notificationId: 'test-' + Date.now(),
        action: 'open_assistant',
        message: 'Ceci est un message de test pour vérifier que les notifications Android fonctionnent correctement.'
      }
    };

    console.log('📤 Envoi de la notification de test...\n');
    console.log('📋 Contenu de la notification:');
    console.log(`   - Titre: ${testNotification.title}`);
    console.log(`   - Corps: ${testNotification.body}`);
    console.log(`   - Données: ${JSON.stringify(testNotification.data, null, 2)}`);
    console.log('');

    // Envoyer la notification
    const result = await sendPushNotification(user.id, testNotification);

    console.log('\n📊 Résultat de l\'envoi:');
    console.log(`   - Succès: ${result.success ? '✅' : '❌'}`);
    console.log(`   - Envoyées: ${result.sent}`);
    console.log(`   - Échouées: ${result.failed}`);

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Erreurs:');
      result.errors.forEach((error, idx) => {
        console.log(`   ${idx + 1}. ${JSON.stringify(error, null, 2)}`);
      });
    }

    if (result.success && result.sent > 0) {
      console.log('\n✅ Notification envoyée avec succès !');
      console.log('   Vérifiez l\'appareil Android pour voir la notification.');
    } else {
      console.log('\n❌ Échec de l\'envoi de la notification.');
      if (result.errors) {
        console.log('   Vérifiez les erreurs ci-dessus pour plus de détails.');
      }
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:');
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
