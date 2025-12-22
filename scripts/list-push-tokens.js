#!/usr/bin/env node

/**
 * Script pour lister les utilisateurs avec des tokens push enregistrés
 * Usage: node scripts/list-push-tokens.js
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Charger les variables d'environnement
dotenv.config();

const prisma = new PrismaClient();

async function listPushTokens() {
  try {
    console.log('📱 Liste des utilisateurs avec des tokens push\n');

    const users = await prisma.user.findMany({
      where: {
        pushTokens: {
          some: {}
        }
      },
      include: {
        pushTokens: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        email: 'asc'
      }
    });

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur avec un token push trouvé');
      console.log('\n💡 Pour enregistrer un token push:');
      console.log('   1. Ouvrez l\'application mobile iOS');
      console.log('   2. Acceptez les permissions de notification');
      console.log('   3. Le token sera automatiquement enregistré\n');
      return;
    }

    console.log(`✅ ${users.length} utilisateur(s) avec des tokens push:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || user.id}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Tokens: ${user.pushTokens.length}`);
      
      user.pushTokens.forEach((token, tokenIndex) => {
        const masked = token.token.substring(0, 20) + '...' + token.token.substring(token.token.length - 10);
        console.log(`      ${tokenIndex + 1}. ${token.platform.toUpperCase()}: ${masked}`);
        console.log(`         Créé: ${token.createdAt.toLocaleString('fr-FR')}`);
        if (token.deviceId) {
          console.log(`         Device ID: ${token.deviceId}`);
        }
      });
      console.log('');
    });

    console.log('\n💡 Pour tester l\'envoi d\'une notification push:');
    console.log(`   node scripts/test-push-notification.js [userId]`);
    if (users.length > 0) {
      console.log(`\n   Exemple:`);
      console.log(`   node scripts/test-push-notification.js ${users[0].id}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listPushTokens()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

