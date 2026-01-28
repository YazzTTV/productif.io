#!/usr/bin/env node

// Script pour modifier les préférences de notification de yazz et notifier le scheduler local
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔔 Modification des préférences de notification pour yazz\n');

  try {
    const userIdentifier = process.argv[2] || 'yazz';
    console.log(`🔍 Recherche de l'utilisateur: "${userIdentifier}"\n`);

    // Chercher l'utilisateur yazz
    let user = await prisma.user.findUnique({
      where: { email: userIdentifier.toLowerCase() },
      include: {
        notificationSettings: true
      }
    });

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

    // Récupérer les anciennes préférences
    const oldPreferences = user.notificationSettings;

    // Créer ou mettre à jour les préférences de notification
    const settings = await prisma.notificationSettings.upsert({
      where: { userId: user.id },
      update: {
        isEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        whatsappEnabled: false,
        morningReminder: true,
        morningTime: '10:10', // Heure du rappel début de journée
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

    // Notifier le scheduler local
    console.log('🔄 Notification du scheduler local (port 3001)...\n');
    
    const schedulerUrl = 'http://localhost:3001/api/update-user';
    
    try {
      const resp = await fetch(schedulerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          oldPreferences: oldPreferences || null,
          newPreferences: settings,
          timestamp: new Date()
        }),
        signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
      });

      if (resp.ok) {
        const result = await resp.json();
        console.log(`✅ Scheduler local notifié avec succès !`);
        console.log(`   - Jobs actifs: ${result.activeJobs || 'N/A'}`);
      } else {
        console.log(`⚠️ Le scheduler a répondu avec le statut: ${resp.status}`);
        const errorText = await resp.text();
        console.log(`   - Message: ${errorText}`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log(`⏱️ Timeout lors de la connexion au scheduler local`);
      } else {
        console.log(`⚠️ Erreur de connexion au scheduler local:`, err.message);
      }
      console.log(`\n💡 Vérifiez que le scheduler local tourne sur le port 3001:`);
      console.log(`   node src/services/scheduler-service.js`);
    }

    // Vérifier s'il y a des tokens Android
    const androidTokens = await prisma.pushToken.findMany({
      where: {
        userId: user.id,
        platform: 'android'
      }
    });

    console.log(`\n📱 Tokens Android: ${androidTokens.length}`);
    if (androidTokens.length > 0) {
      androidTokens.forEach((token, idx) => {
        console.log(`   ${idx + 1}. ${token.token.substring(0, 30)}... (créé: ${token.createdAt.toLocaleString('fr-FR')})`);
      });
    } else {
      console.log('   ⚠️  Aucun token Android trouvé. L\'utilisateur doit activer les notifications dans l\'app Android.');
    }

    console.log('\n✅ Script terminé avec succès !');

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
