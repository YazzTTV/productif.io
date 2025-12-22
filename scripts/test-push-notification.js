#!/usr/bin/env node

/**
 * Script de test pour envoyer une notification push iOS
 * Usage: node scripts/test-push-notification.js [userId]
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../lib/apns.js';

// Charger les variables d'environnement
dotenv.config();

const prisma = new PrismaClient();

async function testPushNotification(userId = null) {
  try {
    console.log('🧪 Test d\'envoi de notification push iOS\n');

    // Vérifier la configuration APNs
    console.log('📋 Vérification de la configuration APNs...');
    const requiredVars = ['APNS_KEY_ID', 'APNS_TEAM_ID', 'APNS_BUNDLE_ID'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0 && !process.env.APNS_KEY_BASE64 && !process.env.APNS_KEY_P8) {
      console.error('❌ Variables d\'environnement manquantes:', missingVars.join(', '));
      console.error('   Ou APNS_KEY_P8 / APNS_KEY_BASE64 doit être défini');
      process.exit(1);
    }

    if (process.env.APNS_KEY_BASE64) {
      console.log('✅ APNS_KEY_BASE64 trouvé');
    } else if (process.env.APNS_KEY_P8) {
      console.log('✅ APNS_KEY_P8 trouvé');
    } else {
      console.error('❌ Aucune clé APNs trouvée (APNS_KEY_P8 ou APNS_KEY_BASE64)');
      process.exit(1);
    }

    console.log(`✅ APNS_KEY_ID: ${process.env.APNS_KEY_ID ? '✅' : '❌'}`);
    console.log(`✅ APNS_TEAM_ID: ${process.env.APNS_TEAM_ID ? '✅' : '❌'}`);
    console.log(`✅ APNS_BUNDLE_ID: ${process.env.APNS_BUNDLE_ID || 'io.productif.app'}`);
    console.log(`✅ APNS_PRODUCTION: ${process.env.APNS_PRODUCTION || 'false'}\n`);

    // Récupérer l'utilisateur
    let user;
    if (userId) {
      console.log(`🔍 Recherche de l'utilisateur: ${userId}`);
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          pushTokens: {
            where: { platform: 'ios' }
          }
        }
      });

      if (!user) {
        console.error(`❌ Utilisateur non trouvé: ${userId}`);
        process.exit(1);
      }
    } else {
      console.log('🔍 Recherche d\'un utilisateur avec un token push iOS...');
      user = await prisma.user.findFirst({
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
        console.error('❌ Aucun utilisateur avec un token push iOS trouvé');
        console.log('\n💡 Pour enregistrer un token push:');
        console.log('   1. Ouvrez l\'application mobile iOS');
        console.log('   2. Acceptez les permissions de notification');
        console.log('   3. Le token sera automatiquement enregistré\n');
        process.exit(1);
      }
    }

    console.log(`✅ Utilisateur trouvé: ${user.email || user.id}`);
    console.log(`📱 Tokens push iOS: ${user.pushTokens.length}\n`);

    if (user.pushTokens.length === 0) {
      console.error('❌ Aucun token push iOS trouvé pour cet utilisateur');
      process.exit(1);
    }

    // Afficher les tokens (masqués)
    user.pushTokens.forEach((token, index) => {
      const masked = token.token.substring(0, 20) + '...' + token.token.substring(token.token.length - 10);
      console.log(`   Token ${index + 1}: ${masked} (créé le ${token.createdAt.toISOString()})`);
    });
    console.log('');

    // Préparer la notification de test
    const testPayload = {
      title: '🧪 Test de notification push',
      body: `Notification de test envoyée le ${new Date().toLocaleString('fr-FR')}`,
      sound: 'default',
      badge: 1,
      data: {
        test: true,
        timestamp: new Date().toISOString(),
        type: 'TEST_NOTIFICATION'
      }
    };

    console.log('📤 Envoi de la notification push...');
    console.log(`   Titre: ${testPayload.title}`);
    console.log(`   Corps: ${testPayload.body}`);
    console.log(`   Son: ${testPayload.sound}`);
    console.log(`   Badge: ${testPayload.badge}\n`);

    // Envoyer la notification
    const result = await sendPushNotification(user.id, testPayload);

    // Afficher les résultats
    console.log('\n📊 Résultats:');
    console.log(`   ✅ Envoyées: ${result.sent}`);
    console.log(`   ❌ Échouées: ${result.failed}`);
    console.log(`   🎯 Succès: ${result.success ? '✅' : '❌'}`);

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Erreurs:');
      result.errors.forEach((error, index) => {
        if (typeof error === 'object') {
          console.log(`   ${index + 1}. Token: ${error.token?.substring(0, 20)}...`);
          console.log(`      Erreur: ${error.error}`);
        } else {
          console.log(`   ${index + 1}. ${error}`);
        }
      });
    }

    if (result.sent > 0) {
      console.log('\n✅ Notification push envoyée avec succès !');
      console.log('📱 Vérifiez votre appareil iOS pour voir la notification.');
    } else {
      console.log('\n❌ Aucune notification n\'a été envoyée.');
      if (result.failed > 0) {
        console.log('💡 Vérifiez les erreurs ci-dessus pour plus de détails.');
      }
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'userId depuis les arguments de ligne de commande
const userId = process.argv[2] || null;

// Exécuter le test
testPushNotification(userId)
  .then(() => {
    console.log('\n✅ Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

