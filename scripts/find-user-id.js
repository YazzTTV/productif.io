#!/usr/bin/env node

/**
 * Script pour trouver le user ID d'un utilisateur
 * Usage: node scripts/find-user-id.js [email]
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function findUserId(email = null) {
  try {
    console.log('🔍 Recherche de votre user ID...\n');

    let user;

    if (email) {
      console.log(`📧 Recherche par email: ${email}`);
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          notificationSettings: true,
          pushTokens: true
        }
      });
    } else {
      // Chercher un utilisateur avec des tokens push iOS
      console.log('📱 Recherche d\'un utilisateur avec token push iOS...');
      user = await prisma.user.findFirst({
        where: {
          pushTokens: {
            some: {
              platform: 'ios'
            }
          }
        },
        include: {
          notificationSettings: true,
          pushTokens: {
            where: { platform: 'ios' }
          }
        }
      });
    }

    if (!user) {
      console.error('❌ Aucun utilisateur trouvé');
      if (!email) {
        console.log('\n💡 Essayez avec votre email:');
        console.log('   node scripts/find-user-id.js votre@email.com');
      }
      process.exit(1);
    }

    console.log('\n✅ Utilisateur trouvé:');
    console.log('─'.repeat(60));
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`📱 Tokens push iOS: ${user.pushTokens?.length || 0}`);
    
    if (user.pushTokens && user.pushTokens.length > 0) {
      console.log('\n📱 Tokens push enregistrés:');
      user.pushTokens.forEach((token, index) => {
        const masked = token.token.substring(0, 20) + '...' + token.token.substring(token.token.length - 10);
        console.log(`   ${index + 1}. ${masked} (créé le ${token.createdAt.toLocaleString('fr-FR')})`);
      });
    }

    console.log(`\n🔔 Notifications activées: ${user.notificationSettings?.isEnabled ? '✅' : '❌'}`);
    console.log(`📲 Push activé: ${user.notificationSettings?.pushEnabled ? '✅' : '❌'}`);

    console.log('\n' + '─'.repeat(60));
    console.log(`\n💡 Pour tester les notifications:`);
    console.log(`   node scripts/test-all-notifications.js ${user.id}`);
    console.log(`   node scripts/test-all-notifications.js ${user.id} --send`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || null;
findUserId(email);
