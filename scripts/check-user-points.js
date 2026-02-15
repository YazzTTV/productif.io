#!/usr/bin/env node

/**
 * Vérifie les points de gamification d'un utilisateur (ex: après avoir coché des habitudes).
 *
 * Usage:
 *   node scripts/check-user-points.js
 *   node scripts/check-user-points.js --email noah.lugagne@free.fr
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

const EMAIL = process.argv.includes('--email')
  ? process.argv[process.argv.indexOf('--email') + 1]
  : 'noah.lugagne@free.fr';

// Date du jour à midi UTC (comme le frontend)
function getTodayNoon() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🔍 Recherche utilisateur:', EMAIL);

  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    console.log('❌ Utilisateur non trouvé.');
    process.exit(1);
  }

  console.log('✅ Utilisateur:', user.name || user.email, `(${user.id})\n`);

  // Gamification
  const gamification = await prisma.userGamification.findUnique({
    where: { userId: user.id },
  });

  if (!gamification) {
    console.log('📊 Gamification: aucune donnée (compte jamais initialisé).');
  } else {
    console.log('📊 Gamification:');
    console.log('   Points:', gamification.points);
    console.log('   Niveau:', gamification.level);
    console.log('   Streak actuel:', gamification.currentStreak);
    console.log('   Meilleur streak:', gamification.longestStreak);
    console.log('   Dernière activité:', gamification.lastActivityDate?.toISOString() ?? '—');
    console.log('');
  }

  // Entrées d'habitudes complétées aujourd'hui
  const today = getTodayNoon();
  const entriesToday = await prisma.habitEntry.findMany({
    where: {
      habit: { userId: user.id },
      date: today,
      completed: true,
    },
    include: { habit: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  console.log(`📅 Habitudes cochées aujourd'hui (${today.toISOString().split('T')[0]}):`, entriesToday.length);
  if (entriesToday.length > 0) {
    entriesToday.forEach((e) => console.log('   ✓', e.habit.name));
    console.log('\n💡 Chaque habitude cochée = 10 pts (+ bonus streak / journée parfaite si applicable).');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
