#!/usr/bin/env node

// Script pour activer les notifications push pour l'utilisateur yazz
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔔 Activation des notifications push pour yazz\n');

  try {
    // Chercher l'utilisateur yazz
    const userIdentifier = process.argv[2] || 'yazz';
    console.log(`🔍 Recherche de l'utilisateur: "${userIdentifier}"\n`);

    // Essayer par email d'abord
    let user = await prisma.user.findUnique({
      where: { email: userIdentifier.toLowerCase() },
      include: {
        notificationSettings: true
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
          notificationSettings: true
        }
      });
    }

    if (!user) {
      console.error(`❌ Utilisateur "${userIdentifier}" non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Nom: ${user.name || 'N/A'}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Préférences existantes: ${user.notificationSettings ? '✅' : '❌'}\n`);

    // Créer ou mettre à jour les préférences de notification
    const settings = await prisma.notificationSettings.upsert({
      where: { userId: user.id },
      update: {
        isEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        whatsappEnabled: false, // On active seulement push pour Android
        morningReminder: true,
        morningTime: '17:50', // Heure du rappel début de journée
        startHour: 0,
        endHour: 23,
        allowedDays: [1, 2, 3, 4, 5, 6, 7], // Tous les jours
        timezone: 'Europe/Paris'
      },
      create: {
        userId: user.id,
        isEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        whatsappEnabled: false,
        morningReminder: true,
        morningTime: '17:50',
        startHour: 0,
        endHour: 23,
        allowedDays: [1, 2, 3, 4, 5, 6, 7],
        timezone: 'Europe/Paris'
      }
    });

    console.log(`✅ Préférences de notification configurées:`);
    console.log(`   - Notifications activées: ${settings.isEnabled ? '✅' : '❌'}`);
    console.log(`   - Push activé: ${settings.pushEnabled ? '✅' : '❌'}`);
    console.log(`   - Email activé: ${settings.emailEnabled ? '✅' : '❌'}`);
    console.log(`   - Rappel matin: ${settings.morningReminder ? '✅' : '❌'}`);
    console.log(`   - Heure matin: ${settings.morningTime}`);
    console.log(`   - Plage horaire: ${settings.startHour}h - ${settings.endHour}h`);
    console.log(`   - Jours autorisés: ${settings.allowedDays.join(', ')}`);
    console.log(`   - Timezone: ${settings.timezone}\n`);

    // Vérifier s'il y a des tokens Android
    const androidTokens = await prisma.pushToken.findMany({
      where: {
        userId: user.id,
        platform: 'android'
      }
    });

    console.log(`📱 Tokens Android: ${androidTokens.length}`);
    if (androidTokens.length > 0) {
      androidTokens.forEach((token, idx) => {
        console.log(`   ${idx + 1}. ${token.token.substring(0, 20)}...${token.token.substring(token.token.length - 10)}`);
      });
    } else {
      console.log('   ⚠️  Aucun token Android trouvé. L\'utilisateur doit activer les notifications dans l\'app Android.');
    }

  } catch (error) {
    console.error('\n❌ Erreur:');
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
