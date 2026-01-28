/**
 * Script pour désactiver les notifications non souhaitées
 * Désactive : afternoonReminder, eveningReminder, nightReminder, taskReminder, habitReminder, motivation, dailySummary
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function disableUnwantedNotifications() {
  try {
    console.log('🔄 Désactivation des notifications non souhaitées...\n');

    const result = await prisma.notificationSettings.updateMany({
      where: {
        OR: [
          { afternoonReminder: true },
          { eveningReminder: true },
          { nightReminder: true },
          { taskReminder: true },
          { habitReminder: true },
          { motivation: true },
          { dailySummary: true },
        ],
      },
      data: {
        afternoonReminder: false,
        eveningReminder: false,
        nightReminder: false,
        taskReminder: false,
        habitReminder: false,
        motivation: false,
        dailySummary: false,
      },
    });

    console.log(`✅ ${result.count} utilisateur(s) mis à jour`);
    console.log('\n📋 Notifications désactivées :');
    console.log('   - afternoonReminder (après-midi)');
    console.log('   - eveningReminder (soir)');
    console.log('   - nightReminder (nuit)');
    console.log('   - taskReminder (tâches)');
    console.log('   - habitReminder (habitudes)');
    console.log('   - motivation (motivation)');
    console.log('   - dailySummary (résumé quotidien)');
    console.log('\n✅ Notifications actives :');
    console.log('   - morningReminder (matin)');
    console.log('   - noonReminder (midi)');
    console.log('   - recapReminder (récap)');
    console.log('   - improvementReminder (amélioration - déjà désactivé)');
    console.log('\n🎯 Les notifications premium (mood/stress/focus) restent configurables via leurs flags dédiés.');

  } catch (error) {
    console.error('❌ Erreur lors de la désactivation des notifications:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

disableUnwantedNotifications()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
