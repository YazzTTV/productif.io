#!/usr/bin/env node

// Script pour créer une notification MORNING_ANCHOR immédiatement pour yazz (pour test)
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Création d\'une notification MORNING_ANCHOR immédiate pour yazz\n');

  try {
    const userIdentifier = process.argv[2] || 'yazz';
    
    let user = await prisma.user.findUnique({
      where: { email: userIdentifier.toLowerCase() }
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          name: {
            contains: userIdentifier,
            mode: 'insensitive'
          }
        }
      });
    }

    if (!user) {
      console.error(`❌ Utilisateur "${userIdentifier}" non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.name || user.email} (ID: ${user.id})\n`);

    // Créer une notification pour dans 2 minutes
    const now = new Date();
    const scheduledTime = new Date(now.getTime() + 2 * 60 * 1000); // Dans 2 minutes

    console.log(`📅 Création d'une notification pour: ${scheduledTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
    console.log(`   (UTC: ${scheduledTime.toISOString()})\n`);

    const notification = await prisma.notificationHistory.create({
      data: {
        userId: user.id,
        type: 'MORNING_ANCHOR',
        content: '🌅 Ta journée est prête',
        pushTitle: '🌅 Ta journée est prête',
        pushBody: 'Bonjour ! Voici un résumé de ta journée.',
        scheduledFor: scheduledTime,
        status: 'pending'
      }
    });

    console.log(`✅ Notification créée avec succès:`);
    console.log(`   - ID: ${notification.id}`);
    console.log(`   - Type: ${notification.type}`);
    console.log(`   - Statut: ${notification.status}`);
    console.log(`   - Programmée pour: ${scheduledTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
    console.log(`\n⏰ La notification sera traitée par le scheduler dans environ 2 minutes.\n`);

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
